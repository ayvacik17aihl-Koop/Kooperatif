'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Wallet, Box, LayoutDashboard, Receipt, ShoppingCart, Package, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Logonuzdaki renklerle uyumlu menü
  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Üyeler / Ortaklar', path: '/admin/uyeler', icon: Users },
    { name: 'Maliye & Kasa', path: '/admin/muhasebe/kasa', icon: Wallet },
    { name: 'Stok Yönetimi', path: '/admin/stok', icon: Box },
    { name: 'Alış Faturası', path: '/admin/alis-faturasi', icon: Receipt },
    { name: 'Toplu Satış', path: '/admin/toplu-satis', icon: Receipt },
    { name: 'Hızlı Satış', path: '/admin/hizli-satis', icon: ShoppingCart },
    { name: 'Cari Yönetimi', path: '/admin/cari', icon: Users },
    
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 flex">
      
      {/* MOBİL HEADER - Lacivert Temalı */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1e2a5e] text-white px-4 flex items-center justify-between z-40 shadow-lg">
        <span className="font-bold tracking-tight">Ayvacık İHL Kooperatif</span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-white"><Menu size={24} /></button>
      </div>

      {/* SIDEBAR - Lacivert & Kırmızı Vurgular */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#1e2a5e] text-white transition-all duration-300 lg:translate-x-0 lg:relative ${isOpen ? 'lg:w-64' : 'lg:w-20'} ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}`}>
        
        <div className="h-16 flex items-center px-6 border-b border-[#2d3a75]">
          <div className="w-8 h-8 bg-[#e63946] rounded-full flex items-center justify-center font-bold">K</div>
          <span className={`ml-3 font-bold ${!isOpen && 'lg:hidden'}`}>AYVACIK İHL</span>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${isActive ? 'bg-[#e63946] text-white shadow-md' : 'text-zinc-300 hover:bg-[#2d3a75] hover:text-white'}`}>
                <Icon size={20} />
                <span className={`${!isOpen && 'lg:hidden'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 pt-16 lg:pt-0 overflow-x-hidden">
        <div className="p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}