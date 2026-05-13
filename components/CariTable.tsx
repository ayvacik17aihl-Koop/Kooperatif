'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import CariForm from './CariForm';
import Link from 'next/link';

export default function CariTable({ initialData }: { initialData: any[] }) {
  const supabase = createClient();
  const [data, setData] = useState(initialData);
  const [types, setTypes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const refreshData = async () => {
    const { data: newData } = await supabase.from('cari_kartlari').select('*').order('tam_ad');
    const { data: typeData } = await supabase.from('cari_türleri').select('*');
    if (newData) setData(newData);
    if (typeData) setTypes(typeData);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredData = data.filter(item => 
    item.tam_ad?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.tc_no?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Üst Arama ve Ekleme Barı */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
            placeholder="İsim veya TC/Vergi No ile ara..." 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg active:scale-95"
        >
          + Yeni Cari Kaydı
        </button>
      </div>

      {/* Modern Cari Tablosu */}
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Cari Bilgisi</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Tür</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">İletişim</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Bakiye</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.map((item) => {
              const type = types.find(t => t.id === item.tür_id);
              const bakiye = Number(item.bakiye || 0);

              return (
                <tr key={item.id} className="hover:bg-indigo-50/50 transition-colors group relative">
                  {/* Tıklanabilir Ekstre Alanı */}
                  <td className="p-0" colSpan={4}>
                    <Link href={`/admin/cari/ekstre/${item.id}`} className="grid grid-cols-4 items-center w-full">
                      <div className="p-4">
                        <div className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{item.tam_ad}</div>
                        <div className="text-xs text-gray-400 font-mono">{item.tc_no || 'No Belirtilmemiş'}</div>
                      </div>
                      <div className="p-4">
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100">
                          {type?.ad || 'Genel'}
                        </span>
                      </div>
                      <div className="p-4 text-sm text-gray-600">
                        <div>📞 {item.telefon || '-'}</div>
                      </div>
                      <div className={`p-4 text-right font-mono font-bold ${bakiye < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </div>
                    </Link>
                  </td>

                  {/* İşlem Butonları (Link'in dışında kalması için ayrı hücre) */}
                  <td className="p-4 text-right relative z-10">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingItem(item); 
                          setIsModalOpen(true); 
                        }} 
                        className="p-1 hover:bg-white rounded shadow-sm text-gray-400 hover:text-indigo-600 transition-all"
                        title="Düzenle"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={async (e) => { 
                          e.preventDefault();
                          if(confirm('Bu cari kartı silmek istediğinize emin misiniz?')) { 
                            await supabase.from('cari_kartlari').delete().eq('id', item.id); 
                            refreshData(); 
                          } 
                        }} 
                        className="p-1 hover:bg-white rounded shadow-sm text-gray-400 hover:text-red-600 transition-all"
                        title="Sil"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="p-10 text-center text-gray-400 italic">
            Aranan kriterlere uygun cari bulunamadı.
          </div>
        )}
      </div>

      {isModalOpen && (
        <CariForm 
          item={editingItem} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={refreshData} 
        />
      )}
    </div>
  );
}