'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) alert(error.message);
    else router.refresh(); 
  router.push('/admin/dashboard'); // Giriş sonrası Admin paneline yönlendir
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-xl rounded-lg w-96 border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Sistem Girişi</h2>
        <input className="w-full p-2 mb-4 border rounded" type="email" placeholder="E-posta" onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full p-2 mb-4 border rounded" type="password" placeholder="Şifre" onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 font-bold">Giriş Yap</button>
        <p className="mt-4 text-center text-sm">
          Hesabın yok mu? <a href="/register" className="text-blue-500 underline">Kayıt Ol</a>
        </p>
      </form>
    </div>
  );
}