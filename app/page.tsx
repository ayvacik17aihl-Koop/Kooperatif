import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white max-w-5xl w-full rounded-2xl shadow-2xl p-12 flex flex-col items-center text-center">
        
        {/* LOGO ALANI */}
        <div className="mb-8">
          <img src="/logo.png" alt="Ayvacık Anadolu İmam Hatip Lisesi" className="w-40 mx-auto" />
        </div>

        {/* BAŞLIK */}
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
          Ayvacık Anadolu İmam Hatip Lisesi
        </h1>
        <h2 className="text-2xl font-bold text-red-600 mb-8">
          OKUL KOOPERATİFİ YÖNETİM PORTALI
        </h2>
        
        <p className="text-slate-600 text-lg mb-12 max-w-2xl">
          Eğitimde dayanışma, yönetimde şeffaflık. Okulumuzun finansal süreçlerini dijitalleştiren bu portal ile kooperatif yönetimini daha hızlı, güvenli ve erişilebilir kılıyoruz.
        </p>

        {/* ÖZELLİK KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="text-red-600 text-3xl mb-4">👁️</div>
            <h3 className="font-bold text-slate-900 mb-2">Şeffaf Kasa</h3>
            <p className="text-sm text-slate-500">Tüm finansal hareketler anlık izlenebilir.</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="text-red-600 text-3xl mb-4">👥</div>
            <h3 className="font-bold text-slate-900 mb-2">Üye Yönetimi</h3>
            <p className="text-sm text-slate-500">Pay defterleri ve üye işlemleri tek merkezde.</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="text-red-600 text-3xl mb-4">📊</div>
            <h3 className="font-bold text-slate-900 mb-2">Akıllı Rapor</h3>
            <p className="text-sm text-slate-500">Otomatik bilanço ve yıllık faaliyet raporu.</p>
          </div>
        </div>

        {/* GİRİŞ BUTONU */}
        <Link 
          href="/login" 
          className="bg-slate-900 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-red-600 transition-all flex items-center gap-2"
        >
          PORTALA GİRİŞ YAP ➔
        </Link>

        {/* FOOTER */}
        <p className="text-slate-400 text-xs mt-12 uppercase tracking-widest font-bold">
          © 2026 Ayvacık Anadolu İmam Hatip Lisesi Kooperatif Yönetimi
        </p>
      </div>
    </div>
  );
}