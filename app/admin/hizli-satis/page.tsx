'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function HizliSatisPage() {
  const supabase = createClient();
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cariler, setCariler] = useState<any[]>([]);
  const [selectedCari, setSelectedCari] = useState<any>(null);
  const [kasalar, setKasalar] = useState<any[]>([]);
  const [selectedKasa, setSelectedKasa] = useState('');
  const [miktar, setMiktar] = useState(1); // Miktar kontrolü
  const [cariSearch, setCariSearch] = useState('');
const [isCariListOpen, setIsCariListOpen] = useState(false)
const [lastInvoice, setLastInvoice] = useState<any>(null);

// Cari Filtreleme Mantığı
const filteredCariler = cariler.filter(c => 
  c.tam_ad.toLowerCase().includes(cariSearch.toLowerCase())
);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
  const fetchData = async () => {
    const { data: kData } = await supabase.from('kasa_kartlari').select('*');
    
    // Filtreleri kaldırıp tüm carileri çekiyoruz
    const { data: cData, error: cErr } = await supabase
      .from('cari_kartlari')
      .select('id, tam_ad, indirim_orani, cari_tipi')
      .order('tam_ad', { ascending: true }); // Alfabetik sıralama

    if (kData) {
      setKasalar(kData);
      setSelectedKasa(kData[0]?.id);
    }
    if (cData) setCariler(cData);
  };
  fetchData();
}, []);

  // Ürün Arama (Barkodsuz ürünler için)
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length < 2) { setSearchResults([]); return; }
      const { data } = await supabase
        .from('stok_kartlari')
        .select('*')
        .ilike('urun_adi', `%${searchQuery}%`)
        .limit(5);
      if (data) setSearchResults(data);
    };
    const timeout = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const addToCart = (urun: any, adet: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === urun.id);
      if (existing) {
        return prev.map(item => item.id === urun.id ? { ...item, miktar: item.miktar + adet } : item);
      }
      return [...prev, { ...urun, miktar: adet }];
    });
    setMiktar(1); // İşlem sonrası miktarı sıfırla
    setSearchQuery('');
    setSearchResults([]);
    barcodeInputRef.current?.focus();
  };

  const handleBarcodeSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const { data: urun } = await supabase.from('stok_kartlari').select('*').eq('barkod', barcode).single();
    if (urun) {
      addToCart(urun, miktar);
      setBarcode('');
    } else {
      alert("Ürün bulunamadı!");
    }
  };

  const araToplam = cart.reduce((acc, item) => acc + (item.satis_fiyati * item.miktar), 0);
  const indirimOrani = selectedCari?.indirim_orani || 0;
  const indirimTutari = (araToplam * indirimOrani) / 100;
  const genelToplam = araToplam - indirimTutari;

  const handleCheckout = async (type: 'Nakit' | 'Kredi Kartı' | 'Veresiye') => {
    if (cart.length === 0) return;
    
    // 1. Kontrol: Veresiye ise cari seçilmiş mi?
    if (type === 'Veresiye' && !selectedCari) {
      alert("Veresiye satış için lütfen bir cari/üye seçiniz!");
      return; // fatura henüz oluşmadığı için setLastInvoice burada çağrılamaz
    }

    try {
      // 2. Fatura Başlığını Oluştur
      const { data: yeniFatura, error: fErr } = await supabase.from('faturalar').insert({
        fatura_no: `PS-${Math.floor(100000 + Math.random() * 900000)}`,
        tür: 'Satış',
        cari_id: selectedCari?.id || '00000000-0000-0000-0000-000000000000',
        kasa_id: type === 'Veresiye' ? null : selectedKasa,
        toplam_ara_tutar: araToplam,
        toplam_iskonto: indirimTutari,
        genel_toplam: genelToplam,
        durum: 'Taslak'
      }).select().single();

      if (fErr) throw fErr;

      // 3. Fatura Satırlarını Oluştur
      const satirlar = cart.map(item => ({
        fatura_id: yeniFatura.id,
        stok_id: item.id,
        miktar: item.miktar,
        birim_fiyat: item.satis_fiyati,
        kdv_orani: item.kdv_orani,
        satir_toplami: item.miktar * item.satis_fiyati
      }));

      const { error: sErr } = await supabase.from('fatura_satirlari').insert(satirlar);
      if (sErr) throw sErr;

      // 4. Stok ve Cari Bakiyelerini Güncelleyen RPC'yi Çalıştır
      const { error: rpcErr } = await supabase.rpc('satis_onayla', { f_id: yeniFatura.id });
      if (rpcErr) throw rpcErr;

      // Başarılı işlem sonrası state güncellemeleri
      setLastInvoice(yeniFatura); // Artık 'yeniFatura' tanımlı, güvenle kaydedebilirsin
      alert("Satış Başarıyla Tamamlandı!");
      setCart([]);
      setSelectedCari(null);
      setBarcode('');
      
    } catch (error: any) { 
      console.error("Satış hatası:", error);
      alert("Satış sırasında bir hata oluştu: " + error.message); 
    }
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-white overflow-hidden font-sans">
      {/* SOL: SATIŞ ALANI */}
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* ÜST BAR: MİKTAR + BARKOD + ARAMA */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Miktar</label>
            <input 
              type="number" 
              value={miktar} 
              onChange={(e) => setMiktar(Number(e.target.value))}
              className="w-full p-4 bg-[#1e293b] border-2 border-slate-700 rounded-xl text-2xl text-center font-bold text-indigo-400 focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="col-span-5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Barkod Okut</label>
            <form onSubmit={handleBarcodeSubmit}>
              <input
                ref={barcodeInputRef}
                className="w-full p-4 bg-[#1e293b] border-2 border-indigo-500 rounded-xl text-2xl font-mono focus:ring-4 focus:ring-indigo-500/20 outline-none"
                placeholder="||||||||||||||"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </form>
          </div>
          <div className="col-span-5 relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Ürün Seç (İsim ile)</label>
            <input
              className="w-full p-4 bg-[#1e293b] border-2 border-slate-700 rounded-xl text-xl outline-none focus:border-emerald-500"
              placeholder="Ürün adı yazın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                {searchResults.map(urun => (
                  <button 
                    key={urun.id} 
                    onClick={() => addToCart(urun, miktar)}
                    className="w-full p-4 text-left hover:bg-emerald-600 border-b border-slate-700 last:border-0 flex justify-between"
                  >
                    <span className="font-bold">{urun.urun_adi}</span>
                    <span className="text-emerald-400 font-mono">{urun.satis_fiyati} ₺</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SEPET LİSTESİ */}
        <div className="flex-1 bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-tighter">
            <span>Ürün Detayı</span>
            <span>Tutar</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center bg-[#0f172a] p-4 rounded-xl border border-slate-800 group">
                <div className="flex flex-col">
                  <span className="font-bold text-lg">{item.urun_adi}</span>
                  <span className="text-slate-500">{item.miktar} Adet x {item.satis_fiyati} ₺</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-indigo-400 font-mono">{(item.miktar * item.satis_fiyati).toFixed(2)} ₺</div>
                  <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-xs text-red-500 hover:underline">Kaldır</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SAĞ: ÖDEME VE CARİ PANELİ */}
      <div className="w-[400px] bg-[#1e293b] border-l border-slate-800 p-6 flex flex-col">
        <div className="space-y-6">
          {/* CARİ SEÇİCİ */}
          
          <div>
  <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-widest">Cari / Üye Seçimi</label>
  <div className="relative">
    {/* Seçili Cari Görünümü veya Arama Girişi */}
    <div 
      onClick={() => setIsCariListOpen(!isCariListOpen)}
      className="w-full p-4 bg-[#0f172a] border border-slate-700 rounded-xl font-bold text-emerald-400 cursor-pointer flex justify-between items-center"
    >
      <span>{selectedCari ? selectedCari.tam_ad : "👤 PERAKENDE MÜŞTERİ"}</span>
      <span className="text-xs text-slate-500">{isCariListOpen ? '▲' : '▼'}</span>
    </div>

    {/* Açılır Arama Paneli */}
    {isCariListOpen && (
      <div className="absolute z-[60] w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <input 
          autoFocus
          className="w-full p-3 bg-slate-900 border-b border-slate-700 outline-none text-sm"
          placeholder="Cari Ara..."
          value={cariSearch}
          onChange={(e) => setCariSearch(e.target.value)}
        />
        <div className="max-h-60 overflow-y-auto">
          <button 
            onClick={() => { setSelectedCari(null); setIsCariListOpen(false); setCariSearch(''); }}
            className="w-full p-3 text-left hover:bg-slate-700 border-b border-slate-700 flex justify-between items-center"
          >
            <span className="text-sm font-bold">PERAKENDE MÜŞTERİ</span>
            <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-500">%0</span>
          </button>
          
          {filteredCariler.map(c => (
            <button 
              key={c.id} 
              onClick={() => {
                setSelectedCari(c);
                setIsCariListOpen(false);
                setCariSearch('');
              }}
              className="w-full p-3 text-left hover:bg-indigo-600 border-b border-slate-700 last:border-0 flex justify-between items-center group"
            >
              <div>
                <div className="text-sm font-bold group-hover:text-white">{c.tam_ad}</div>
                <div className="text-[10px] text-slate-500 group-hover:text-indigo-200">{c.cari_tipi || 'Üye'}</div>
              </div>
              <span className="text-xs font-black bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                %{c.indirim_orani || 0} İndirim
              </span>
            </button>
          ))}

          {filteredCariler.length === 0 && (
            <div className="p-4 text-center text-slate-500 text-xs">Cari bulunamadı.</div>
          )}
        </div>
      </div>
    )}
  </div>
</div>

          {/* KASA SEÇİCİ */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-widest">Ödeme Hesabı</label>
            <select 
              className="w-full p-4 bg-[#0f172a] border border-slate-700 rounded-xl font-bold text-indigo-400 outline-none"
              value={selectedKasa}
              onChange={(e) => setSelectedKasa(e.target.value)}
            >
              {kasalar.map(k => <option key={k.id} value={k.id}>{k.kasa_adi}</option>)}
            </select>
          </div>
        </div>

        {/* TOPLAMLAR VE BUTONLAR */}
        <div className="mt-auto space-y-6">
          <div className="border-t border-slate-800 pt-6 space-y-2 font-mono">
            <div className="flex justify-between text-slate-500">
              <span>Ara Toplam:</span>
              <span>{araToplam.toFixed(2)} ₺</span>
            </div>
            {indirimTutari > 0 && (
              <div className="flex justify-between text-emerald-500 font-bold">
                <span>İndirim (%{indirimOrani}):</span>
                <span>-{indirimTutari.toFixed(2)} ₺</span>
              </div>
            )}
            <div className="flex justify-between items-end border-b border-slate-800 pb-4">
              <span className="text-xs font-black text-slate-400 uppercase">Toplam</span>
              <span className="text-5xl font-black text-white tracking-tighter">{genelToplam.toFixed(2)} ₺</span>
            </div>
          </div>

          <div className="grid gap-4">
            <button onClick={() => handleCheckout('Nakit')} className="bg-emerald-600 hover:bg-emerald-500 p-6 rounded-2xl font-black text-xl active:scale-95 transition-all">💵 NAKİT</button>
            <button onClick={() => handleCheckout('Kredi Kartı')} className="bg-blue-600 hover:bg-blue-500 p-6 rounded-2xl font-black text-xl active:scale-95 transition-all">💳 KREDİ KARTI</button>
            <button onClick={() => handleCheckout('Veresiye')} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl font-bold text-slate-300">📝 VERESİYE (BORÇLANDIR)</button>
            
            <button 
    onClick={() => window.print()} 
    className="w-full bg-orange-500 hover:bg-orange-400 p-4 rounded-xl font-bold text-white mt-4 flex justify-center items-center gap-2"
  >
    <span>🖨️ SON FİŞİ YAZDIR</span>
  </button>

          </div>
          
        </div>
      </div>
    </div>
  );
}