'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

interface BorclandirmeGecmisi {
  id: string;
  baslik: string;
  tipi: string;
  toplam_tutar: number;
  taksit_sayisi: number;
  baslangic_tarihi: string;
}

export default function BorclandirmePage() {
  const [gecmis, setGecmis] = useState<BorclandirmeGecmisi[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State'leri
  const [baslik, setBaslik] = useState('');
  const [tipi, setTipi] = useState('Aidat');
  const [toplamTutar, setToplamTutar] = useState(1000); // Hisse başına düşecek tutar
  const [taksitSayisi, setTaksitSayisi] = useState(1);
  const [baslangicTarihi, setBaslangicTarihi] = useState(new Date().toISOString().split('T')[0]);
  const [btnLoading, setBtnLoading] = useState(false);

  const supabase = createClient();

  // 🚀 ESLint Hatalarını Düzelten Güvenli Fonksiyon Tanımı
  // useCallback kullanarak fonksiyonun her renderda gereksiz yere yeniden oluşmasını engelliyoruz
  const gecmisiGetir = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('toplu_borclandirmalar')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setGecmis(data as BorclandirmeGecmisi[]);
    setLoading(false);
  }, [supabase]);

  // 🚀 Bağımlılık dizisi (deps) kurallara %100 uyumlu hale getirildi
  useEffect(() => {
    gecmisiGetir();
  }, [gecmisiGetir]);

  const handleBorclandir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baslik.trim()) return;

    setBtnLoading(true);

    // RPC kullanarak yazdığımız veritabanı fonksiyonunu tetikliyoruz
    const { error } = await supabase.rpc('sp_toplu_borclandir_ve_taksitlendir', {
      p_baslik: baslik.trim(),
      p_tipi: tipi,
      p_toplam_tutar: toplamTutar,
      p_taksit_sayisi: taksitSayisi,
      p_baslangic_tarihi: baslangicTarihi
    });

    setBtnLoading(false);

    if (error) {
      alert(`Borçlandırma esnasında hata: ${error.message}`);
    } else {
      alert('Toplu borçlandırma ve üye taksitleri başarıyla oluşturuldu!');
      setBaslik('');
      gecmisiGetir(); // İşlem bitince listeyi güvenle yeniliyoruz
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-semibold">Finansal veriler yükleniyor...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="text-sm text-gray-400 mb-2">
        Muhasebe &gt; <span className="text-gray-600 font-medium">Toplu Borçlandırma</span>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Toplu Üye Borçlandırma</h1>
      <p className="text-gray-500 text-sm mb-8">
        Tüm aktif üyelere, hisseleri oranında yansıtılacak aidat, ek bütçe veya demirbaş ödemelerini buradan tek tıkla taksitlendirebilirsiniz.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Alanı */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-bold text-gray-700 mb-4">Yeni Borç Şablonu</h2>
          <form onSubmit={handleBorclandir} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">AÇIKLAMA / BAŞLIK</label>
              <input 
                type="text" 
                placeholder="Örn: 2026 Dönemi Sulama Aidatı"
                value={baslik} 
                onChange={(e) => setBaslik(e.target.value)}
                className="w-full text-sm p-2 rounded border text-black bg-gray-50 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500" 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">BORÇ TİPİ</label>
              <select 
                value={tipi} 
                onChange={(e) => setTipi(e.target.value)}
                className="w-full text-sm p-2 rounded border text-black bg-gray-50 outline-none focus:bg-white"
              >
                <option value="Aidat">Periyodik Aidat</option>
                <option value="Ek Bütçe">Ek Bütçe Katılımı</option>
                <option value="Demirbaş">Demirbaş / Altyapı Yatırımı</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">TUTAR (HİSSE BAŞINA - TRY)</label>
              <input 
                type="number" 
                value={toplamTutar} 
                onChange={(e) => setToplamTutar(Number(e.target.value))}
                className="w-full text-sm p-2 rounded border text-black bg-gray-50 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500" 
                required 
              />
              <span className="text-[10px] text-amber-600 mt-1 block">⚠️ 2 hissesi olan üye bu tutarın 2 katı kadar borçlanacaktır.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">TAKSİT SAYISI</label>
              <input 
                type="number" 
                min="1" 
                max="12"
                value={taksitSayisi} 
                onChange={(e) => setTaksitSayisi(Number(e.target.value))}
                className="w-full text-sm p-2 rounded border text-black bg-gray-50 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500" 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">İLK VADE TARİHİ</label>
              <input 
                type="date" 
                value={baslangicTarihi} 
                onChange={(e) => setBaslangicTarihi(e.target.value)}
                className="w-full text-sm p-2 rounded border text-black bg-gray-50 outline-none focus:bg-white" 
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={btnLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded text-sm transition-colors disabled:bg-gray-400"
            >
              {btnLoading ? 'İşlem Sunucuda Dönüyor...' : 'Borçlandırmayı Başlat'}
            </button>
          </form>
        </div>

        {/* Geçmiş Borçlandırmalar Listesi */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 font-bold text-gray-700">Geçmiş Toplu İşlemler</div>
          {gecmis.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Henüz toplu bir borç kaydı oluşturulmamış.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b text-gray-600 text-xs font-bold uppercase">
                    <th className="p-4">Başlık</th>
                    <th className="p-4">Tip</th>
                    <th className="p-4">Hisse Başı Tutar</th>
                    <th className="p-4">Taksit</th>
                    <th className="p-4">Başlangıç</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {gecmis.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{g.baslik}</td>
                      <td className="p-4">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                          {g.tipi}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-semibold text-gray-900">{g.toplam_tutar} TRY</td>
                      <td className="p-4">{g.taksit_sayisi} Ay</td>
                      <td className="p-4 text-gray-500">
                        {new Date(g.baslangic_tarihi).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}