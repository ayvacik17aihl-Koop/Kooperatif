'use client';
import { useState, useEffect, useCallback, use } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

interface Taksit {
  id: string;
  taksit_no: number;
  vade_tarihi: string;
  tutar: number;
  odenen_tutar: number;
  durum: string;
  toplu_borclandirmalar: {
    baslik: string;
  };
}

interface Kasa {
  id: string;
  kasa_adi: string;
}

interface OdemeYontemi {
  id: string;
  yontem_adi: string;
}

interface UyeDetay {
  id: string;
  uye_no: string;
  hisse_adedi: number;
  cari_id: string;
  cari_kartlari: {
    tam_ad: string;
    toplam_borc: number;
    toplam_alacak: number;
  };
}

export default function UyeDetayPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15+ asenkron params unwrap işlemi
  const resolvedParams = use(params);
  const uyeId = resolvedParams.id;

  const [uye, setUye] = useState<UyeDetay | null>(null);
  const [taksitler, setTaksitler] = useState<Taksit[]>([]);
  const [kasalar, setKasalar] = useState<Kasa[]>([]);
  const [yontemler, setYontemler] = useState<OdemeYontemi[]>([]);
  const [loading, setLoading] = useState(true);

  // Tahsilat Form State'leri
  const [seciliTaksit, setSeciliTaksit] = useState<Taksit | null>(null);
  const [seciliKasaId, setSeciliKasaId] = useState('');
  const [seciliYontemId, setSeciliYontemId] = useState('');
  const [tahsilatTutari, setTahsilatTutari] = useState(0);
  const [modalLoading, setModalLoading] = useState(false);

  const supabase = createClient();

  // 🚀 Tüm Sayfa Verilerini Canlı Getiren Ana Fonksiyon
  const sayfaVerileriniGetir = useCallback(async () => {
    setLoading(true);

    try {
      // 1. Üye ve Cari Hesap Bilgilerini Çek
      const { data: uyeData, error: uyeError } = await supabase
        .from('uyeler')
        .select('id, uye_no, hisse_adedi, cari_id, cari_kartlari(tam_ad, toplam_borc, toplam_alacak)')
        .eq('id', uyeId)
        .single();

      if (uyeError) throw uyeError;

      if (uyeData) {
        setUye(uyeData as unknown as UyeDetay);

        // 2. Üyeye Bağlı Taksitleri Listele
        const { data: taksitData, error: taksitError } = await supabase
          .from('uye_taksitleri')
          .select('id, taksit_no, vade_tarihi, tutar, odenen_tutar, durum, toplu_borclandirmalar(baslik)')
          .eq('cari_id', uyeData.cari_id)
          .order('vade_tarihi', { ascending: true });

        if (taksitError) throw taksitError;
        if (taksitData) setTaksitler(taksitData as unknown as Taksit[]);
      }

      // 3. Aktif Kasa Listesini Çek
      const { data: kasaData, error: kasaError } = await supabase
        .from('kasa_kartlari')
        .select('id, kasa_adi');

      if (kasaError) throw kasaError;
      if (kasaData) {
        setKasalar(kasaData);
        if (kasaData.length > 0 && !seciliKasaId) setSeciliKasaId(kasaData[0].id);
      }

      // 4. Veritabanından Canlı Ödeme Yöntemlerini Çek (Mimarinin Kalbi)
      const { data: yontemData, error: yontemError } = await supabase
        .from('odeme_yontemleri')
        .select('id, yontem_adi')
        .eq('aktif_mi', true);

      if (yontemError) throw yontemError;
      if (yontemData) {
        setYontemler(yontemData);
        if (yontemData.length > 0 && !seciliYontemId) setSeciliYontemId(yontemData[0].id);
      }

    } catch (err: any) {
      console.error("Mali veriler çekilirken bir hata oluştu:", err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase, uyeId, seciliKasaId, seciliYontemId]);

  useEffect(() => {
    sayfaVerileriniGetir();
  }, [sayfaVerileriniGetir]);

  // 🚀 Yeni Dinamik RPC Tetikleme Fonksiyonu
  const handleTahsilatMakbuzu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seciliTaksit || !seciliKasaId || !seciliYontemId || tahsilatTutari <= 0) return;

    setModalLoading(true);

    const { error } = await supabase.rpc('sp_taksit_tahsil_et', {
      p_taksit_id: seciliTaksit.id,
      p_kasa_id: seciliKasaId,
      p_tutar: tahsilatTutari,
      p_odeme_yontemi_id: seciliYontemId // Arka plana dinamik uuid gidiyor
    });

    setModalLoading(false);

    if (error) {
      alert(`Tahsilat işlenirken hata: ${error.message}`);
    } else {
      alert('Tahsilat başarıyla işlendi. Kasa, hareket logları ve üyenin cari borcu senkronize edildi.');
      setSeciliTaksit(null);
      sayfaVerileriniGetir(); // Sayfayı canlandır
    }
  };

  const modalAc = (taksit: Taksit) => {
    setSeciliTaksit(taksit);
    setTahsilatTutari(taksit.tutar - taksit.odenen_tutar); // Kalan borç tutarını otomatik forma yaz
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-semibold">Mali hesap dökümü hazırlanıyor...</div>;
  if (!uye) return <div className="p-8 text-center text-red-500">Üye cari matrisi bulunamadı.</div>;

  const netBorc = (uye.cari_kartlari?.toplam_borc || 0) - (uye.cari_kartlari?.toplam_alacak || 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Üst Yol Menüsü */}
      <div className="text-sm text-gray-400 mb-2">
        <Link href="/admin/uyeler" className="hover:underline">Üyeler</Link> &gt; <span className="text-gray-600 font-medium">Mali Ekstre</span>
      </div>

      {/* Üye Cari Bilgi Özeti */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Mali Muhatap / Üye</div>
          <div className="text-xl font-bold mt-1">{uye.cari_kartlari?.tam_ad || 'İsim Bilgisi İşlenmemiş'}</div>
          <div className="text-xs text-slate-400 mt-0.5">Üye No: {uye.uye_no} | Sicil Hissesi: {uye.hisse_adedi} Adet</div>
        </div>
        <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700/50">
          <div className="text-slate-400 text-[11px] font-semibold uppercase">Yüklenen Toplam Borç</div>
          <div className="text-lg font-mono font-bold text-red-400 mt-1">{uye.cari_kartlari?.toplam_borc} TL</div>
        </div>
        <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700/50">
          <div className="text-slate-400 text-[11px] font-semibold uppercase">Toplam Tahsil Edilen</div>
          <div className="text-lg font-mono font-bold text-emerald-400 mt-1">{uye.cari_kartlari?.toplam_alacak} TL</div>
        </div>
        <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700/50">
          <div className="text-slate-400 text-[11px] font-semibold uppercase">Net Kalan Bakiye</div>
          <div className={`text-lg font-mono font-bold mt-1 ${netBorc > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
            {netBorc} TL
          </div>
        </div>
      </div>

      {/* Taksit Planlama Cetveli */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 font-bold text-gray-700 text-sm">Üyeye Tanımlanmış Taksit Cetveli</div>
        
        {taksitler.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Bu üyeye ait aktif borç veya taksit planı bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-100 border-b text-gray-600 font-semibold uppercase">
                  <th className="p-4">Taksit Sıra</th>
                  <th className="p-4">Borçlanma Başlığı</th>
                  <th className="p-4">Vade Tarihi</th>
                  <th className="p-4">Taksit Tutarı</th>
                  <th className="p-4">Ödenen</th>
                  <th className="p-4">Kalan</th>
                  <th className="p-4 text-center">Mali Durum</th>
                  <th className="p-4 text-right">Eylem</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {taksitler.map((t) => {
                  const kalan = t.tutar - t.odenen_tutar;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{t.taksit_no}. Taksit</td>
                      <td className="p-4 font-medium text-gray-600">{t.toplu_borclandirmalar?.baslik || 'Genel Borç Hesabı'}</td>
                      <td className="p-4 text-gray-500">{new Date(t.vade_tarihi).toLocaleDateString('tr-TR')}</td>
                      <td className="p-4 font-mono font-semibold text-gray-900">{t.tutar} TL</td>
                      <td className="p-4 font-mono text-emerald-600 font-medium">{t.odenen_tutar} TL</td>
                      <td className="p-4 font-mono text-amber-700 font-semibold">{kalan} TL</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                          t.durum === 'Odedi' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          t.durum === 'Odeniyor' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {t.durum === 'Odedi' ? 'Ödendi' : t.durum === 'Odeniyor' ? 'Kısmi Ödeme' : 'Ödenmedi'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {kalan > 0 ? (
                          <button
                            onClick={() => modalAc(t)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-[11px] transition-all"
                          >
                            💰 Tahsil Et
                          </button>
                        ) : (
                          <span className="text-gray-400 font-medium italic text-[11px]">Hesap Kapalı</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 💳 DİNAMİK TAHSİLAT MAKBUZ MODALI */}
      {seciliTaksit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="font-bold text-gray-800 text-base">Tahsilat Makbuzu ({seciliTaksit.taksit_no}. Taksit)</h3>
              <button onClick={() => setSeciliTaksit(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>
            
            <form onSubmit={handleTahsilatMakbuzu} className="flex flex-col gap-4 text-sm">
              {/* Kasa Seçimi */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PARANIN GİRECEĞİ HESAP / KASA</label>
                <select
                  value={seciliKasaId}
                  onChange={(e) => setSeciliKasaId(e.target.value)}
                  className="w-full p-2 border rounded text-black bg-gray-50 outline-none focus:bg-white text-xs"
                  required
                >
                  {kasalar.map((k) => <option key={k.id} value={k.id}>{k.kasa_adi}</option>)}
                </select>
              </div>

              {/* Dinamik Ödeme Yöntemi Seçimi (Veritabanından Beslenen Alan) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ÖDEME KANALI / YÖNTEMİ</label>
                <select
                  value={seciliYontemId}
                  onChange={(e) => setSeciliYontemId(e.target.value)}
                  className="w-full p-2 border rounded text-black bg-gray-50 outline-none focus:bg-white text-xs"
                  required
                >
                  {yontemler.map((y) => <option key={y.id} value={y.id}>{y.yontem_adi}</option>)}
                </select>
              </div>

              {/* Tahsilat Tutarı */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">TAHSİL EDİLEN TUTAR (TL)</label>
                <input
                  type="number"
                  step="0.01"
                  max={seciliTaksit.tutar - seciliTaksit.odenen_tutar}
                  value={tahsilatTutari}
                  onChange={(e) => setTahsilatTutari(Number(e.target.value))}
                  className="w-full p-2 border rounded text-black bg-gray-50 font-mono focus:bg-white outline-none text-xs"
                  required
                />
              </div>

              {/* Form Butonları */}
              <div className="flex justify-end gap-2 mt-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setSeciliTaksit(null)}
                  className="px-4 py-2 rounded text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || kasalar.length === 0 || yontemler.length === 0}
                  className="px-4 py-2 rounded text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                >
                  {modalLoading ? 'Makbuz İşleniyor...' : 'Tahsilatı Onayla ve Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}