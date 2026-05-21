'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, Wallet, Box, LayoutDashboard, Receipt, 
  ShoppingCart, Package, Tags, Menu, X, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true); // Masaüstü varsayılan açık
  const [mobileOpen, setMobileOpen] = useState(false); // Mobil varsayılan kapalı
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Üyeler / Ortaklar', path: '/admin/uyeler', icon: Users },
    { name: 'Maliye & Kasa', path: '/admin/muhasebe', icon: Wallet },
    { name: 'Stok Yönetimi', path: '/admin/stok', icon: Box },
    { name: 'Alış Faturası', path: '/admin/alis-faturasi', icon: Receipt },
    { name: 'Hızlı Satış', path: '/admin/hizli-satis', icon: ShoppingCart },
    { name: 'Toplu Satış', path: '/admin/toplu-satis', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex">
      
      {/* 📱 MOBİL TEPENAV (Sadece mobilde görünür) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">K</div>
          <span className="font-bold text-sm tracking-tight">Kooperatif Panel</span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* 💻 MASAÜSTÜ SIDEBAR (Genişliği dinamik olarak ayarlanır) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800
        flex flex-col transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:relative
        ${isOpen ? 'lg:w-64' : 'lg:w-20'}
        ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Alanı */}
        <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!isOpen && 'lg:justify-center lg:w-full'}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/20 flex-shrink-0">
              K
            </div>
            <span className={`font-bold tracking-tight text-zinc-900 dark:text-white transition-opacity duration-200 ${!isOpen && 'lg:hidden'}`}>
              Kooperatif<span className="text-indigo-600 font-medium">.io</span>
            </span>
          </div>

          {/* Sidebar Küçültme Butonu (Sadece Masaüstünde Görünür) */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="hidden lg:flex p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-600 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 absolute -right-3.5 top-4 shadow-sm z-50"
          >
            {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {/* Menü Elemanları */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'}
                `}
              >
                <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-indigo-500'}`} />
                <span className={`transition-opacity duration-200 ${!isOpen && 'lg:hidden'}`}>
                  {item.name}
                </span>

                {/* Küçülmüş menüde hover olunca isim fırlaması (Tooltip) */}
                {!isOpen && (
                  <div className="hidden lg:group-hover:block absolute left-16 bg-zinc-900 text-white text-xs px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap z-50 shadow-md">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Alt Profil / Sürüm Bilgisi */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 font-bold text-xs flex items-center justify-center text-zinc-700 dark:text-zinc-300">AD</div>
            <div className={`transition-opacity duration-200 ${!isOpen && 'lg:hidden'}`}>
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Admin K.</div>
              <div className="text-[10px] text-zinc-400">Yönetici Modu</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobil Menü Açıkken Arkada Kalan Karartma Katmanı */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* 💻 SAĞ ANA İÇERİK ALANI */}
      <main className="flex-1 w-full pt-16 lg:pt-0 overflow-x-hidden">
        <div className="p-4 md:p-8 lg:p-10">
          {children}
        </div>
      </main>

    </div>
  );
}