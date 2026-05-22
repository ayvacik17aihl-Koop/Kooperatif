'use client';
import { Wallet, Users, Box, TrendingUp, ArrowUpRight } from 'lucide-react';

export default function AdminDashboard() {
  // Veriler burada dinamik gelecek
  const stats = [
    { title: 'TOPLAM KASA', value: '284.500 ₺', icon: Wallet, color: 'bg-[#1e2a5e]' },
    { title: 'AKTİF ORTAKLAR', value: '145', icon: Users, color: 'bg-[#e63946]' },
    { title: 'STOK KALEMİ', value: '124', icon: Box, color: 'bg-zinc-800' },
  ];

  return (
    <div className="space-y-8">
      {/* Karşılama */}
      <div className="bg-white p-8 rounded-2xl border-l-4 border-[#1e2a5e] shadow-sm">
        <h1 className="text-3xl font-black text-[#1e2a5e]">Yönetim Paneli</h1>
        <p className="text-zinc-500 mt-1">Ayvacık Anadolu İmam Hatip Lisesi Kooperatif Portalı</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 tracking-widest">{stat.title}</p>
              <h2 className="text-2xl font-black text-[#1e2a5e] mt-1">{stat.value}</h2>
            </div>
            <div className={`${stat.color} p-3 rounded-xl text-white`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Görsel Alanı */}
      <div className="h-64 rounded-2xl bg-gradient-to-r from-[#1e2a5e] to-[#2d3a75] p-8 flex flex-col justify-center text-white">
        <h2 className="text-3xl font-bold">Dijital Dönüşüm Başladı</h2>
        <p className="text-zinc-300 mt-2 max-w-lg">Kooperatif verimliliğini artırmak için yeni nesil takip sistemine hoş geldiniz.</p>
      </div>
    </div>
  );
}