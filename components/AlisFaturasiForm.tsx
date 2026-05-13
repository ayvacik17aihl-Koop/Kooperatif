'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import CariForm from './CariForm'; // Hızlı ekleme için
import StockForm from './StockForm'; // Hızlı ekleme için

export default function AlisFaturasiForm({ initialData, onClose, onSuccess }: any) {
  const supabase = createClient();
  
  // Ana Veriler
  const [fatura, setFatura] = useState(initialData || {
    fatura_no: `AL-${Date.now().toString().slice(-6)}`,
    cari_id: '',
    kasa_id: '',
    tarih: new Date().toISOString().split('T')[0],
    durum: 'Taslak'
  });
  const [satirlar, setSatirlar] = useState<any[]>([]);

  // Veritabanı Listeleri
  const [cariler, setCariler] = useState<any[]>([]);
  const [stoklar, setStoklar] = useState<any[]>([]);
  const [kasalar, setKasalar] = useState<any[]>([]);

  // UI Kontrol
  const [cariSearch, setCariSearch] = useState('');
  const [stokSearch, setStokSearch] = useState('');
  const [isCariModalOpen, setIsCariModalOpen] = useState(false);
  const [isStokModalOpen, setIsStokModalOpen] = useState(false);
  const [showStokDropdown, setShowStokDropdown] = useState(false);

  // 1. Verileri Çekme (Sayfa Yüklendiğinde)
  const fetchData = async () => {
    const { data: c } = await supabase.from('cari_kartlari').select('*').order('tam_ad');
    const { data: s } = await supabase.from('stok_kartlari').select('*').order('urun_adi');
    const { data: k } = await supabase.from('kasa_kartlari').select('*').order('kasa_adi');
    
    if (c) setCariler(c);
    if (s) setStoklar(s);
    if (k) setKasalar(k);

    // Düzenleme modundaysak satırları da çek
    if (initialData?.id) {
        const { data: lines } = await supabase.from('fatura_satirlari').select('*').eq('fatura_id', initialData.id);
        if (lines) setSatirlar(lines);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 2. Dinamik Filtreleme
  const filteredCariler = cariler.filter(c => c.tam_ad.toLowerCase().includes(cariSearch.toLowerCase()));
  const filteredStoklar = stoklar.filter(s => 
    s.urun_adi.toLowerCase().includes(stokSearch.toLowerCase()) || 
    s.barkod?.includes(stokSearch)
  );

  // 3. Ürün Ekleme Fonksiyonu
  const handleUrunSec = (urun: any) => {
    const yeniSatir = {
      stok_id: urun.id,
      urun_adi: urun.urun_adi,
      birim: urun.birim,
      miktar: 1,
      birim_fiyat: urun.alis_fiyati || 0,
      kdv_orani: urun.kdv_orani || 20,
      iskonto_orani: 0,
      satir_toplami: (urun.alis_fiyati || 0) * 1.20 // İlk hesaplama (KDV Hariç + %20 KDV varsayılan)
    };
    setSatirlar([...satirlar, yeniSatir]);
    setStokSearch('');
    setShowStokDropdown(false);
  };

  // 4. Satır Güncelleme (Miktar veya Fiyat değişince)
  const updateSatir = (index: number, field: string, value: any) => {
    const yeniSatirlar = [...satirlar];
    yeniSatirlar[index][field] = Number(value);
    
    // Satır toplamını anlık hesapla: (Miktar * Fiyat) * (1 - İskonto) * (1 + KDV)
    const s = yeniSatirlar[index];
    const ara = s.miktar * s.birim_fiyat;
    const iskontoTutari = ara * (s.iskonto_orani / 100);
    const kdvli = (ara - iskontoTutari) * (1 + s.kdv_orani / 100);
    
    s.satir_toplami = kdvli;
    setSatirlar(yeniSatirlar);
  };

  // Fatura Alt Toplamları
  const araToplam = satirlar.reduce((acc, curr) => acc + (curr.miktar * curr.birim_fiyat), 0);
  const toplamIskonto = satirlar.reduce((acc, curr) => acc + (curr.miktar * curr.birim_fiyat * (curr.iskonto_orani / 100)), 0);
  const toplamKdv = satirlar.reduce((acc, curr) => {
      const net = (curr.miktar * curr.birim_fiyat) * (1 - curr.iskonto_orani/100);
      return acc + (net * (curr.kdv_orani/100));
  }, 0);
  const genelToplam = araToplam - toplamIskonto + toplamKdv;

const handleSave = async (onay = false) => {
    try {
      if (!fatura.cari_id) return alert("Lütfen önce bir Cari (Tedarikçi) seçin!");
      if (satirlar.length === 0) return alert("Faturaya en az bir ürün eklemelisiniz!");

      const finalDurum = onay ? 'Onaylandı' : 'Taslak';
      
      // 1. Fatura Üst Bilgisini Kaydet/Güncelle
      const { data: faturaData, error: faturaErr } = await supabase
        .from('faturalar')
        .upsert({ 
          id: fatura.id, // Eğer düzenleme yapılıyorsa ID olmalı
    fatura_no: fatura.fatura_no,
    cari_id: fatura.cari_id,
    kasa_id: fatura.kasa_id || null, // Boşsa null gönder
    tarih: fatura.tarih,
    toplam_ara_tutar: araToplam, 
    toplam_kdv: toplamKdv, 
    toplam_iskonto: toplamIskonto, // Şemanızdaki isimle eşleşmeli
    genel_toplam: genelToplam, 
    durum: 'Taslak' // Önce taslak olarak kaydet
        })
        .select()
        .single();

      if (faturaErr) throw faturaErr;

      // 2. Fatura Satırlarını Temizle ve Yeniden Yaz
      await supabase.from('fatura_satirlari').delete().eq('fatura_id', faturaData.id);
      const yeniSatirlar = satirlar.map(s => ({
        fatura_id: faturaData.id,
        stok_id: s.stok_id,
        miktar: s.miktar,
        birim_fiyat: s.birim_fiyat,
        kdv_orani: s.kdv_orani,
        iskonto_orani: s.iskonto_orani,
        satir_toplami: s.satir_toplami
      }));
      
      const { error: satirErr } = await supabase.from('fatura_satirlari').insert(yeniSatirlar);
      if (satirErr) throw satirErr;

      // 3. EĞER ONAY BUTONUNA BASILDIYSA: Veritabanındaki 'fatura_onayla' fonksiyonunu çalıştır
      if (onay) {
        const { error: onayErr } = await supabase.rpc('fatura_onayla', { f_id: faturaData.id });
        if (ononayErr) throw onayErr;
        alert("Fatura başarıyla onaylandı. Stok, Cari ve Kasa güncellendi!");
      } else {
        alert("Fatura taslak olarak kaydedildi.");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("İşlem hatası:", error);
      alert("Hata oluştu: " + error.message);
    }
  };



  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex justify-between bg-gray-50 items-center">
        <h2 className="text-xl font-bold">🛒 {initialData ? 'Fatura Düzenle' : 'Yeni Alış Faturası'}</h2>
        <button onClick={onClose} className="text-3xl text-gray-400 hover:text-black">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        {/* Üst Bilgiler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-2xl border">
          <div className="md:col-span-2 relative">
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Tedarikçi / Cari</label>
            <div className="flex gap-2">
              <select 
                className="flex-1 border p-3 rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                value={fatura.cari_id} 
                onChange={e => setFatura({...fatura, cari_id: e.target.value})}
              >
                <option value="">Cari Seçin veya Arayın...</option>
                {filteredCariler.map(c => <option key={c.id} value={c.id}>{c.tam_ad}</option>)}
              </select>
              <button 
                type="button"
                onClick={() => setIsCariModalOpen(true)}
                className="bg-indigo-100 text-indigo-600 px-4 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all"
              >
                + Yeni
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Ödeme Hesabı</label>
            <select 
              className="w-full border p-3 rounded-xl bg-white shadow-sm outline-none" 
              value={fatura.kasa_id} 
              onChange={e => setFatura({...fatura, kasa_id: e.target.value})}
            >
              <option value="">Hesap Seçin (Opsiyonel)</option>
              {kasalar.map(k => <option key={k.id} value={k.id}>{k.kasa_adi} ({Number(k.guncel_bakiye).toLocaleString()} ₺)</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Fatura Tarihi</label>
            <input 
              type="date" 
              className="w-full border p-3 rounded-xl bg-white shadow-sm" 
              value={fatura.tarih} 
              onChange={e => setFatura({...fatura, tarih: e.target.value})} 
            />
          </div>
        </div>

        {/* Ürün Arama ve Satırlar */}
        <div className="space-y-4">
          <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Ürün Ekle (Barkod veya İsim)</label>
            <div className="flex gap-2">
                <input 
                    className="flex-1 border p-4 rounded-2xl shadow-sm text-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ürün aramak için yazmaya başlayın..."
                    value={stokSearch}
                    onChange={(e) => { setStokSearch(e.target.value); setShowStokDropdown(true); }}
                    onFocus={() => setShowStokDropdown(true)}
                />
                <button 
                  onClick={() => setIsStokModalOpen(true)}
                  className="bg-emerald-100 text-emerald-700 px-6 rounded-2xl font-bold hover:bg-emerald-600 hover:text-white transition-all"
                >
                  + Yeni Stok
                </button>
            </div>

            {/* Dinamik Arama Sonuçları */}
            {showStokDropdown && stokSearch.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border rounded-2xl shadow-2xl max-h-64 overflow-y-auto">
                    {filteredStoklar.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => handleUrunSec(s)}
                            className="p-4 hover:bg-emerald-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                        >
                            <div>
                                <div className="font-bold text-gray-800">{s.urun_adi}</div>
                                <div className="text-xs text-gray-400">Barkod: {s.barkod} | Mevcut Stok: {s.guncel_stok} {s.birim}</div>
                            </div>
                            <div className="text-emerald-600 font-bold">{s.alis_fiyati} ₺</div>
                        </div>
                    ))}
                    {filteredStoklar.length === 0 && <div className="p-4 text-center text-gray-400 italic">Ürün bulunamadı.</div>}
                </div>
            )}
          </div>

          {/* Fatura Satırları Tablosu */}
          <div className="border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-[10px] font-black uppercase text-gray-500 border-b">
                <tr>
                  <th className="p-4">Ürün Bilgisi</th>
                  <th className="p-4 w-24">Miktar</th>
                  <th className="p-4 w-32">Birim Fiyat</th>
                  <th className="p-4 w-20">KDV%</th>
                  <th className="p-4 w-20">İSK%</th>
                  <th className="p-4 text-right">Tutar</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {satirlar.map((s, index) => (
                  <tr key={index} className="hover:bg-gray-50 group">
                    <td className="p-4 font-bold text-gray-700">{s.urun_adi}</td>
                    <td className="p-4">
                        <input type="number" className="w-full border p-2 rounded-lg" value={s.miktar} onChange={e => updateSatir(index, 'miktar', e.target.value)} />
                    </td>
                    <td className="p-4">
                        <input type="number" className="w-full border p-2 rounded-lg text-right" value={s.birim_fiyat} onChange={e => updateSatir(index, 'birim_fiyat', e.target.value)} />
                    </td>
                    <td className="p-4">
                        <input type="number" className="w-full border p-2 rounded-lg" value={s.kdv_orani} onChange={e => updateSatir(index, 'kdv_orani', e.target.value)} />
                    </td>
                    <td className="p-4">
                        <input type="number" className="w-full border p-2 rounded-lg" value={s.iskonto_orani} onChange={e => updateSatir(index, 'iskonto_orani', e.target.value)} />
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-gray-900">
                        {Number(s.satir_toplami).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="p-4">
                        <button onClick={() => setSatirlar(satirlar.filter((_, i) => i !== index))} className="text-red-300 hover:text-red-600">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alt Toplamlar ve İşlem Barı */}
      <div className="bg-gray-900 text-white p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex gap-10">
          <div className="text-center">
              <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Ara Toplam</div>
              <div className="text-xl font-bold">{araToplam.toLocaleString()} ₺</div>
          </div>
          <div className="text-center">
              <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Toplam KDV</div>
              <div className="text-xl font-bold text-blue-400">{toplamKdv.toLocaleString()} ₺</div>
          </div>
          <div className="text-center bg-white/10 px-6 py-2 rounded-2xl">
              <div className="text-[10px] text-emerald-400 uppercase font-bold mb-1">Genel Toplam</div>
              <div className="text-3xl font-black text-emerald-400">{genelToplam.toLocaleString()} ₺</div>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
    <button 
        type="button"
        onClick={() => handleSave(false)} 
        className="flex-1 md:flex-none px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-2xl font-bold transition-all"
    >
        Taslak Kaydet
    </button>
    <button 
        type="button"
        onClick={() => handleSave(true)} 
        className="flex-1 md:flex-none px-12 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black shadow-xl shadow-emerald-900/20 transition-all active:scale-95"
    >
        FATURAYI ONAYLA
    </button>
</div>
      </div>

      {/* Modallar */}
      {isCariModalOpen && <CariForm onClose={() => setIsCariModalOpen(false)} onSuccess={fetchData} />}
      {isStokModalOpen && <StockForm onClose={() => setIsStokModalOpen(false)} onSuccess={fetchData} />}
    </div>
  );
}