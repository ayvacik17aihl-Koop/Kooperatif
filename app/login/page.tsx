'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // Hata mesajı stateti
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      // Hatayı ekranda göstermek için state'e aktarıyoruz
      setErrorMsg(error.message === 'Invalid login credentials' ? 'E-posta veya şifre hatalı!' : error.message);
    } else {
      router.refresh(); 
      router.push('/admin/dashboard'); 
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-xl rounded-lg w-96 border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Sistem Girişi</h2>
        
        {/* Hata Mesajı Alanı */}
        {errorMsg && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm font-semibold rounded text-center border border-red-200">
            {errorMsg}
          </div>
        )}

        <input className="w-full p-2 mb-4 border rounded text-black" type="email" placeholder="E-posta" onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full p-2 mb-4 border rounded text-black" type="password" placeholder="Şifre" onChange={(e) => setPassword(e.target.value)} required />
        
        <button 
          disabled={loading} 
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 font-bold disabled:bg-gray-400"
        >
          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </button>
        
        <p className="mt-4 text-center text-sm">
          Hesabın yok mu? <a href="/register" className="text-blue-500 underline">Kayıt Ol</a>
        </p>
      </form>
    </div>
  );
}