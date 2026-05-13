'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PosScreen() {
  const supabase = createClient();
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCari, setSelectedCari] = useState<any>(null); // Boşsa Perakende Müşteri
  const [barcode, setBarcode] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // 1. Barkod Okutma Mantığı
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: urun } = await supabase
      .from('stok_kartlari')
      .select('*')
      .eq('barkod', barcode)
      .single();

    if (urun) {
      addToCart(urun);
      setBarcode('');
    } else {
      alert("Ürün bulunamadı!");
    }
  };

  const addToCart = (urun: any) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === urun.id);
      if (exists) {
        return prev.map(item => item.id === urun.id ? { ...item, miktar: item.miktar + 1 } : item);
      }
      return [...prev, { ...urun, miktar: 1 }];
    });
  };

  // 2. Hesaplamalar (Cari İndirimi Dahil)
  const araToplam = cart.reduce((acc, item) => acc + (item.satis_fiyati * item.miktar), 0);
  const indirimOrani = selectedCari?.indirim_orani || 0;
  const indirimTutari = (araToplam * indirimOrani) / 100;
  const genelToplam = araToplam - indirimTutari;

  // 3. Satışı Tamamla
  const handleCheckout = async (odemeTipi: 'Nakit' | 'Kredi Kartı' | 'Veresiye') => {
    if (cart.length === 0) return;

    try {
      // Fatura kaydı (Tür: Satış)
      const { data: fatura, error: fErr } = await supabase.from('faturalar').insert({
        tür: 'Satış',
        cari_id: selectedCari?.id || '00000000-0000-0000-0000-000000000000',
        genel_toplam: genelToplam,
        durum: 'Onaylandı',
        notlar: `POS Satışı - ${odemeTipi}`
      }).select().single();

      if (fErr) throw fErr;

      // Stok düşümü ve Hareket kaydı için RPC fonksiyonunu tetikle
      // (Daha önce yazdığımız fatura_onayla fonksiyonunun satış versiyonu)
      await supabase.rpc('satis_onayla', { f_id: fatura.id });

      alert("Satış Başarıyla Tamamlandı!");
      setCart([]);
      setSelectedCari(null);
    } catch (error: any) {
      alert("Hata: " + error.message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* SOL TARAF: SEPET */}
      <div className="flex-1 flex flex-col p-6 border-r border-gray-800">
        <form onSubmit={handleBarcodeSubmit} className="mb-6">
          <input
            ref={barcodeInputRef}
            autoFocus
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Barkod okutun veya ürün adı yazın..."
            className="w-full bg-gray-800 border-2 border-indigo-500 p-4 rounded-2xl text-xl focus:ring-4 focus:ring-indigo-900 outline-none"
          />
        </form>

        <div className="flex-1 overflow-y-auto space-y-2">
          {cart.map((item, index) => (
            <div key={index} className="flex justify-between items-center bg-gray-800 p-4 rounded-xl">
              <div>
                <div className="font-bold">{item.urun_adi}</div>
                <div className="text-sm text-gray-400">{item.miktar} {item.birim} x {item.satis_fiyati}₺</div>
              </div>
              <div className="text-xl font-mono font-bold">{(item.miktar * item.satis_fiyati).toFixed(2)}₺</div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-gray-700 pt-4 space-y-2">
          <div className="flex justify-between text-gray-400">
            <span>Ara Toplam</span>
            <span>{araToplam.toFixed(2)}₺</span>
          </div>
          {indirimTutari > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Cari İndirimi (%{indirimOrani})</span>
              <span>-{indirimTutari.toFixed(2)}₺</span>
            </div>
          )}
          <div className="flex justify-between text-3xl font-black">
            <span>TOPLAM</span>
            <span className="text-indigo-400">{genelToplam.toFixed(2)}₺</span>
          </div>
        </div>
      </div>

      {/* SAĞ TARAF: KONTROLLER */}
      <div className="w-96 bg-gray-800 p-6 flex flex-col gap-4">
        <div className="bg-gray-700 p-4 rounded-2xl border border-gray-600">
          <label className="text-xs font-bold text-gray-400 uppercase">Müşteri / Üye</label>
          <div className="text-lg font-bold truncate">
            {selectedCari ? selectedCari.tam_ad : '👤 PERAKENDE MÜŞTERİ'}
          </div>
          <button className="mt-2 text-xs text-indigo-400 hover:underline">Müşteri Seç/Değiştir</button>
        </div>

        <div className="grid grid-cols-1 gap-3 mt-auto">
          <button 
            onClick={() => handleCheckout('Nakit')}
            className="py-6 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-xl shadow-xl shadow-emerald-900/20"
          >
            💵 NAKİT
          </button>
          <button 
            onClick={() => handleCheckout('Kredi Kartı')}
            className="py-6 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-xl"
          >
            💳 KREDİ KARTI
          </button>
          <button 
            onClick={() => handleCheckout('Veresiye')}
            className="py-4 bg-gray-600 hover:bg-gray-500 rounded-2xl font-bold"
          >
            📝 VERESİYE (CARİYE İŞLE)
          </button>
          <button 
            onClick={() => setCart([])}
            className="py-4 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-2xl font-bold mt-4"
          >
            İPTAL ET
          </button>
        </div>
      </div>
    </div>
  );
}