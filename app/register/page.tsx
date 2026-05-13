'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName } // Trigger burayı okuyacak
      }
    });

    if (error) alert(error.message);
    else {
      alert("Kayıt başarılı! Giriş yapabilirsiniz.");
      router.push('/login');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleRegister} className="p-8 bg-white shadow-md rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Kooperatif Kayıt</h2>
        <input className="w-full p-2 mb-4 border rounded" type="text" placeholder="Ad Soyad" onChange={(e) => setFullName(e.target.value)} required />
        <input className="w-full p-2 mb-4 border rounded" type="email" placeholder="E-posta" onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full p-2 mb-4 border rounded" type="password" placeholder="Şifre" onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Kayıt Ol</button>
      </form>
    </div>
  );
}