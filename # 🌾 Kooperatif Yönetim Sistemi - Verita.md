# 🌾 Kooperatif Yönetim Sistemi - Veritabanı Master Planı

Bu döküman, sistemin ilişkisel veritabanı (PostgreSQL/Supabase) mimarisini, normalizasyon kurallarını ve yetkilendirme (RBAC) yapısını içeren ana kaynaktır (**Single Source of Truth**). Yapılacak tüm veritabanı güncellemeleri ve yeni tablo eklemeleri bu plana sadık kalınarak yapılacaktır.

---

## 🛠️ 1. Mevcut Tabloların Güncellenmesi (Normalizasyon & Performans)

### `public.profiles` (Revizyon)
* **Değişiklik:** `role` (USER-DEFINED Enum) sütunu bu tablodan kaldırılacak. Rol yönetimi tamamen bağımsız ve ilişkisel tablolara (`roller`, `kullanici_rolleri`) aktarılacak.
* **İlişki:** `auth.users(id)` tablosuna birebir (1:1) bağımlı kalmaya devam edecek.

### `public.cari_kartlari` (Revizyon)
* **Değişiklik:** `bakiye` alanı tablodan fiziksel olarak **kaldırılacak** (3NF İhlali ve Veri Tutarsızlığı Riski). Bakiye bilgisi statik tutulmayıp, `toplam_alacak - toplam_borc` formülüyle her zaman dinamik hesaplanacak veya SQL View kullanılacak.
* **Performans (Index):** Hızlı arama ve filtreleme için `tc_no` ve `cari_tipi` alanlarına B-Tree Index eklenecek.

### `public.kasa_kartlari` (Revizyon)
* **Değişiklik:** `guncel_bakiye` alanı tablodan **kaldırılacak** (3NF İhlali). `toplam_giris - toplam_cikis` farkı dinamik olarak sorgulanacak.

### `public.hareketler` (Performans Optimizasyonu)
* **Değişiklik:** Veri hacmi büyüdüğünde raporlama ve JOIN işlemlerinin kilitlenmemesi için `cari_id`, `kasa_id`, `stok_id` ve `tarih` alanlarına **Foreign Key Endeksleri (Index)** tanımlanacak.

---

## 🔐 2. İdari ve Yetkilendirme Kurul Tabloları (RBAC - Modüler Yetki)

### `public.roller` (Yeni Tablo)
* **Görevi:** Kooperatif organlarını ve görev tanımlarını tutar.
* **Alanlar:** `id (uuid, PK)`, `rol_adi (text, UNIQUE)` (Örn: 'Başkan', 'Muhasip', 'Veznedar', 'Personel', 'Üye'), `aciklama (text)`.

### `public.kullanici_rolleri` (Yeni Tablo)
* **Görevi:** Kullanıcılar ile rolleri eşleştirir.
* **İlişki:** `profiles(id)` ve `roller(id)` arasında **Çoktan Çoğa (Many-to-Many)** ilişki kurar. (Örn: Bir kişi hem 'Üye' hem 'Muhasip' olabilir).
* **Alanlar:** `kullanici_id (uuid, FK)`, `rol_id (uuid, FK)`.

### `public.izinler` (Yeni Tablo)
* **Görevi:** Hangi rolün hangi ekranlara/modüllere erişebileceğini belirler. Middleware bu tablodan beslenecektir.
* **İlişki:** `roller(id)` tablosuna Çoktan Teke (Many-to-One) bağlıdır.
* **Alanlar:** `id (uuid, PK)`, `rol_id (uuid, FK)`, `modul_adi (text)` (Örn: 'muhasebe', 'stok', 'ayarlar'), `islem_tipi (text)` (Örn: 'READ', 'WRITE', 'ALL').

---

## 👥 3. Üyelik ve Finansal Yapı Tabloları (Aidat & Proje Takibi)

### `public.uyeler` (Yeni Tablo)
* **Görevi:** Üyenin hukuki ve idari kooperatif kimliğini tutar.
* **İlişki:** `cari_kartlari(id)` tablosuna **Birebir (1:1)** ilişki ile sıkı bağlıdır. Her üyenin mutlaka bir carisi vardır; ancak gübre aldığımız tedarikçi gibi her carinin üye kaydı yoktur. Üyenin tüm mali bilançosu bu cari üzerinden döner.
* **Alanlar:** `id (uuid, PK)`, `cari_id (uuid, UNIQUE, FK)`, `uye_no (text, UNIQUE)`, `hisse_adedi (int)`, `uyelik_tarihi (date)`, `durum (text)`.

### `public.toplu_borclandirmalar` (Yeni Tablo)
* **Görevi:** Yönetim kurulunun aldığı aidat veya proje bazlı borçlandırma kararlarının ana şablonudur.
* **Alanlar:** `id (uuid, PK)`, `baslik (text)` (Örn: 'Haziran 2026 Aidatı'), `tipi (text)` ('Aidat' veya 'Proje'), `toplam_tutar (numeric)`, `taksit_sayisi (int)`, `baslangic_tarihi (date)`.

### `public.uye_taksitleri` (Yeni Tablo)
* **Görevi:** Üyelerin ay ay ödemesi gereken planlı taksit takvimini (Ödeme Planı) tutar.
* **İlişki:** `toplu_borclandirmalar(id)` ve `cari_kartlari(id)` tablolarına göbekten bağlıdır.
* **Alanlar:** `id (uuid, PK)`, `borclandirme_id (uuid, FK)`, `cari_id (uuid, FK)`, `taksit_no (int)`, `vade_tarihi (date)`, `tutar (numeric)`, `durum (text)` ('Odenmedi', 'Kismen Odendi', 'Odendi').

---

## 📊 4. Temel İşleyiş ve Muhasebe Kuralları

1. **Tek Bakiye İlkesi:** Üyenin aidat borcu, proje taksiti ya da kooperatif marketinden aldığı yem/gübre borcu ayrı yerlerde dağınık durmaz; hepsi tek bir çatı altında (`cari_kartlari.toplam_borc`) birikir.
2. **Üye Alışverişi:** Üye mal aldığında `faturalar` ve `fatura_satirlari` üzerinden standart bir **Satış Faturası** kesilir ve carisine borç kaydedilir.
3. **Tahsilat Dağıtımı:** Üye kasaya ödeme yaptığında (Tahsilat hareketi oluşturuğunda), alınan tutar üyenin `uye_taksitleri` tablosundaki en eski vadeli (FIFO - İlk giren ilk çıkar) borcundan otomatik olarak düşülür.