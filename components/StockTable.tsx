'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import StockForm from './StockForm';

export default function StockTable({ initialData }: { initialData: any[] }) {
  const supabase = createClient();
  const [data, setData] = useState(initialData);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Sayfa açıldığında ve her güncellemede veriyi tazeleyen fonksiyon
  const refreshData = async () => {
    const { data: newData } = await supabase.from('stok_kartlari').select('*').order('urun_adi');
    const { data: catData } = await supabase.from('kategoriler').select('*');
    if (newData) setData(newData);
    if (catData) setCategories(catData);
  };

  // SAYFA İLK AÇILDIĞINDA ÇALIŞIR
  useEffect(() => {
    refreshData();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      const { error } = await supabase.from('stok_kartlari').delete().eq('id', id);
      if (error) alert("Silme hatası: " + error.message);
      else refreshData();
    }
  };

  const filteredData = data.filter(item => 
    item.urun_adi?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.barkod?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Üst Bar: Arama ve Ekleme */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          <input 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            placeholder="Ürün adı veya barkod ile ara..." 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-all active:scale-95"
        >
          + Yeni Ürün Ekle
        </button>
      </div>

      {/* Modern Tablo */}
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Ürün Bilgisi</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Stok</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Satış Fiyatı</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length > 0 ? (
              filteredData.map((item) => {
                const isCritical = item.guncel_stok <= item.min_stok;
                const category = categories.find(c => c.id === item.kategori_id);

                return (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{item.urun_adi}</span>
                        <span className="text-xs text-gray-400 font-mono">{item.barkod || 'Barkodsuz'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        {category?.ad || 'Genel'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-bold ${isCritical ? 'text-red-600' : 'text-emerald-600'}`}>
                          {item.guncel_stok} {item.birim}
                        </span>
                        {isCritical && <span className="text-[10px] font-bold text-red-500 animate-pulse">KRİTİK</span>}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-gray-700">
                      {item.satis_fiyati} ₺
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="hover:scale-125 transition-transform" title="Düzenle">✏️</button>
                        <button onClick={() => handleDelete(item.id)} className="hover:scale-125 transition-transform" title="Sil">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-400 italic">Ürün bulunamadı...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <StockForm 
          item={editingItem} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={refreshData} 
        />
      )}
    </div>
  );
}