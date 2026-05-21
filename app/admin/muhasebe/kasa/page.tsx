'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function KasaYonetimi() {
  const [kasalar, setKasalar] = useState<any[]>([]);
  const [kasaTurleri, setKasaTurleri] = useState<any[]>([]);
  
  // State Yönetimi
  const [arama, setArama] = useState('');
  const [yeniKasaAdi, setYeniKasaAdi] = useState('');
  const [yeniKasaTuru, setYeniKasaTuru] = useState('');
  const [seciliKasa, setSeciliKasa] = useState<any | null>(null);

  const supabase = createClient();

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const { data: k } = await supabase.from('kasa_kartlari').select('*, kasa_türleri(ad)');
    const { data: t } = await supabase.from('kasa_türleri').select('*');
    setKasalar(k || []);
    setKasaTurleri(t || []);
  }

  // --- CRUD FONKSİYONLARI ---
  async function kasaEkle() {
    if (!yeniKasaAdi || !yeniKasaTuru) return alert("Lütfen isim ve tür seçin.");
    await supabase.from('kasa_kartlari').insert({ kasa_adi: yeniKasaAdi, tür_id: yeniKasaTuru });
    setYeniKasaAdi('');
    fetchData();
  }

  async function kasaSil(id: string) {
    if (!confirm("Bu kasayı silmek istediğinize emin misiniz?")) return;
    await supabase.from('kasa_kartlari').delete().eq('id', id);
    fetchData();
  }

  async function kasaGuncelle() {
    if (!seciliKasa) return;
    const { error } = await supabase
      .from('kasa_kartlari')
      .update({ kasa_adi: seciliKasa.kasa_adi, tür_id: seciliKasa.tür_id })
      .eq('id', seciliKasa.id);
    
    if (error) alert("Hata: " + error.message);
    else { setSeciliKasa(null); fetchData(); }
  }

  const filtrelenmis = kasalar.filter(k => k.kasa_adi.toLowerCase().includes(arama.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-black mb-8 text-slate-800">Kasa Yönetimi</h1>

      {/* ARAMA VE EKLEME PANELİ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <input placeholder="Kasa ara..." className="border p-3 rounded-xl col-span-2" onChange={(e) => setArama(e.target.value)} />
        <input placeholder="Yeni Kasa Adı" className="border p-3 rounded-xl" value={yeniKasaAdi} onChange={(e) => setYeniKasaAdi(e.target.value)} />
        <div className="flex gap-2">
          <select className="border p-3 rounded-xl flex-1" onChange={(e) => setYeniKasaTuru(e.target.value)}>
            <option value="">Tür Seç...</option>
            {kasaTurleri.map(t => <option key={t.id} value={t.id}>{t.ad}</option>)}
          </select>
          <button onClick={kasaEkle} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700">+</button>
        </div>
      </div>

      {/* KARTLAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtrelenmis.map((kasa) => (
          <div key={kasa.id} className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition-all">
            <Link href={`/admin/muhasebe/kasa/hareket/${kasa.id}`}>
              <h3 className="text-xl font-black mb-1 hover:text-blue-600 cursor-pointer">{kasa.kasa_adi}</h3>
            </Link>
            <p className="text-xs text-slate-400 font-bold uppercase mb-4">{kasa.kasa_türleri?.ad}</p>
            <p className="text-2xl font-mono font-black text-blue-600 mb-6">
              {(kasa.toplam_giris - kasa.toplam_cikis).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </p>
            <div className="flex gap-2">
              <button onClick={() => setSeciliKasa(kasa)} className="flex-1 bg-slate-100 py-2 rounded-lg text-sm font-bold">Düzenle</button>
              <button onClick={() => kasaSil(kasa.id)} className="px-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold">Sil</button>
            </div>
          </div>
        ))}
      </div>

      {/* GÜNCELLEME MODALI */}
      {seciliKasa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Kasayı Düzenle</h2>
            <input 
              value={seciliKasa.kasa_adi}
              onChange={(e) => setSeciliKasa({...seciliKasa, kasa_adi: e.target.value})}
              className="w-full border p-3 rounded-xl mb-3"
            />
            <select 
              value={seciliKasa.tür_id || ''}
              onChange={(e) => setSeciliKasa({...seciliKasa, tür_id: e.target.value})}
              className="w-full border p-3 rounded-xl mb-6"
            >
              {kasaTurleri.map(t => <option key={t.id} value={t.id}>{t.ad}</option>)}
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSeciliKasa(null)} className="px-6 py-2 bg-slate-100 rounded-xl font-bold">İptal</button>
              <button onClick={kasaGuncelle} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}