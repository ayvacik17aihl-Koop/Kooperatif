'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, ArrowLeftRight, TrendingDown, TrendingUp, Settings2 } from 'lucide-react';
import Link from 'next/link';

export default function KasaYonetimPage() {
  const supabase = createClient();
  const [kasalar, setKasalar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Yönetimi
  const [activeModal, setActiveModal] = useState<'Ekle' | 'Guncelle' | 'Virman' | 'Gider' | 'Gelir' | null>(null);
  const [selectedKasa, setSelectedKasa] = useState<any>(null);
  const [formData, setFormData] = useState({
    ad: '', tur: 'Nakit', tutar: '', aciklama: '', hedefKasaId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('kasa_kartlari').select('*').order('kasa_adi');
    if (data) setKasalar(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormData({ ad: '', tur: 'Nakit', tutar: '', aciklama: '', hedefKasaId: '' });
    setActiveModal(null);
    setSelectedKasa(null);
  };

  // --- İŞLEM FONKSİYONLARI ---

  const handleKasaKaydet = async () => {
    if (activeModal === 'Ekle') {
      await supabase.from('kasa_kartlari').insert({ kasa_adi: formData.ad, kasa_turu: formData.tur });
    } else {
      await supabase.from('kasa_kartlari').update({ kasa_adi: formData.ad, kasa_turu: formData.tur }).eq('id', selectedKasa.id);
    }
    fetchData(); resetForm();
  };

  const handleFinansalIslem = async () => {
    const tutar = parseFloat(formData.tutar);
    if (!selectedKasa || isNaN(tutar)) return;

    if (activeModal === 'Gelir') {
      // Kasaya Giriş
      await supabase.from('hareketler').insert({ 
        kasa_id: selectedKasa.id, islem_turu: 'Genel Gelir', 
        cikis_tutari: tutar, islem_kaynagi: formData.aciklama || 'Genel Gelir' 
      });
      await supabase.from('kasa_kartlari').update({ toplam_giris: Number(selectedKasa.toplam_giris) + tutar }).eq('id', selectedKasa.id);
    } 
    else if (activeModal === 'Gider') {
      // Kasadan Çıkış
      await supabase.from('hareketler').insert({ 
        kasa_id: selectedKasa.id, islem_turu: 'Genel Gider', 
        giris_tutari: tutar, islem_kaynagi: formData.aciklama || 'Genel Gider' 
      });
      await supabase.from('kasa_kartlari').update({ toplam_cikis: Number(selectedKasa.toplam_cikis) + tutar }).eq('id', selectedKasa.id);
    }
    else if (activeModal === 'Virman') {
      const hedefKasa = kasalar.find(k => k.id === formData.hedefKasaId);
      // 1. Kaynak Kasadan Çıkış
      await supabase.from('hareketler').insert({ kasa_id: selectedKasa.id, islem_turu: 'Virman Çıkış', giris_tutari: tutar, islem_kaynagi: `${hedefKasa.kasa_adi} Kasasına Virman` });
      await supabase.from('kasa_kartlari').update({ toplam_cikis: Number(selectedKasa.toplam_cikis) + tutar }).eq('id', selectedKasa.id);
      // 2. Hedef Kasaya Giriş
      await supabase.from('hareketler').insert({ kasa_id: hedefKasa.id, islem_turu: 'Virman Giriş', cikis_tutari: tutar, islem_kaynagi: `${selectedKasa.kasa_adi} Kasasından Virman` });
      await supabase.from('kasa_kartlari').update({ toplam_giris: Number(hedefKasa.toplam_giris) + tutar }).eq('id', hedefKasa.id);
    }

    fetchData(); resetForm();
  };

  if (loading) return <div className="p-20 text-center text-white font-black animate-pulse">YÜKLENİYOR...</div>;

  return (
    <div className="p-8 bg-[#0f172a] min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-black tracking-tighter">Finans Merkezi</h1>
          <button 
            onClick={() => setActiveModal('Ekle')}
            className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Plus size={20} /> YENİ KASA EKLE
          </button>
        </div>

        {/* KASA KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kasalar.map((kasa) => (
            <div key={kasa.id} className="bg-[#1e293b] p-8 rounded-[2.5rem] border border-slate-700 relative group">
      <Link href={`/admin/kasa/hareket/${kasa.id}`}>
        <div className="bg-[#1e293b] p-8 rounded-[2.5rem] border border-slate-700 hover:border-indigo-500 transition-all cursor-pointer shadow-lg active:scale-[0.98]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-black group-hover:text-indigo-400 transition-colors">
                {kasa.kasa_adi}
              </h3>
              <span className="text-[10px] font-black bg-slate-800 px-2 py-1 rounded text-slate-400 uppercase">
                {kasa.kasa_turu}
              </span>
            </div>
          </div>

          <div className="text-3xl font-black font-mono mb-8 text-emerald-400">
            {kasa.guncel_bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Detaylı Ekstre İçin Tıklayın →
          </p>
        </div>
      </Link>

      {/* Ayarlar ve İşlem Butonları (Link dışında kalmalı) */}
      <div className="absolute top-8 right-8 flex gap-2">
        <button 
          onClick={(e) => { 
            e.preventDefault(); // Link'i tetiklemesini engeller
            setSelectedKasa(kasa); 
            setFormData({...formData, ad: kasa.kasa_adi, tur: kasa.kasa_turu}); 
            setActiveModal('Guncelle'); 
          }}
          className="p-2 bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
        >
          <Settings2 size={16} />
        </button>
      </div>

              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => { setSelectedKasa(kasa); setActiveModal('Gelir'); }} className="flex flex-col items-center p-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-2xl transition-all border border-emerald-500/20">
                  <TrendingUp size={18} /> <span className="text-[8px] font-black mt-1 uppercase">GELİR</span>
                </button>
                <button onClick={() => { setSelectedKasa(kasa); setActiveModal('Gider'); }} className="flex flex-col items-center p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all border border-rose-500/20">
                  <TrendingDown size={18} /> <span className="text-[8px] font-black mt-1 uppercase">GİDER</span>
                </button>
                <button onClick={() => { setSelectedKasa(kasa); setActiveModal('Virman'); }} className="flex flex-col items-center p-3 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-500 hover:text-white rounded-2xl transition-all border border-indigo-500/20">
                  <ArrowLeftRight size={18} /> <span className="text-[8px] font-black mt-1 uppercase">VİRMAN</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* --- DİNAMİK MODAL --- */}
        {activeModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] border border-slate-700 w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
              <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">
                {activeModal === 'Ekle' ? 'Yeni Kasa Tanımla' : 
                 activeModal === 'Guncelle' ? 'Kasa Bilgilerini Düzenle' : 
                 `${selectedKasa?.kasa_adi} - ${activeModal}`}
              </h2>

              <div className="space-y-4">
                {/* Kasa Ekle/Güncelle Formu */}
                {(activeModal === 'Ekle' || activeModal === 'Guncelle') && (
                  <>
                    <input className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl p-4 font-bold" placeholder="Kasa/Banka Adı" value={formData.ad} onChange={e => setFormData({...formData, ad: e.target.value})} />
                    <select className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl p-4 font-bold" value={formData.tur} onChange={e => setFormData({...formData, tur: e.target.value})}>
                      <option value="Nakit">Nakit Kasa</option>
                      <option value="Banka">Banka Hesabı</option>
                      <option value="POS">POS Hesabı</option>
                    </select>
                    <button onClick={handleKasaKaydet} className="w-full bg-indigo-600 p-4 rounded-2xl font-black mt-4">KAYDET</button>
                  </>
                )}

                {/* Finansal İşlemler (Gelir, Gider, Virman) */}
                {(activeModal === 'Gelir' || activeModal === 'Gider' || activeModal === 'Virman') && (
                  <>
                    {activeModal === 'Virman' && (
                      <select className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl p-4 font-bold" value={formData.hedefKasaId} onChange={e => setFormData({...formData, hedefKasaId: e.target.value})}>
                        <option value="">Hedef Kasa Seçiniz...</option>
                        {kasalar.filter(k => k.id !== selectedKasa.id).map(k => <option key={k.id} value={k.id}>{k.kasa_adi}</option>)}
                      </select>
                    )}
                    <input type="number" className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl p-4 font-black text-2xl" placeholder="Tutar 0.00" value={formData.tutar} onChange={e => setFormData({...formData, tutar: e.target.value})} />
                    <textarea className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl p-4 text-sm h-24" placeholder="Açıklama giriniz..." value={formData.aciklama} onChange={e => setFormData({...formData, aciklama: e.target.value})} />
                    <button onClick={handleFinansalIslem} className={`w-full p-4 rounded-2xl font-black mt-4 ${activeModal === 'Gelir' ? 'bg-emerald-600' : activeModal === 'Gider' ? 'bg-rose-600' : 'bg-indigo-600'}`}>İŞLEMİ ONAYLA</button>
                  </>
                )}
                
                <button onClick={resetForm} className="w-full text-slate-500 font-bold text-sm mt-2">İPTAL</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}