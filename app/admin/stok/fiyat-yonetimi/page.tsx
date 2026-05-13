'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function FiyatYonetimiPage() {
  const supabase = createClient();
  const [stoklar, setStoklar] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [ozelOran, setOzelOran] = useState<number>(10); // Kullanıcının yazacağı değer

  useEffect(() => { fetchStoklar(); }, []);

  const fetchStoklar = async () => {
    const { data } = await supabase.from('stok_kartlari').select('*').order('urun_adi');
    if (data) setStoklar(data.map(s => ({ ...s, yeni_fiyat: s.satis_fiyati })));
  };

  const topluHesapla = (yuzde: number) => {
    setStoklar(stoklar.map(item => ({
      ...item,
      yeni_fiyat: Number((item.satis_fiyati * (1 + yuzde / 100)).toFixed(2))
    })));
  };

  const kaydet = async () => {
    setIsSaving(true);
    try {
      const guncellenecekler = stoklar.map(s => ({ id: s.id, yeni_fiyat: s.yeni_fiyat }));
      const { error } = await supabase.rpc('toplu_stok_fiyat_guncelle', { urun_listesi: guncellenecekler });
      if (error) throw error;
      alert("Fiyatlar güncellendi!");
      fetchStoklar();
    } catch (e: any) { alert(e.message); }
    setIsSaving(false);
  };

  return (
    <div className="p-6 bg-[#0f172a] min-h-screen text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ARAÇ ÇUBUĞU */}
        <div className="bg-[#1e293b] p-6 rounded-3xl border border-slate-700 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#0f172a] p-2 rounded-2xl border border-slate-700 flex items-center">
              <span className="px-4 font-bold text-slate-500">%</span>
              <input 
                type="number" 
                value={ozelOran}
                onChange={(e) => setOzelOran(Number(e.target.value))}
                className="w-20 bg-transparent text-2xl font-black text-indigo-400 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => topluHesapla(ozelOran)} className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-bold transition-all">
                Artır (+)
              </button>
              <button onClick={() => topluHesapla(-ozelOran)} className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl font-bold transition-all">
                İndir (-)
              </button>
            </div>
          </div>

          <button 
            onClick={kaydet}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-500 px-10 py-4 rounded-2xl font-black text-lg shadow-lg shadow-emerald-900/20"
          >
            {isSaving ? "KAYDEDİLİYOR..." : "DEĞİŞİKLİKLERİ ONAYLA"}
          </button>
        </div>

        {/* TABLO */}
        <div className="bg-[#1e293b] rounded-3xl border border-slate-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-800 text-[10px] font-black uppercase text-slate-500">
              <tr>
                <th className="p-4">Ürün</th>
                <th className="p-4">Mevcut</th>
                <th className="p-4 w-40 text-indigo-400">Yeni Fiyat</th>
                <th className="p-4">Fark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {stoklar.map(item => {
                const fark = item.yeni_fiyat - item.satis_fiyati;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="p-4 font-bold">{item.urun_adi}</td>
                    <td className="p-4 text-slate-400">{item.satis_fiyati.toFixed(2)} ₺</td>
                    <td className="p-4">
                      <input 
                        type="number"
                        value={item.yeni_fiyat}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setStoklar(stoklar.map(s => s.id === item.id ? {...s, yeni_fiyat: val} : s));
                        }}
                        className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2 text-indigo-400 font-bold"
                      />
                    </td>
                    <td className={`p-4 font-mono ${fark > 0 ? 'text-emerald-400' : fark < 0 ? 'text-red-400' : 'text-slate-600'}`}>
                      {fark > 0 ? `+${fark.toFixed(2)}` : fark.toFixed(2)} ₺
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}