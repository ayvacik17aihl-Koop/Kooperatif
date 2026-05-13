'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useReactToPrint } from 'react-to-print';
import AlisFaturasiForm from './AlisFaturasiForm';
import { PrintableInvoice } from './PrintableInvoice';
import { 
  Trash2, Printer, Edit3, CheckCircle2, 
  ArrowLeft, Search, Filter, Calendar, X
} from 'lucide-react';
import Link from 'next/link';
import { Receipt } from 'lucide-react';

export default function AlisFaturasiTable({ initialData }: { initialData: any[] }) {
  const supabase = createClient();
  const [data, setData] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Filtre State'leri
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cariSearch, setCariSearch] = useState('');
  const [cariler, setCariler] = useState<any[]>([]);

  // Yazdırma State'leri
  const [printData, setPrintData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Sayfa açıldığında verileri ve carileri yükle
  useEffect(() => {
    getCariler();
    refreshData(); // 1. Açılışta dolu gelmesi için
  }, []);

  const getCariler = async () => {
    const { data } = await supabase.from('cari_kartlari').select('id, tam_ad');
    if (data) setCariler(data);
  };

  const refreshData = async () => {
    let query = supabase
      .from('faturalar')
      .select('*, cari:cari_kartlari(tam_ad, adres, tc_no)')
      .eq('tür', 'Alış')
      .order('tarih', { ascending: false });

    // 2. Filtreleme Mantığı
    if (startDate) query = query.gte('tarih', startDate);
    if (endDate) query = query.lte('tarih', endDate);
    if (cariSearch) query = query.ilike('cari.tam_ad', `%${cariSearch}%`);
    
    const { data: newData } = await query;
    if (newData) setData(newData);
  };

  // 3. Silme İşlemi (Sadece Onaylanmamışlar)
  const handleDelete = async (id: string) => {
    if (!confirm('Bu faturayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    
    // Önce satırları sil (Foreign key kısıtlaması varsa)
    await supabase.from('fatura_satirlari').delete().eq('fatura_id', id);
    const { error } = await supabase.from('faturalar').delete().eq('id', id);

    if (error) {
      alert("Silme hatası: " + error.message);
    } else {
      refreshData();
    }
  };

  const handleOnayla = async (id: string) => {
    if (!confirm('Faturayı onayladığınızda stoklar ve cari bakiyesi güncellenecektir.')) return;
    const { error } = await supabase.rpc('fatura_onayla', { f_id: id });
    if (error) alert("Onay hatası: " + error.message);
    else refreshData();
  };

  const handlePrintTrigger = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Fatura_Cikti`,
    onAfterPrint: () => setPrintData(null)
  });

  const preparePrint = async (fatura: any) => {
    const { data: satirlar } = await supabase
      .from('fatura_satirlari')
      .select('*, stok:stok_kartlari(urun_adi)')
      .eq('fatura_id', fatura.id);

    const formatliSatirlar = satirlar?.map(s => ({
      ...s,
      urun_adi: s.stok?.urun_adi || 'Bilinmeyen Ürün'
    })) || [];

    setPrintData({ fatura, satirlar: formatliSatirlar });
    setTimeout(() => handlePrintTrigger(), 300);
  };

  return (
    <div className="space-y-6">
      {/* 4. Panele Dön ve Üst Navigasyon */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-all">
          <ArrowLeft size={18} /> Panele Dön
        </Link>
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <PlusCircle size={20} /> Yeni Alış Faturası
        </button>
      </div>

      {/* 2. Arama ve Filtreleme Barı */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Tedarikçi Ara</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Cari adı..."
              value={cariSearch}
              onChange={(e) => setCariSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Başlangıç</label>
          <input 
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Bitiş</label>
          <input 
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={refreshData} className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
            Filtrele
          </button>
          <button 
            onClick={() => { setStartDate(''); setEndDate(''); setCariSearch(''); }} 
            className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
            <tr>
              <th className="p-5 text-center">Durum</th>
              <th className="p-5">Fatura No / Tarih</th>
              <th className="p-5">Tedarikçi</th>
              <th className="p-5 text-right">Genel Toplam</th>
              <th className="p-5 text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="p-5 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    item.durum === 'Onaylandı' 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {item.durum || 'Taslak'}
                  </span>
                </td>
                <td className="p-5">
                  <div className="font-bold text-slate-700">{item.fatura_no}</div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {item.tarih ? new Date(item.tarih).toLocaleDateString('tr-TR') : '-'}
                  </div>
                </td>
                <td className="p-5 font-semibold text-slate-600">
                  {item.cari?.tam_ad}
                </td>
                <td className="p-5 text-right font-mono font-black text-slate-900">
                  ₺{Number(item.genel_toplam).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-5 text-center">
                  <div className="flex justify-center gap-1">
                    {item.durum !== 'Onaylandı' ? (
                      <>
                        <button onClick={() => handleOnayla(item.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Onayla">
                          <CheckCircle2 size={18} />
                        </button>
                        <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Düzenle">
                          <Edit3 size={18} />
                        </button>
                        {/* 3. SİLME BUTONU */}
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Sil">
                          <Trash2 size={18} />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 uppercase py-2">Kilitli</span>
                    )}
                    <button onClick={() => preparePrint(item)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all" title="Yazdır">
                      <Printer size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="p-20 text-center text-slate-400 font-medium italic">
            Aranan kriterlere uygun fatura bulunamadı.
          </div>
        )}
      </div>

      {/* Yazdırma ve Form Modalları aynı kalıyor... */}
      {isModalOpen && (
        <AlisFaturasiForm 
          initialData={editingItem} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={refreshData} 
        />
      )}

      <div className="hidden">
        <div ref={printRef}>
          {printData && <PrintableInvoice fatura={printData.fatura} satirlar={printData.satirlar} />}
        </div>
      </div>
    </div>
  );
}

// Yardımcı ikon (PlusCircle eksik kalmasın)
function PlusCircle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  );
}