'use client';
import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, Search, Edit2, Trash2, Eye} from 'lucide-react';
import Link from 'next/link';

export default function KasaHareketPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient();
  const id = use(params).id;
  
  const [hareketler, setHareketler] = useState<any[]>([]);
  const [kasa, setKasa] = useState<any>(null);
  
// Düzenleme State'leri
  const [editTutar, setEditTutar] = useState('');
  const [editAciklama, setEditAciklama] = useState('');

  // Filtre State'leri
  const [arama, setArama] = useState('');
  const [tarihBas, setTarihBas] = useState('');
  const [tarihBit, setTarihBit] = useState('');
  
  // Detay Modal State
  const [seciliHareket, setSeciliHareket] = useState<any | null>(null);

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    const { data: k } = await supabase.from('kasa_kartlari').select('*').eq('id', id).single();
    setKasa(k);
    
    // İlişkili veri çekme (cari_kartlari tablosu ile join)
    const { data: h } = await supabase
        .from('hareketler')
        .select('*, cari_kartlari(tam_ad)')
        .eq('kasa_id', id)
        .order('tarih', { ascending: false });
    
    setHareketler(h || []);
  }
// --- DÜZENLEME VE SİLME FONKSİYONLARI ---
  async function hareketGuncelle() {
    if (!seciliHareket) return;
    const { error } = await supabase
      .from('hareketler')
      .update({ 
        giris_tutari: seciliHareket.giris_tutari ? editTutar : null,
        cikis_tutari: seciliHareket.cikis_tutari ? editTutar : null,
        aciklama: editAciklama 
      })
      .eq('id', seciliHareket.id);

    if (error) alert("Hata: " + error.message);
    else { setSeciliHareket(null); fetchData(); }
  }

  async function hareketSil() {
    if (!seciliHareket || !confirm("Bu hareketi silmek istediğinize emin misiniz?")) return;
    await supabase.from('hareketler').delete().eq('id', seciliHareket.id);
    setSeciliHareket(null);
    fetchData();
  }
  // Filtreleme mantığı (Cari adına göre)
  const filtrelenmis = hareketler.filter(h => {
    const matchesArama = !arama || h.cari_kartlari?.tam_ad?.toLowerCase().includes(arama.toLowerCase());
    const hTarih = h.tarih.split('T')[0];
    const matchesTarih = (!tarihBas || hTarih >= tarihBas) && (!tarihBit || hTarih <= tarihBit);
    return matchesArama && matchesTarih;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link href="/admin/kasa" className="flex items-center gap-2 mb-6 text-slate-500"><ChevronLeft size={20}/> Geri</Link>
      <h1 className="text-2xl font-black mb-6">{kasa?.kasa_adi} - Hareket Detayları</h1>
      
      {/* FİLTRE PANELİ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-white p-4 rounded-xl shadow border">
        <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
            <input placeholder="Cari/Üye ara..." className="border p-2 pl-10 rounded w-full" onChange={e => setArama(e.target.value)} />
        </div>
        <input type="date" className="border p-2 rounded" onChange={e => setTarihBas(e.target.value)} />
        <input type="date" className="border p-2 rounded" onChange={e => setTarihBit(e.target.value)} />
      </div>

      {/* TABLO */}
      <table className="w-full bg-white shadow rounded-xl overflow-hidden">
        <thead className="bg-slate-50 text-left text-xs uppercase">
          <tr><th className="p-4">Tarih</th><th className="p-4">Tutar</th><th className="p-4">İşlem</th></tr>
        </thead>
        <tbody>
          {filtrelenmis.map(h => (
            <tr key={h.id} className="border-t hover:bg-slate-50 cursor-pointer" onClick={() => setSeciliHareket(h)}>
              <td className="p-4">{new Date(h.tarih).toLocaleDateString()}</td>
              
              <td className="p-4 font-bold">{(h.giris_tutari || h.cikis_tutari).toFixed(2)} ₺</td>
              <td className="p-4 text-blue-600"><Eye size={18}/></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DETAY VE DÜZENLEME MODALI */}
      {seciliHareket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          
          
          
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black mb-6">Hareketi Yönet</h2>
            <p> {seciliHareket.cari_kartlari?.tam_ad || 'N/A'}</p>

          <p> {(seciliHareket.giris_tutari || seciliHareket.cikis_tutari).toFixed(2)} ₺</p>

          <p> {new Date(seciliHareket.tarih).toLocaleString()}</p>

          <p><strong>Açıklama:</strong> {seciliHareket.aciklama || 'Belirtilmemiş'}</p>
            <label className="text-xs font-bold text-slate-500">TUTAR</label>
            <input 
              type="number"
              defaultValue={seciliHareket.giris_tutari || seciliHareket.cikis_tutari}
              onChange={(e) => setEditTutar(e.target.value)}
              className="w-full border p-3 rounded-xl mb-4"
            />

            <label className="text-xs font-bold text-slate-500">AÇIKLAMA</label>
            <textarea 
              defaultValue={seciliHareket.aciklama}
              onChange={(e) => setEditAciklama(e.target.value)}
              className="w-full border p-3 rounded-xl mb-6"
            />

            <div className="flex gap-2">
              <button onClick={hareketSil} className="bg-red-50 text-red-600 p-3 rounded-xl"><Trash2 size={20}/></button>
              <button onClick={() => setSeciliHareket(null)} className="flex-1 bg-slate-100 rounded-xl font-bold">İptal</button>
              <button onClick={hareketGuncelle} className="flex-1 bg-blue-600 text-white rounded-xl font-bold">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}