'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function KasaForm({ item, onClose, onSuccess }: { item?: any, onClose: () => void, onSuccess: () => void }) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    kasa_adi: '', kasa_turu: 'Nakit', doviz_turu: 'TRY', aciklama: ''
  });

  useEffect(() => {
    if (item) setFormData(item);
  }, [item]);

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form verilerinin bir kopyasını al
    const payload = { ...formData };
    
    // OTOMATİK HESAPLANAN SÜTUNLARI SİL (Hatanın çözümü burası)
    // @ts-ignore
    delete payload.guncel_bakiye;
    // @ts-ignore
    delete payload.toplam_giris;
    // @ts-ignore
    delete payload.toplam_cikis;
    // @ts-ignore
    delete payload.created_at;
    // @ts-ignore
    delete payload.updated_at;

    const action = item 
      ? supabase.from('kasa_kartlari').update(payload).eq('id', item.id)
      : supabase.from('kasa_kartlari').insert([payload]);

    const { error } = await action;
    if (error) {
      console.error("Hata detayı:", error);
      alert("Hata: " + error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">🏦 Kasa / Hesap Formu</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Kasa/Hesap Adı</label>
            <input 
              className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
              placeholder="Örn: Merkez Kasa veya X Bankası"
              value={formData.kasa_adi} 
              onChange={e => setFormData({...formData, kasa_adi: e.target.value})} 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Hesap Türü</label>
            <select 
              className="w-full border p-3 rounded-xl outline-none bg-white"
              value={formData.kasa_turu} 
              onChange={e => setFormData({...formData, kasa_turu: e.target.value})}
            >
              <option value="Nakit">Nakit Kasa</option>
              <option value="Banka">Banka Hesabı</option>
              <option value="Kredi Kartı">Kredi Kartı</option>
              <option value="Sanal Pos">Sanal POS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Açıklama</label>
            <textarea 
              className="w-full border p-3 rounded-xl outline-none h-24" 
              value={formData.aciklama} 
              onChange={e => setFormData({...formData, aciklama: e.target.value})} 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 text-gray-500 font-bold">İptal</button>
            <button type="submit" className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
}