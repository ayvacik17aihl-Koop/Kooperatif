'use client';

import { useState, useEffect } from 'react';
// import { createClient } from '@/lib/supabase/client'; // Kendi projende burayı açmayı unutma
import { 
  TrendingUp, Users, Wallet, Box, 
  ArrowUpRight, ArrowDownRight, Activity,
  Calendar, LayoutDashboard, Receipt, ShoppingCart, Package, Tags
} from 'lucide-react';

export default function AdminDashboard() {
  // const supabase = createClient();
  
  // Arayüzün önizlemede dolu görünmesi için varsayılan (mock) veriler ekledim.
  const [stats, setStats] = useState({
    toplamCari: 145,
    toplamKasa: 284500,
    aktifStok: 124,
    aylikGelir: 45200
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getStats() {
      try {
        /* Supabase kodların (Kendi projende bu yorum satırlarını kaldır)
        const { count: cariCount } = await supabase.from('cari_kartlari').select('*', { count: 'exact', head: true });
        const { data: kasaData } = await supabase.from('kasa_kartlari').select('guncel_bakiye');
        const toplamNakit = kasaData?.reduce((acc, k) => acc + (k.guncel_bakiye || 0), 0) || 0;

        setStats({
          toplamCari: cariCount || 0,
          toplamKasa: toplamNakit,
          aktifStok: 124, 
          aylikGelir: 45200 
        });
        */
        setLoading(false);
      } catch (error) {
        console.error("Veri çekme hatası:", error);
        setLoading(false);
      }
    }
    getStats();
  }, []);

  // Tarih formatlayıcı
  const today = new Date().toLocaleDateString('tr-TR', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    // Ana konteyner: Arka plan renkleri layout'tan gelir, burada sadece padding ve max-width ayarlıyoruz
    <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* HEADER ALANI */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Yönetim Paneli
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm tracking-wide uppercase ml-12">
            Kooperatif Operasyonel Durum Raporu
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {today}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wide w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Sistem Çevrimiçi
          </div>
        </div>
      </div>

      {/* HIZLI EYLEMLER (Üstteki Linklerin Modern Hali) */}
      <div className="flex flex-wrap items-center gap-3">
        <a href="/admin/alis-faturasi" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-full text-sm font-medium hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm">
          <Receipt size={16} />
          Alış Faturası
        </a>
        <a href="/admin/hizli-satis" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-full text-sm font-medium hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-sm">
          <ShoppingCart size={16} />
          Hızlı Satış
        </a>
        <a href="/admin/toplu-satis" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-full text-sm font-medium hover:border-purple-500/50 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shadow-sm">
          <Package size={16} />
          Toplu Satış
        </a>
        <a href="/admin/etiket-yazdir" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-full text-sm font-medium hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 transition-colors shadow-sm">
          <Tags size={16} />
          Diğer İşlemler
        </a>
      </div>

      {/* ANA KARTLAR (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Kasalar Toplamı */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 bg-emerald-50 dark:bg-emerald-500/10 p-8 rounded-full group-hover:scale-110 transition-transform duration-500">
            <Wallet className="text-emerald-500 dark:text-emerald-400" size={40} />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 tracking-wider">Toplam Likidite</p>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {stats.toplamKasa.toLocaleString('tr-TR')} ₺
          </h2>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 w-fit px-2.5 py-1 rounded-lg">
            <ArrowUpRight size={14} /> %12.4 ARTIŞ
          </div>
        </div>

        {/* Cari Sayısı */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 bg-indigo-50 dark:bg-indigo-500/10 p-8 rounded-full group-hover:scale-110 transition-transform duration-500">
            <Users className="text-indigo-500 dark:text-indigo-400" size={40} />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 tracking-wider">Aktif Ortaklar</p>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{stats.toplamCari}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-4">Kayıtlı Cari Kart Sayısı</p>
        </div>

        {/* Stok Durumu */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl hover:shadow-xl hover:border-amber-500/30 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 bg-amber-50 dark:bg-amber-500/10 p-8 rounded-full group-hover:scale-110 transition-transform duration-500">
            <Box className="text-amber-500 dark:text-amber-400" size={40} />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 tracking-wider">Envanter Gücü</p>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{stats.aktifStok} Kalem</h2>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-4 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Kritik Seviye: 12 Ürün
          </p>
        </div>

        {/* Aylık Performans */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl hover:shadow-xl hover:border-purple-500/30 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 bg-purple-50 dark:bg-purple-500/10 p-8 rounded-full group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="text-purple-500 dark:text-purple-400" size={40} />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 tracking-wider">Aylık Tahsilat</p>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {stats.aylikGelir.toLocaleString('tr-TR')} ₺
          </h2>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 w-fit px-2.5 py-1 rounded-lg">
            <ArrowDownRight size={14} /> %2.1 DÜŞÜŞ
          </div>
        </div>
      </div>

      {/* ORTA BÖLÜM: GÖRSEL VE HIZLI İŞLEMLER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* FİYAKALI GÖRSEL PANEL */}
        <div className="lg:col-span-2 relative h-[350px] sm:h-[400px] rounded-3xl overflow-hidden shadow-xl group border border-zinc-200 dark:border-zinc-800/80">
           <img 
             src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000&auto=format&fit=crop" 
             className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
             alt="Kooperatif Tarım Alanı"
           />
           {/* Gradient Overlay */}
           <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/40 to-transparent"></div>
           
           <div className="absolute bottom-8 left-8 right-8">
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-4 inline-block border border-white/20">
                Vizyon 2026
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Toprağın Gücü, <br/> Birliğin Geleceği.
              </h3>
              <p className="text-zinc-200 mt-3 max-w-md text-sm sm:text-base font-medium leading-relaxed">
                Kooperatifimiz dijital dönüşümle artık çok daha şeffaf ve operasyonel olarak daha güçlü.
              </p>
           </div>
        </div>

        {/* HIZLI ERİŞİM & AKTİVİTE */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 p-6 sm:p-8 shadow-xl flex flex-col">
           <h4 className="text-lg font-bold mb-6 flex items-center gap-2 text-zinc-900 dark:text-white">
              <Activity className="text-indigo-500" size={20} />
              Hızlı Menü
           </h4>
           
           <div className="space-y-3 flex-1">
              <a href="/admin/cari" className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all duration-200 group">
                 <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Cari Yönetimi</span>
                 <ArrowUpRight size={18} className="text-zinc-400 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              
              <a href="/admin/kasa" className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-all duration-200 group">
                 <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Kasa & Banka</span>
                 <ArrowUpRight size={18} className="text-zinc-400 group-hover:text-emerald-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              
              <a href="/admin/stok" className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all duration-200 group">
                 <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Stok Yönetimi</span>
                 <ArrowUpRight size={18} className="text-zinc-400 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              
              <button className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 transition-all duration-200 group">
                 <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400">Stok Hareketleri</span>
                 <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">Yakında</span>
              </button>
           </div>

           <div className="mt-6 p-5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                  <Calendar className="text-indigo-500 dark:text-indigo-400" size={16} />
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Duyuru</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                Mayıs ayı hasat dönemi ödemeleri için kasa limitleri güncellenmiştir.
              </p>
           </div>
        </div>

      </div>

    </div>
  );
}