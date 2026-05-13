'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import KasaForm from './KasaForm';

export default function KasaTable({ initialData }: { initialData: any[] }) {
  const supabase = createClient();
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const refreshData = async () => {
    const { data: newData } = await supabase.from('kasa_kartlari').select('*').order('kasa_adi');
    if (newData) setData(newData);
  };

  useEffect(() => { refreshData(); }, []);

  const filteredData = data.filter(item => 
    item.kasa_adi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kasa_turu?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Üst Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <input 
          className="w-full md:w-96 px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" 
          placeholder="Kasa veya hesap adı ara..." 
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all"
        >
          + Yeni Kasa/Hesap Ekle
        </button>
      </div>

      {/* Kart Görünümlü Tablo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
                  {item.kasa_turu}
                </span>
                <h3 className="text-xl font-bold text-gray-800 mt-2">{item.kasa_adi}</h3>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-gray-400 hover:text-blue-600">✏️</button>
                <button onClick={async () => { if(confirm('Silinsin mi?')) { await supabase.from('kasa_kartlari').delete().eq('id', item.id); refreshData(); } }} className="text-gray-400 hover:text-red-600">🗑️</button>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="text-sm text-gray-400">Güncel Bakiye</div>
              <div className={`text-2xl font-black ${item.guncel_bakiye < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {Number(item.guncel_bakiye).toLocaleString('tr-TR')} {item.doviz_turu}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <KasaForm 
          item={editingItem} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={refreshData} 
        />
      )}
    </div>
  );
}