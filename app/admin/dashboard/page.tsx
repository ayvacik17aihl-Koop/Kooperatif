'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  TrendingUp, Users, Wallet, Box, 
  ArrowUpRight, ArrowDownRight, Activity,
  Calendar, LayoutDashboard
} from 'lucide-react';

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    toplamCari: 0,
    toplamKasa: 0,
    aktifStok: 0,
    aylikGelir: 0
  });
  const [loading, setLoading] = useState(true);






  useEffect(() => {
    async function getStats() {
      // Örnek veri çekme mantığı - Kendi tablolarına göre revize edebilirsin
      const { count: cariCount } = await supabase.from('cari_kartlari').select('*', { count: 'exact', head: true });
      const { data: kasaData } = await supabase.from('kasa_kartlari').select('guncel_bakiye');
      
      const toplamNakit = kasaData?.reduce((acc, k) => acc + (k.guncel_bakiye || 0), 0) || 0;

      setStats({
        toplamCari: cariCount || 0,
        toplamKasa: toplamNakit,
        aktifStok: 124, // Stok modülü bittiğinde dinamikleşecek
        aylikGelir: 45200 // Hareketler tablosundan filtrelenebilir
      });
      setLoading(false);
    }
    getStats();
  }, []);

  return (
    <div className="p-6 bg-[#0f172a] min-h-screen text-white font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-end">
          <Link href="/admin/cari">
          <div>
            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
              <LayoutDashboard className="text-indigo-500" size={36} />
              YÖNETİM PANELİ
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
              Kooperatif Operasyonel Durum Raporu
            </p>
          </div></Link>
          <Link href="/admin/alis-faturasi">Alış Faturası 📑</Link>
          <Link href="/admin/hizli-satis">Hızlı Satış💸</Link>
          <Link href="/admin/toplu-satis">Toplu Satış 🛗</Link>
          <Link href="/admin/alis-faturasi">dsfsdf</Link>
          <Link href="/admin/alis-faturasi">dsfsdf</Link>

            
          
          <div className="text-right hidden md:block">
            <div className="text-sm font-bold text-slate-400">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div className="text-[10px] text-emerald-500 font-black uppercase animate-pulse">● SİSTEM ÇEVRİMİÇİ</div>
          </div>
        </div>

        {/* ANA KARTLAR (Bento Grid Stilinde) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Kasalar Toplamı */}
          <div className="bg-[#1e293b] p-6 rounded-[2.5rem] border border-slate-700 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 bg-emerald-500/10 p-8 rounded-full group-hover:scale-110 transition-transform">
              <Wallet className="text-emerald-500" size={40} />
            </div>
            <p className="text-slate-500 text-[11px] font-black uppercase mb-1">Toplam Likidite</p>
            <h2 className="text-3xl font-black font-mono text-emerald-400">
              {stats.toplamKasa.toLocaleString('tr-TR')} ₺
            </h2>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 w-fit px-2 py-1 rounded-lg">
              <ArrowUpRight size={12} /> %12.4 ARTŞ
            </div>
          </div>

          {/* Cari Sayısı */}
          <div className="bg-[#1e293b] p-6 rounded-[2.5rem] border border-slate-700 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 bg-indigo-500/10 p-8 rounded-full group-hover:scale-110 transition-transform">
              <Users className="text-indigo-500" size={40} />
            </div>
            <p className="text-slate-500 text-[11px] font-black uppercase mb-1">Aktif Ortaklar</p>
            <h2 className="text-3xl font-black font-mono text-white">{stats.toplamCari}</h2>
            <p className="text-[10px] text-slate-500 font-bold mt-4 uppercase">Kayıtlı Cari Kart Sayısı</p>
          </div>

          {/* Stok Durumu */}
          <div className="bg-[#1e293b] p-6 rounded-[2.5rem] border border-slate-700 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 bg-amber-500/10 p-8 rounded-full group-hover:scale-110 transition-transform">
              <Box className="text-amber-500" size={40} />
            </div>
            <p className="text-slate-500 text-[11px] font-black uppercase mb-1">Envanter Gücü</p>
            <h2 className="text-3xl font-black font-mono text-white">{stats.aktifStok} Kalem</h2>
            <p className="text-[10px] text-slate-500 font-bold mt-4 uppercase">Kritik Seviye: 12 Ürün</p>
          </div>

          {/* Aylık Performans */}
          <div className="bg-[#1e293b] p-6 rounded-[2.5rem] border border-slate-700 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 bg-purple-500/10 p-8 rounded-full group-hover:scale-110 transition-transform">
              <TrendingUp className="text-purple-500" size={40} />
            </div>
            <p className="text-slate-500 text-[11px] font-black uppercase mb-1">Aylık Tahsilat</p>
            <h2 className="text-3xl font-black font-mono text-purple-400">
              {stats.aylikGelir.toLocaleString('tr-TR')} ₺
            </h2>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-rose-500 bg-rose-500/10 w-fit px-2 py-1 rounded-lg">
              <ArrowDownRight size={12} /> %2.1 DÜŞÜŞ
            </div>
          </div>
        </div>

        {/* ORTA BÖLÜM: GÖRSEL VE HIZLI İŞLEMLER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FİYAKALI GÖRSEL PANEL */}
          <div className="lg:col-span-2 relative h-[400px] rounded-[3rem] overflow-hidden border border-slate-700 shadow-2xl group">
             <img 
               src="https://picsum.photos/200/300?random=1&auto=format&fit=crop&q=80&w=200" 
               className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
               alt="Kooperatif"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent"></div>
             <div className="absolute bottom-10 left-10">
                <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">Vizyon 2026</span>
                <h3 className="text-4xl font-black leading-none italic">TOPRAĞIN GÜCÜ,<br/>BİRLİĞİN GELECEĞİ.</h3>
                <p className="text-slate-300 mt-4 max-w-md text-sm font-medium">Kooperatifimiz dijital dönüşümle daha şeffaf, daha güçlü.</p>
             </div>
          </div>

          {/* HIZLI ERİŞİM & AKTİVİTE */}
          <div className="bg-[#1e293b] rounded-[3rem] border border-slate-700 p-8 shadow-xl">
             <h4 className="text-lg font-black mb-6 flex items-center gap-2">
                <Activity className="text-indigo-500" size={20} />
                HIZLI MENÜ
             </h4>
             <div className="space-y-3">
                <Link href="/admin/cari" className="flex items-center justify-between p-4 bg-[#0f172a] rounded-2xl border border-slate-800 hover:border-indigo-500 transition-all group">
                   <span className="text-sm font-bold group-hover:text-indigo-400">Cari Yönetimi 🤵</span>
                   <ArrowUpRight size={16} className="text-slate-600 group-hover:text-indigo-400" />
                </Link>
                <Link href="/admin/kasa" className="flex items-center justify-between p-4 bg-[#0f172a] rounded-2xl border border-slate-800 hover:border-emerald-500 transition-all group">
                   <span className="text-sm font-bold group-hover:text-emerald-400">Kasa 💸& Banka 🏦</span>
                   <ArrowUpRight size={16} className="text-slate-600 group-hover:text-emerald-400" />
                </Link>
                <Link href="/admin/stok" className="flex items-center justify-between p-4 bg-[#0f172a] rounded-2xl border border-slate-800 hover:border-indigo-500 transition-all group">
                   <span className="text-sm font-bold group-hover:text-indigo-400">Stok Yönetimi 📦</span>
                   <ArrowUpRight size={16} className="text-slate-600 group-hover:text-indigo-400" />
                </Link>
                <button className="w-full flex items-center justify-between p-4 bg-[#0f172a] rounded-2xl border border-slate-800 hover:border-amber-500 transition-all group">
                   <span className="text-sm font-bold group-hover:text-amber-400">Stok Hareketleri</span>
                   <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-black uppercase">YAKINDA</span>
                </button>
             </div>

             <div className="mt-8 p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl">
                <div className="flex items-center gap-3 mb-2">
                    <Calendar className="text-indigo-400" size={18} />
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Duyuru</span>
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Mayıs ayı hasat dönemi ödemeleri için kasa limitleri güncellenmiştir.
                </p>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}