'use client';
import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Filter, Printer, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function KasaHareketPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [kasa, setKasa] = useState<any>(null);
  const [originalHareketler, setOriginalHareketler] = useState<any[]>([]); // Ham veri
  const [hareketler, setHareketler] = useState<any[]>([]); // Filtrelenmiş veri
  const [loading, setLoading] = useState(true);

  // Filtre State'leri
  const [filterType, setFilterType] = useState<'all' | 'today' | 'month' | 'range'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchData = async () => {
    if (!id || id === "undefined") return;
    setLoading(true);
    const { data: kData } = await supabase.from('kasa_kartlari').select('*').eq('id', id).single();
    const { data: hData } = await supabase.from('hareketler').select('*, cari_kartlari(tam_ad)').eq('kasa_id', id).order('tarih', { ascending: false });
    
    if (kData) setKasa(kData);
    if (hData) {
      setOriginalHareketler(hData);
      setHareketler(hData);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  // Filtreleme Fonksiyonu
  useEffect(() => {
    let filtered = [...originalHareketler];
    const today = new Date();

    if (filterType === 'today') {
      filtered = filtered.filter(h => new Date(h.tarih).toDateString() === today.toDateString());
    } 
    else if (filterType === 'month') {
      filtered = filtered.filter(h => {
        const d = new Date(h.tarih);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      });
    } 
    else if (filterType === 'range' && dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(h => {
        const d = new Date(h.tarih);
        return d >= start && d <= end;
      });
    }

    setHareketler(filtered);
  }, [filterType, dateRange, originalHareketler]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-20 text-center text-white font-black animate-pulse">RAPOR HAZIRLANIYOR...</div>;

  return (
    <div className="p-8 bg-[#0f172a] min-h-screen text-white print:bg-white print:text-black print:p-0">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* FİLTRE PANELİ - YAZICIDA GİZLİ */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#1e293b] p-6 rounded-[2rem] border border-slate-700 print:hidden shadow-xl">
          <div className="flex items-center gap-4">
            <Link href="/admin/kasa" className="p-3 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all"><ChevronLeft size={20} /></Link>
            <div className="flex bg-[#0f172a] p-1 rounded-2xl border border-slate-700">
              <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>TÜMÜ</button>
              <button onClick={() => setFilterType('today')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filterType === 'today' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>BUGÜN</button>
              <button onClick={() => setFilterType('month')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filterType === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>BU AY</button>
              <button onClick={() => setFilterType('range')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filterType === 'range' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>ARALIK</button>
            </div>
          </div>

          {filterType === 'range' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
              <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-[#0f172a] border border-slate-700 rounded-xl p-2 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500" />
              <span className="text-slate-500">-</span>
              <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-[#0f172a] border border-slate-700 rounded-xl p-2 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          )}

          <button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
            <Printer size={18} /> PDF / YAZDIR
          </button>
        </div>

        {/* RAPOR BAŞLIĞI - HEM EKRAN HEM PDF */}
        <div className="bg-[#1e293b] p-10 rounded-[3rem] border border-slate-700 flex justify-between items-center shadow-2xl print:border-black print:bg-white print:rounded-none print:shadow-none">
          <div>
            <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2 print:text-black">Kasa Hareket Raporu</p>
            <h1 className="text-4xl font-black print:text-3xl">{kasa?.kasa_adi}</h1>
            <p className="text-slate-500 text-xs font-bold mt-2 print:text-black">
              Filtre: {filterType === 'all' ? 'Tüm Zamanlar' : filterType === 'today' ? 'Gün Sonu Raporu' : filterType === 'month' ? 'Aylık Rapor' : `${dateRange.start} / ${dateRange.end}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black font-mono text-emerald-400 print:text-black print:text-2xl">
              {hareketler.reduce((acc, h) => acc + (h.cikis_tutari || 0) - (h.giris_tutari || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </p>
            <p className="text-[10px] font-black text-slate-500 uppercase print:text-black">Filtrelenmiş Toplam Bakiye</p>
          </div>
        </div>

        {/* TABLO */}
        <div className="bg-[#1e293b] rounded-[2.5rem] border border-slate-700 overflow-hidden shadow-xl print:border-black print:rounded-none">
          <table className="w-full text-left">
            <thead className="bg-slate-800 text-[10px] font-black uppercase text-slate-500 border-b border-slate-700 print:bg-slate-100 print:text-black">
              <tr>
                <th className="p-6">TARİH</th>
                <th className="p-6">TÜR</th>
                <th className="p-6">AÇIKLAMA / CARİ</th>
                <th className="p-6 text-right">GELİR (+)</th>
                <th className="p-6 text-right">GİDER (-)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-black">
              {hareketler.map((h, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors print:text-black">
                  <td className="p-6 text-xs text-slate-400 font-medium print:text-black">
                    {new Date(h.tarih).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-6">
                    <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${
                      h.islem_turu.includes('Gider') || h.islem_turu === 'Ödeme' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {h.islem_turu}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="font-black text-sm">{h.cari_kartlari?.tam_ad || 'GENEL İŞLEM'}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{h.islem_kaynagi}</div>
                  </td>
                  <td className="p-6 text-right font-mono font-black text-emerald-400 print:text-black">
                    {(h.islem_turu === 'Tahsilat' || h.islem_turu === 'Genel Gelir' || h.islem_turu === 'Virman Giriş') 
                      ? (h.cikis_tutari || h.giris_tutari).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) 
                      : '-'}
                  </td>
                  <td className="p-6 text-right font-mono font-black text-rose-400 print:text-black">
                    {(h.islem_turu === 'Ödeme' || h.islem_turu === 'Genel Gider' || h.islem_turu === 'Virman Çıkış') 
                      ? (h.giris_tutari || h.cikis_tutari).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) 
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hareketler.length === 0 && (
            <div className="p-20 text-center text-slate-500 font-black uppercase tracking-[0.3em] opacity-20">Kayıt Bulunamadı</div>
          )}
        </div>
      </div>
    </div>
  );
}