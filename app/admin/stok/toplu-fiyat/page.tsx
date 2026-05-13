'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TopluFiyatPage() {
  const supabase = createClient();
  const [oran, setOran] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (oran === 0) return;
    
    const confirmMsg = oran > 0 
      ? `Tüm ürünlere %${oran} ZAM yapılacak. Emin misiniz?` 
      : `Tüm ürünlere %${Math.abs(oran)} İNDİRİM yapılacak. Emin misiniz?`;

    if (!confirm(confirmMsg)) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc('toplu_fiyat_guncelle', { yuzde_oran: oran });
      
      if (error) throw error;
      
      alert("Tüm fiyatlar başarıyla güncellendi!");
      setOran(0);
    } catch (error: any) {
      alert("Hata oluştu: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-[#1e293b] rounded-3xl p-8 border border-slate-700 shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
          <span className="text-indigo-500">📈</span> Toplu Fiyat Güncelleme
        </h1>
        <p className="text-slate-400 mb-8">
          Bu işlem kooperatifteki **tüm aktif ürünlerin** satış fiyatlarını yüzde bazında günceller.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Giriş Alanı */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Güncelleme Oranı (%)</label>
            <div className="flex items-center gap-4">
              <input 
                type="number"
                value={oran}
                onChange={(e) => setOran(Number(e.target.value))}
                className="flex-1 bg-[#0f172a] border-2 border-indigo-500 rounded-2xl p-6 text-4xl font-mono text-white outline-none focus:ring-4 focus:ring-indigo-500/20"
                placeholder="Örn: 10"
              />
              <div className="text-2xl font-bold text-slate-500">%</div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              * Zam için pozitif (10), indirim için negatif (-5) değer giriniz.
            </p>
          </div>

          {/* Aksiyon Alanı */}
          <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">İşlem Türü:</span>
              <span className={oran >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {oran >= 0 ? "Fiyat Artışı (Zam)" : "Fiyat Düşüşü (İndirim)"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Etkilenecek Birim:</span>
              <span className="text-white font-bold">Tüm Stok Kartları</span>
            </div>
            <button 
              disabled={oran === 0 || isUpdating}
              onClick={handleUpdate}
              className={`w-full py-6 rounded-2xl font-black text-xl transition-all shadow-xl 
                ${oran > 0 ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20" : 
                  oran < 0 ? "bg-red-600 hover:bg-red-500 shadow-red-900/20" : 
                  "bg-slate-700 cursor-not-allowed opacity-50"}`}
            >
              {isUpdating ? "GÜNCELLENİYOR..." : "İŞLEMİ ONAYLA"}
            </button>
          </div>
        </div>
      </div>

      {/* Uyarı Notu */}
      <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex gap-4 items-start">
        <span className="text-2xl">⚠️</span>
        <div className="text-sm text-amber-200/80">
          <strong>Dikkat:</strong> Bu işlem veritabanı seviyesinde gerçekleşir ve toplu bir değişikliktir. İşlemden önce mevcut fiyatlarınızın bir yedeğini almanız veya raporları kontrol etmeniz önerilir.
        </div>
      </div>
    </div>
  );
}