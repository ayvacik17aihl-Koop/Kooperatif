'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function StockForm({ item, onClose, onSuccess }: { item?: any, onClose: () => void, onSuccess: () => void }) {
  const supabase = createClient();
  const [categories, setCategories] = useState<any[]>([]);
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  const [formData, setFormData] = useState({
    urun_adi: '', barkod: '', kategori_id: '', birim: 'Adet', 
    min_stok: 0, guncel_stok: 0, alis_fiyati: 0, satis_fiyati: 0, aciklama: ''
  });

  const fetchCategories = async () => {
    const { data } = await supabase.from('kategoriler').select('*').order('ad');
    if (data) setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
    if (item) setFormData(item);
  }, [item]);

  // Yeni Kategori Ekle
  const handleAddCategory = async () => {
    if (!newCatName) return;
    const { error } = await supabase.from('kategoriler').insert([{ ad: newCatName }]);
    if (error) alert("Kategori eklenemedi: " + error.message);
    else {
      setNewCatName('');
      fetchCategories();
    }
  };

    // Otomatik Barkod Üret
  const generateBarcode = () => {
    const code = "869" + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setFormData({ ...formData, barkod: code });
  };

  // Kategori Sil (İlişki Kontrollü)
  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;
    
    const { error } = await supabase.from('kategoriler').delete().eq('id', id);
    if (error) {
      alert("Bu kategori silinemez! Muhtemelen bu kategoriye bağlı ürünler var. Önce ürünlerin kategorisini değiştirin.");
    } else {
      fetchCategories();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = item 
      ? supabase.from('stok_kartlari').update(formData).eq('id', item.id)
      : supabase.from('stok_kartlari').insert([formData]);

    const { error } = await action;
    if (error) alert(error.message);
    else { onSuccess(); onClose(); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 rounded-xl w-full max-w-2xl shadow-2xl relative">
        
        {/* Kategori Yönetim Paneli (Overlay) */}
        {showCatManager && (
          <div className="absolute inset-0 bg-white z-10 p-8 rounded-xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Kategori Yönetimi</h3>
              <button onClick={() => setShowCatManager(false)} className="text-red-500">Kapat</button>
            </div>
            <div className="flex gap-2 mb-4">
              <input 
                className="flex-1 border p-2 rounded" 
                placeholder="Yeni Kategori Adı" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <button onClick={handleAddCategory} className="bg-green-600 text-white px-4 rounded">+</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                  <span>{cat.ad}</span>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-6 border-b pb-2">📦 Ürün Formu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Ürün Adı</label>
              <input className="w-full border p-2 rounded" value={formData.urun_adi} onChange={e => setFormData({...formData, urun_adi: e.target.value})} required />
            </div>

              <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Barkod</label>
            <div className="flex gap-2">
              <input className="flex-1 border-gray-300 border rounded-lg p-2.5 outline-none" 
                placeholder="Barkod No" value={formData.barkod} onChange={e => setFormData({...formData, barkod: e.target.value})} />
              <button type="button" onClick={generateBarcode} className="bg-gray-100 px-3 rounded-lg hover:bg-gray-200" title="Otomatik Üret">⚡</button>
            </div>
          </div>

            {/* Kategori Alanı ve Yeni Ekle Butonu */}
            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 border p-2 rounded outline-none" 
                  value={formData.kategori_id} 
                  onChange={e => setFormData({...formData, kategori_id: e.target.value})}
                  required
                >
                  <option value="">Seçiniz...</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.ad}</option>)}
                </select>
                <button 
                  type="button" 
                  onClick={() => setShowCatManager(true)}
                  className="bg-gray-100 px-3 rounded border hover:bg-gray-200"
                  title="Kategorileri Yönet"
                >
                  ⚙️
                </button>
              </div>
            </div>

            {/* Diğer alanlar (Fiyat, Stok vb.) aynı kalacak... */}
            
            <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Alış Fiyatı (₺)</label>
            <input type="number" step="0.01" className="w-full border-gray-300 border rounded-lg p-2.5 outline-none font-mono" 
              value={formData.alis_fiyati} onChange={e => setFormData({...formData, alis_fiyati: Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Satış Fiyatı (₺)</label>
            <input type="number" step="0.01" className="w-full border-gray-300 border rounded-lg p-2.5 outline-none font-mono" 
              value={formData.satis_fiyati} onChange={e => setFormData({...formData, satis_fiyati: Number(e.target.value)})} />
          </div>

          {/* Stok Bilgileri */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Güncel Stok</label>
            <input type="number" className="w-full border-gray-300 border rounded-lg p-2.5 outline-none font-bold text-blue-700" 
              value={formData.guncel_stok} onChange={e => setFormData({...formData, guncel_stok: Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Kritik Stok Sınırı</label>
            <input type="number" className="w-full border-gray-300 border rounded-lg p-2.5 outline-none text-red-600" 
              value={formData.min_stok} onChange={e => setFormData({...formData, min_stok: Number(e.target.value)})} />
          </div>

          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">İptal</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
}