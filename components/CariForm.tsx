'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function CariForm({ item, onClose, onSuccess }: { item?: any, onClose: () => void, onSuccess: () => void }) {
  const supabase = createClient();
  const [types, setTypes] = useState<any[]>([]);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  
  const [formData, setFormData] = useState({
    tam_ad: '', 
    tc_no: '', 
    tür_id: '', 
    telefon: '', 
    eposta: '', 
    adres: '', 
    notlar: ''
  });

  // Cari türlerini (Üye, Tedarikçi vb.) çek
  const fetchTypes = async () => {
    const { data } = await supabase.from('cari_türleri').select('*').order('ad');
    if (data) setTypes(data);
  };

  useEffect(() => {
    fetchTypes();
    if (item) {
      setFormData({
        tam_ad: item.tam_ad || '',
        tc_no: item.tc_no || '',
        tür_id: item.tür_id || '',
        telefon: item.telefon || '',
        eposta: item.eposta || '',
        adres: item.adres || '',
        notlar: item.notlar || ''
      });
    }
  }, [item]);

  // Yeni Cari Türü Ekle (⚙️ panelinden)
  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    const { error } = await supabase.from('cari_türleri').insert([{ ad: newTypeName.trim() }]);
    if (error) {
      alert("Hata: " + error.message);
    } else {
      setNewTypeName('');
      fetchTypes();
    }
  };

  // Cari Türü Sil
  const handleDeleteType = async (id: string) => {
    if (!confirm("Bu türü silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from('cari_türleri').delete().eq('id', id);
    if (error) alert("Bu tür kullanımda olduğu için silinemez.");
    else fetchTypes();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = { ...formData };
    
    const action = item 
      ? supabase.from('cari_kartlari').update(payload).eq('id', item.id)
      : supabase.from('cari_kartlari').insert([payload]);

    const { error } = await action;
    if (error) {
      alert("Hata: " + error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-2xl shadow-2xl relative overflow-hidden">
        
        {/* Kategori (Tür) Yönetim Paneli */}
        {showTypeManager && (
          <div className="absolute inset-0 bg-white z-20 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Cari Türlerini Yönet</h3>
              <button onClick={() => setShowTypeManager(false)} className="text-gray-500 hover:text-black text-2xl">×</button>
            </div>
            
            <div className="flex gap-2 mb-6">
              <input 
                className="flex-1 border border-gray-300 p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="Yeni tür adı (örn: Ortak)" 
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
              />
              <button onClick={handleAddType} className="bg-indigo-600 text-white px-6 rounded-lg font-bold hover:bg-indigo-700 transition-colors">Ekle</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {types.map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                  <span className="font-medium text-gray-700">{t.ad}</span>
                  <button onClick={() => handleDeleteType(t.id)} className="text-red-400 hover:text-red-600 transition-colors">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-2xl font-bold text-gray-800">{item ? '👤 Cari Kartı Düzenle' : '👤 Yeni Cari Kaydı'}</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-black text-2xl">×</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-600 mb-1">Ad Soyad / Ticari Ünvan</label>
              <input 
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={formData.tam_ad} 
                onChange={e => setFormData({...formData, tam_ad: e.target.value})} 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Cari Türü</label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white" 
                  value={formData.tür_id} 
                  onChange={e => setFormData({...formData, tür_id: e.target.value})}
                  required
                >
                  <option value="">Seçiniz...</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.ad}</option>)}
                </select>
                <button 
                  type="button" 
                  onClick={() => setShowTypeManager(true)}
                  className="bg-gray-100 px-3 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors"
                  title="Türleri Yönet"
                >
                  ⚙️
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">TC / Vergi No</label>
              <input 
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={formData.tc_no} 
                onChange={e => setFormData({...formData, tc_no: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Telefon</label>
              <input 
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="05xx..."
                value={formData.telefon} 
                onChange={e => setFormData({...formData, telefon: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">E-posta</label>
              <input 
                type="email"
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={formData.eposta} 
                onChange={e => setFormData({...formData, eposta: e.target.value})} 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-600 mb-1">Adres</label>
              <textarea 
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20" 
                value={formData.adres} 
                onChange={e => setFormData({...formData, adres: e.target.value})} 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg transition-all active:scale-95"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}