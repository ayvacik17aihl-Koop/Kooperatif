'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TopluSatisPage() {
  const supabase = createClient();
  const [stoklar, setStoklar] = useState<any[]>([]);
  const [cariler, setCariler] = useState<any[]>([]);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  
  // Arama State'leri
  const [cariSearch, setCariSearch] = useState('');
  const [urunSearch, setUrunSearch] = useState('');
  const [isCariOpen, setIsCariOpen] = useState(false);
  const [isUrunOpen, setIsUrunOpen] = useState(false);

  const [fatura, setFatura] = useState({
    fatura_no: `TS-${Math.floor(100000 + Math.random() * 900000)}`,
    tarih: new Date().toISOString().split('T')[0],
    cari_id: '',
    cari_ad: '',
    iskonto_orani: 0,
  });
  const [satirlar, setSatirlar] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: sData } = await supabase.from('stok_kartlari').select('*').order('urun_adi');
      const { data: cData } = await supabase.from('cari_kartlari').select('*').order('tam_ad');
      if (sData) setStoklar(sData);
      if (cData) setCariler(cData);
    };
    fetchData();
  }, []);

  const araToplam = satirlar.reduce((acc, s) => acc + s.satir_toplami, 0);
  const iskontoTutari = (araToplam * fatura.iskonto_orani) / 100;
  const genelToplam = araToplam - iskontoTutari;

  const satirEkle = (urun: any) => {
    setSatirlar([...satirlar, { 
      id: crypto.randomUUID(), 
      stok_id: urun.id, 
      urun_adi: urun.urun_adi, 
      miktar: 1, 
      birim_fiyat: urun.satis_fiyati,
      satir_toplami: urun.satis_fiyati 
    }]);
    setIsUrunOpen(false);
    setUrunSearch('');
  };

  const satisOnayla = async () => {
    if (!fatura.cari_id || satirlar.length === 0) return alert("Eksik bilgi!");

    try {
      const { data: fat, error: fErr } = await supabase.from('faturalar').insert({
        fatura_no: fatura.fatura_no,
        tarih: fatura.tarih,
        cari_id: fatura.cari_id,
        tür: 'Satış',
        toplam_ara_tutar: araToplam,
        toplam_iskonto: iskontoTutari,
        genel_toplam: genelToplam,
        durum: 'Onaylandı'
      }).select().single();

      if (fErr) throw fErr;

      await supabase.from('fatura_satirlari').insert(
        satirlar.map(s => ({
          fatura_id: fat.id,
          stok_id: s.stok_id,
          miktar: s.miktar,
          birim_fiyat: s.birim_fiyat,
          satir_toplami: s.satir_toplami
        }))
      );

      await supabase.rpc('satis_onayla', { f_id: fat.id });
      setLastInvoice({...fat, cari_ad: fatura.cari_ad, satirlar});
      alert("Satış Başarılı!");
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="p-8 bg-[#0f172a] min-h-screen text-white print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6 print:hidden">
        
        {/* SOL: FORM */}
        <div className="col-span-8 space-y-6">
          <div className="bg-[#1e293b] p-6 rounded-3xl border border-slate-700">
            <h1 className="text-xl font-black mb-6">📦 Kurumsal / Toplu Satış</h1>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Cari Seçici */}
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Cari Ara</label>
                <div onClick={() => setIsCariOpen(!isCariOpen)} className="p-3 bg-[#0f172a] rounded-xl border border-slate-700 cursor-pointer font-bold text-emerald-400">
                  {fatura.cari_ad || "Müşteri Seçin..."}
                </div>
                {isCariOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl">
                    <input autoFocus className="w-full p-3 bg-slate-900 border-b border-slate-700 outline-none" placeholder="İsim yazın..." value={cariSearch} onChange={e => setCariSearch(e.target.value)} />
                    <div className="max-h-48 overflow-y-auto">
                      {cariler.filter(c => c.tam_ad.toLowerCase().includes(cariSearch.toLowerCase())).map(c => (
                        <div key={c.id} onClick={() => { setFatura({...fatura, cari_id: c.id, cari_ad: c.tam_ad}); setIsCariOpen(false); }} className="p-3 hover:bg-indigo-600 cursor-pointer border-b border-slate-700 text-sm">
                          {c.tam_ad}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Ürün Seçici */}
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Ürün Ekle</label>
                <div onClick={() => setIsUrunOpen(!isUrunOpen)} className="p-3 bg-[#0f172a] rounded-xl border border-slate-700 cursor-pointer font-bold text-indigo-400">
                  Ürün Ara...
                </div>
                {isUrunOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl">
                    <input autoFocus className="w-full p-3 bg-slate-900 border-b border-slate-700 outline-none" placeholder="Ürün adı..." value={urunSearch} onChange={e => setUrunSearch(e.target.value)} />
                    <div className="max-h-48 overflow-y-auto">
                      {stoklar.filter(s => s.urun_adi.toLowerCase().includes(urunSearch.toLowerCase())).map(s => (
                        <div key={s.id} onClick={() => satirEkle(s)} className="p-3 hover:bg-indigo-600 cursor-pointer border-b border-slate-700 flex justify-between">
                          <span>{s.urun_adi}</span>
                          <span className="text-indigo-300">{s.satis_fiyati} ₺</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABLO */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800 text-[10px] text-slate-500 uppercase">
                <tr><th className="p-4 text-left">Ürün</th><th className="p-4 w-20">Miktar</th><th className="p-4 w-28">Fiyat</th><th className="p-4 text-right">Toplam</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {satirlar.map(s => (
                  <tr key={s.id}>
                    <td className="p-4 font-bold">{s.urun_adi}</td>
                    <td className="p-4"><input type="number" value={s.miktar} onChange={e => {
                        const m = Number(e.target.value);
                        setSatirlar(satirlar.map(item => item.id === s.id ? {...item, miktar: m, satir_toplami: m * item.birim_fiyat} : item));
                    }} className="w-full bg-[#0f172a] border border-slate-700 rounded text-center" /></td>
                    <td className="p-4"><input type="number" value={s.birim_fiyat} onChange={e => {
                        const f = Number(e.target.value);
                        setSatirlar(satirlar.map(item => item.id === s.id ? {...item, birim_fiyat: f, satir_toplami: s.miktar * f} : item));
                    }} className="w-full bg-[#0f172a] border border-slate-700 rounded text-center" /></td>
                    <td className="p-4 text-right font-bold text-indigo-400">{s.satir_toplami.toFixed(2)} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SAĞ: ÖZET */}
        <div className="col-span-4 space-y-6">
          <div className="bg-[#1e293b] p-6 rounded-3xl border border-slate-700">
            <h2 className="text-xs font-black text-slate-500 uppercase mb-4">Ödeme Özeti</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-slate-400"><span>Ara Toplam:</span><span>{araToplam.toFixed(2)} ₺</span></div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-emerald-400 text-xs font-bold">İSKONTO (%):</span>
                <input type="number" value={fatura.iskonto_orani} onChange={e => setFatura({...fatura, iskonto_orani: Number(e.target.value)})} className="w-20 bg-[#0f172a] border border-emerald-500/30 rounded p-1 text-center text-emerald-400" />
              </div>
              <div className="border-t border-slate-700 pt-4 flex justify-between items-end">
                <span className="font-bold text-slate-400">GENEL TOPLAM</span>
                <span className="text-3xl font-black text-white">{genelToplam.toFixed(2)} ₺</span>
              </div>
              <button onClick={satisOnayla} className="w-full bg-emerald-600 hover:bg-emerald-500 p-4 rounded-xl font-black transition-all">SATIŞI ONAYLA</button>
              {lastInvoice && <button onClick={() => window.print()} className="w-full bg-indigo-600 p-4 rounded-xl font-bold">📄 FATURA YAZDIR</button>}
            </div>
          </div>
        </div>
      </div>

      {/* YAZDIRILABİLİR ALAN (A4) */}
      {lastInvoice && (
        <div className="hidden print:block text-black bg-white p-10 font-sans" style={{ width: '210mm', minHeight: '297mm' }}>
          <div className="flex justify-between border-b-2 border-black pb-6">
            <div><h1 className="text-2xl font-black uppercase">KOOPERATİF MARKET</h1><p className="text-xs">Fatura No: {lastInvoice.fatura_no}</p></div>
            <div className="text-right text-xs"><p className="font-bold">TARİH</p><p>{lastInvoice.tarih}</p></div>
          </div>
          <div className="my-8 p-4 border rounded-xl">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Müşteri Bilgileri</p>
            <p className="text-lg font-bold">{lastInvoice.cari_ad}</p>
          </div>
          <table className="w-full mt-10 text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2">Ürün Açıklaması</th><th className="py-2">Miktar</th><th className="py-2">Birim Fiyat</th><th className="py-2 text-right">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {lastInvoice.satirlar.map((s:any) => (
                <tr key={s.id} className="border-b border-gray-200">
                  <td className="py-3">{s.urun_adi}</td><td>{s.miktar} Adet</td><td>{s.birim_fiyat.toFixed(2)} ₺</td><td className="text-right font-bold">{s.satir_toplami.toFixed(2)} ₺</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-10 ml-auto w-64 space-y-2 text-sm">
            <div className="flex justify-between"><span>Ara Toplam:</span><span>{lastInvoice.toplam_ara_tutar.toFixed(2)} ₺</span></div>
            <div className="flex justify-between text-red-600"><span>İskonto (%{lastInvoice.iskonto_orani}):</span><span>-{lastInvoice.toplam_iskonto.toFixed(2)} ₺</span></div>
            <div className="flex justify-between text-xl font-black border-t-2 border-black pt-2"><span>TOPLAM:</span><span>{lastInvoice.genel_toplam.toFixed(2)} ₺</span></div>
          </div>
        </div>
      )}
    </div>
  );
}