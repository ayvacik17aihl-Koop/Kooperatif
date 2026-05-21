'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

interface Uye {
  id: string;
  uye_no: string;
  hisse_adedi: number;
  uyelik_tarihi: string;
  durum: string;
  cari_id: string;
  // Detaylı görünüm için sol join ile çekeceğimiz cari bilgileri
  cari_kartlari?: {
    tam_ad: string;
    tc_no: string;
    telefon: string;
    adres: string;
    toplam_borc: number;
    toplam_alacak: number;
  };
}

export default function UyelerPage() {
  const [uyeler, setUyeler] = useState<Uye[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Yeni Üye Form State'leri
  const [uyeNo, setUyeNo] = useState('');
  const [hisseAdedi, setHisseAdedi] = useState(1);
  const [formLoading, setFormLoading] = useState(false);

  // Düzenleme Modalı State'leri (Cariyi İşleme Alanı)
  const [seciliUye, setSeciliUye] = useState<Uye | null>(null);
  const [modalTamAd, setModalTamAd] = useState('');
  const [modalTcNo, setModalTcNo] = useState('');
  const [modalTelefon, setModalTelefon] = useState('');
  const [modalAdres, setModalAdres] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const supabase = createClient();

  // 1. Üyeleri ve Bağlı Cari Kart Bilgilerini Birlikte Çek (İlişkisel Sorgu)
  const uyeleriGetir = useCallback(async () => {
    setLoading(true);
    
    // Supabase ilişkisel gücü: uyeler tablosunu çekerken, içindeki cari_id üzerinden 
    // cari_kartlari tablosundaki sütunları da tek sorguda alt nesne olarak çekiyoruz.
    const { data, error } = await supabase
      .from('uyeler')
      .select(`
        id, uye_no, hisse_adedi, uyelik_tarihi, durum, cari_id,
        cari_kartlari (
          tam_ad, tc_no, telefon, adres, toplam_borc, toplam_alacak
        )
      `)
      .order('uyelik_tarihi', { ascending: false });
      
    if (!error && data) {
      setUyeler(data as unknown as Uye[]);
    } else if (error) {
      console.error("Üye ve cari çekme hatası:", error.message);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    uyeleriGetir();
  }, [uyeleriGetir]);

  // 2. Yeni Üye Kaydı (İdari ilk açılış)
  const uyeEkle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uyeNo.trim()) return;
    setFormLoading(true);

    const { error } = await supabase
      .from('uyeler')
      .insert({
        uye_no: uyeNo.trim(),
        hisse_adedi: hisseAdedi,
        durum: 'Aktif'
      });

    setFormLoading(false);
    if (error) {
      alert(`Üye eklenirken hata oluştu: ${error.message}`);
    } else {
      setUyeNo('');
      setHisseAdedi(1);
      uyeleriGetir();
    }
  };

  // 3. Cari ve Üye Bilgilerini Güncelleme (Cariye Gerçek Bilgileri İşleme)
  const cariBilgileriniKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seciliUye) return;

    setModalLoading(true);

    // Adım A: Cari Kartlar tablosundaki mali ve kişisel alanları güncelle
    const { error: cariError } = await supabase
      .from('cari_kartlari')
      .update({
        tam_ad: modalTamAd.trim(),
        tc_no: modalTcNo.trim() || null, // Şemadaki UNIQUE kısıtlaması için boşsa null geçiyoruz
        telefon: modalTelefon.trim(),
        adres: modalAdres.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', seciliUye.cari_id);

    // Adım B: Üyeler tablosundaki idari alanları güncelle (Örn: Hisse sayısı değiştiyse)
    const { error: uyeError } = await supabase
      .from('uyeler')
      .update({
        hisse_adedi: hisseAdedi
      })
      .eq('id', seciliUye.id);

    setModalLoading(false);

    if (cariError || uyeError) {
      alert(`Güncelleme hatası: ${cariError?.message || uyeError?.message}`);
    } else {
      setSeciliUye(null); // Modalı kapat
      uyeleriGetir(); // Listeyi canlandır
    }
  };

  // Düzenle Butonuna Basıldığında Formu Doldurma Fonksiyonu
  const duzenlemeModaliAc = (uye: Uye) => {
    setSeciliUye(uye);
    setHisseAdedi(uye.hisse_adedi);
    setModalTamAd(uye.cari_kartlari?.tam_ad || '');
    setModalTcNo(uye.cari_kartlari?.tc_no || '');
    setModalTelefon(uye.cari_kartlari?.telefon || '');
    setModalAdres(uye.cari_kartlari?.adres || '');
  };

  // Üye Durumu Değiştirme
  const durumDegistir = async (id: string, mevcutDurum: string) => {
    const yeniDurum = mevcutDurum === 'Aktif' ? 'Pasif' : 'Aktif';
    const { error } = await supabase.from('uyeler').update({ durum: yeniDurum }).eq('id', id);
    if (!error) uyeleriGetir();
  };

  if (loading) return <div className="p-8 text-center font-semibold text-gray-600">Üye ve Cari Matrisi Yükleniyor...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Kooperatif Üye & Cari Yönetimi</h1>
      <p className="text-gray-500 text-sm mb-8">Üyelerin idari ve mali cari kart entegrasyonu. İsim ve kimlik bilgilerini işlemek için sağdaki "Düzenle" butonunu kullanın.</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sol Sütun: Hızlı Üye Numarası Tanımlama */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-base font-bold text-gray-700 mb-4">1. Hızlı Üye No Tanımla</h2>
          <form onSubmit={uyeEkle} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">ÜYE NUMARASI</label>
              <input 
                type="text"
                placeholder="Örn: UYE-003"
                value={uyeNo}
                onChange={(e) => setUyeNo(e.target.value)}
                disabled={formLoading}
                className="w-full text-sm p-2 border rounded text-black bg-gray-50 outline-none focus:bg-white focus:ring-1 focus:ring-green-500"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={formLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded text-xs transition-colors"
            >
              {formLoading ? 'Açılıyor...' : '+ Üye Kaydı Aç'}
            </button>
          </form>
        </div>

        {/* Sağ Sütun: Gelişmiş Üye & Cari Entegre Listesi */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-700 text-sm">Üye Sicil ve Cari Durum Listesi ({uyeler.length})</h2>
          </div>
          
          {uyeler.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Sisteme kayıtlı üye bulunmamaktadır.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 font-semibold uppercase border-b">
                    <th className="p-3">Üye No</th>
                    <th className="p-3">Cari İsim / Ünvan</th>
                    <th className="p-3">T.C. No</th>
                    <th className="p-3">Hisse</th>
                    <th className="p-3">Mali Bakiye</th>
                    <th className="p-3 text-center">Durum</th>
                    <th className="p-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {uyeler.map((uye) => (
                    <tr key={uye.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-bold text-gray-900">{uye.uye_no}</td>
                      <td className="p-3 font-medium text-gray-800">
                        {uye.cari_kartlari?.tam_ad || <span className="text-red-400 italic">İşlenmemiş</span>}
                      </td>
                      <td className="p-3 text-gray-500 font-mono">{uye.cari_kartlari?.tc_no || '-'}</td>
                      <td className="p-3 font-semibold">{uye.hisse_adedi} Adet</td>
                      <td className="p-3 font-mono">
                        <span className="text-red-600 font-semibold">-{uye.cari_kartlari?.toplam_borc} TL</span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => durumDegistir(uye.id, uye.durum)}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            uye.durum === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {uye.durum}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => duzenlemeModaliAc(uye)}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-2.5 py-1 rounded border border-blue-200 text-[11px]"
                        >
                          ⚙️ Cariyi İşle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 🛠️ CARİ BİLGİLERİNİ İŞLEME MODALI (POPUP) */}
      {seciliUye && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-bold text-gray-800 text-base">Cari Kart Bilgilerini İşle ({seciliUye.uye_no})</h3>
              <button onClick={() => setSeciliUye(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>
            
            <form onSubmit={cariBilgileriniKaydet} className="flex flex-col gap-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ÜYE ADI SOYADI / TAM AD</label>
                <input 
                  type="text" 
                  value={modalTamAd} 
                  onChange={(e) => setModalTamAd(e.target.value)} 
                  className="w-full text-sm p-2 border rounded text-black bg-gray-50 focus:bg-white outline-none"
                  placeholder="Örn: Ahmet Yılmaz"
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">T.C. KİMLİK NUMARASI</label>
                <input 
                  type="text" 
                  maxLength={11}
                  value={modalTcNo} 
                  onChange={(e) => setModalTcNo(e.target.value)} 
                  className="w-full text-sm p-2 border rounded text-black bg-gray-50 focus:bg-white outline-none font-mono"
                  placeholder="11 Haneli TC No"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">HİSSE ADEDİ</label>
                <input 
                  type="number" 
                  min={1}
                  value={hisseAdedi} 
                  onChange={(e) => setHisseAdedi(Number(e.target.value))} 
                  className="w-full text-sm p-2 border rounded text-black bg-gray-50 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">TELEFON</label>
                <input 
                  type="tel" 
                  value={modalTelefon} 
                  onChange={(e) => setModalTelefon(e.target.value)} 
                  className="w-full text-sm p-2 border rounded text-black bg-gray-50 focus:bg-white outline-none"
                  placeholder="05xx xxx xx xx"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ADRES</label>
                <textarea 
                  value={modalAdres} 
                  onChange={(e) => setModalAdres(e.target.value)} 
                  className="w-full text-sm p-2 border rounded text-black bg-gray-50 focus:bg-white outline-none h-16 resize-none"
                  placeholder="Kooperatif parsel no veya ikamet adresi..."
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 border-t pt-3">
                <button 
                  type="button" 
                  onClick={() => setSeciliUye(null)} 
                  className="px-4 py-2 rounded text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-600"
                >
                  Vazgeç
                </button>
                <button 
                  type="submit" 
                  disabled={modalLoading}
                  className="px-4 py-2 rounded text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                >
                  {modalLoading ? 'Cariye İşleniyor...' : 'Mali Kartı Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}