'use client';
import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Calendar, X, Filter } from 'lucide-react'; // İkonlar için

export default function CariEkstrePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient();
  const resolvedParams = use(params);
  const cariId = resolvedParams.id;

  const [originalHareketler, setOriginalHareketler] = useState<any[]>([]); // Filtrelenmemiş ham veri
  const [hareketler, setHareketler] = useState<any[]>([]); // Ekranda görünen veri
  const [cari, setCari] = useState<any>(null);
  const [kasalar, setKasalar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtre State'leri
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'Tahsilat' | 'Ödeme'>('Tahsilat');
  const [islemTutar, setIslemTutar] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [seciliKasa, setSeciliKasa] = useState('');

  const fetchData = async () => {
    if (!cariId || cariId === "undefined") return;
    setLoading(true);
    
    const { data: cData } = await supabase.from('cari_kartlari').select('*, cari_türleri(ad)').eq('id', cariId).single();
    const { data: kData } = await supabase.from('kasa_kartlari').select('*');
    const { data: hData } = await supabase.from('hareketler').select('*, faturalar(fatura_no)').eq('cari_id', cariId).order('tarih', { ascending: false });
    
    if (cData) setCari(cData);
    if (kData) {
        setKasalar(kData);
        if (kData.length > 0) setSeciliKasa(kData[0].id);
    }
    if (hData) {
        setOriginalHareketler(hData);
        setHareketler(hData);
    }
    setLoading(false);
  };

  useEffect(() => { if (cariId) fetchData(); }, [cariId]);

  // --- Filtreleme Mantığı ---
  const handleFilter = () => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = originalHareketler.filter(h => {
      const d = new Date(h.tarih);
      return d >= start && d <= end;
    });
    setHareketler(filtered);
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setHareketler(originalHareketler);
  };

  // Bakiyeler filtrelenmiş listeye göre anlık hesaplanır
  const toplamBorc = hareketler.reduce((acc, h) => acc + Number(h.giris_tutari || 0), 0);
  const toplamAlacak = hareketler.reduce((acc, h) => acc + Number(h.cikis_tutari || 0), 0);
  const guncelBakiye = toplamBorc - toplamAlacak;

  // ... (handleIslemEkle fonksiyonun aynı kalıyor, değiştirmedim)
  const handleIslemEkle = async () => {
    const tutar = parseFloat(islemTutar);
    if (isNaN(tutar) || tutar <= 0) return alert("Geçerli bir tutar giriniz.");
    if (!seciliKasa) return alert("Lütfen bir kasa/banka seçiniz.");

    const { error: hError } = await supabase.from('hareketler').insert({
      cari_id: cariId,
      kasa_id: seciliKasa,
      islem_turu: modalType,
      giris_tutari: modalType === 'Ödeme' ? tutar : 0,
      cikis_tutari: modalType === 'Tahsilat' ? tutar : 0,
      islem_kaynagi: aciklama || `${modalType} İşlemi`,
      tarih: new Date().toISOString()
    });

    if (hError) return alert("Hata: " + hError.message);

    const seciliKasaData = kasalar.find(k => k.id === seciliKasa);
    const yeniGiris = modalType === 'Tahsilat' ? Number(seciliKasaData.toplam_giris) + tutar : seciliKasaData.toplam_giris;
    const yeniCikis = modalType === 'Ödeme' ? Number(seciliKasaData.toplam_cikis) + tutar : seciliKasaData.toplam_cikis;

    await supabase.from('kasa_kartlari').update({
      toplam_giris: yeniGiris,
      toplam_cikis: yeniCikis,
      updated_at: new Date().toISOString()
    }).eq('id', seciliKasa);

    setIsModalOpen(false);
    setIslemTutar('');
    setAciklama('');
    fetchData();
  };

  if (loading) return <div className="p-20 text-center text-white font-black animate-pulse">VERİLER İŞLENİYOR...</div>;

  return (
    <div className="p-8 bg-[#0f172a] min-h-screen text-white print:bg-white print:text-black print:p-0">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ÜST PANEL */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <Link href="/admin/cari" className="text-slate-400 hover:text-white transition-all font-bold tracking-tighter">← CARİ LİSTESİ</Link>
          
          {/* TARİH FİLTRESİ */}
          <div className="flex items-center gap-2 bg-[#1e293b] p-1.5 rounded-2xl border border-slate-700 shadow-xl">
            <div className="flex items-center gap-2 px-3">
              <Calendar size={14} className="text-indigo-400" />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[11px] font-bold outline-none border-none focus:ring-0" />
              <span className="text-slate-600">-</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[11px] font-bold outline-none border-none focus:ring-0" />
            </div>
            <button onClick={handleFilter} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-[10px] font-black transition-all">FİLTRELE</button>
            {(startDate || endDate) && (
              <button onClick={clearFilter} className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"><X size={14}/></button>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => { setModalType('Tahsilat'); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-2xl font-black text-xs transition-all">💵 TAHSİLAT</button>
            <button onClick={() => { setModalType('Ödeme'); setIsModalOpen(true); }} className="bg-rose-600 hover:bg-rose-500 px-5 py-2.5 rounded-2xl font-black text-xs transition-all">💸 ÖDEME</button>
            <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 px-5 py-2.5 rounded-2xl font-black text-xs transition-all">🖨️ YAZDIR</button>
          </div>
        </div>

        {/* CARİ ÖZET */}
        <div className="bg-[#1e293b] p-10 rounded-[3rem] border border-slate-700 flex justify-between items-center shadow-2xl print:border-black print:bg-white print:rounded-none">
          <div>
            <h1 className="text-4xl font-black text-indigo-400 print:text-black">{cari?.tam_ad}</h1>
            <p className="text-slate-500 font-mono mt-2 print:text-black">{cari?.tc_no || 'VERGİ/TC NO YOK'}</p>
            <p className="text-[9px] font-black text-slate-600 uppercase mt-2 print:text-black">
               {startDate && endDate ? `${startDate} / ${endDate} ARASI HAREKETLER` : 'TÜM HAREKET DÖKÜMÜ'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1">FİLTRELENMİŞ BAKİYE</p>
            <p className={`text-5xl font-black font-mono ${guncelBakiye >= 0 ? 'text-emerald-400' : 'text-rose-400'} print:text-black`}>
              {Math.abs(guncelBakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              <span className="text-sm ml-2 font-black">{guncelBakiye >= 0 ? '(A)' : '(B)'}</span>
            </p>
          </div>
        </div>

        {/* HAREKET TABLOSU */}
        <div className="bg-[#1e293b] rounded-[2.5rem] border border-slate-700 overflow-hidden shadow-xl print:border-black print:rounded-none">
          <table className="w-full text-left">
            <thead className="bg-slate-800 text-[11px] font-black uppercase text-slate-500 border-b border-slate-700 print:bg-slate-100 print:text-black">
              <tr>
                <th className="p-6">TARİH</th>
                <th className="p-6">İŞLEM / AÇIKLAMA</th>
                <th className="p-6 text-right">BORÇ (+)</th>
                <th className="p-6 text-right">ALACAK (-)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-black">
              {hareketler.map((h, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors print:text-black">
                  <td className="p-6 text-slate-400 font-medium print:text-black">{new Date(h.tarih).toLocaleDateString('tr-TR')}</td>
                  <td className="p-6">
                    <div className="font-black text-slate-200 print:text-black">{h.faturalar?.fatura_no || h.islem_kaynagi}</div>
                    <div className={`text-[9px] font-black inline-block px-2 py-0.5 rounded mt-1 ${h.islem_turu === 'Tahsilat' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                      {h.islem_turu.toUpperCase()}
                    </div>
                  </td>
                  <td className="p-6 text-right font-mono font-black text-rose-400 print:text-black">
                    {h.giris_tutari > 0 ? h.giris_tutari.toLocaleString('tr-TR', {minimumFractionDigits: 2}) : '-'}
                  </td>
                  <td className="p-6 text-right font-mono font-black text-emerald-400 print:text-black">
                    {h.cikis_tutari > 0 ? h.cikis_tutari.toLocaleString('tr-TR', {minimumFractionDigits: 2}) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hareketler.length === 0 && (
            <div className="p-20 text-center text-slate-500 font-black uppercase opacity-30">Kayıt Bulunamadı</div>
          )}
        </div>
      </div>

      {/* TAHSİLAT / ÖDEME MODAL (Burası aynı kalıyor) */}
      {isModalOpen && (
          // ... mevcut modal kodların aynen buraya gelecek
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
             {/* Paylaştığın modal kodunu buraya yapıştırabilirsin */}
          </div>
      )}
    </div>
  );
}