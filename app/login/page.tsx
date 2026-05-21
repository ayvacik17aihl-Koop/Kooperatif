'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      // 1. Supabase Auth ile Giriş Yap
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (authError) {
        setLoading(false);
        setErrorMsg(authError.message === 'Invalid login credentials' ? 'E-posta veya şifre hatalı!' : authError.message);
        return;
      }

      const user = authData?.user;
      if (!user) {
        setLoading(false);
        setErrorMsg('Kullanıcı oturumu alınamadı.');
        return;
      }

      // 2. Şemaya Uygun Rol Kontrolü (kullanici_rolleri -> roller)
      const { data: userRole, error: roleError } = await supabase
        .from('kullanici_rolleri')
        .select('roller(is_superadmin, rol_adi)')
        .eq('kullanici_id', user.id)
        .maybeSingle();

      const roleObj = userRole?.roller as any;

      // Eğer kullanıcı sistem yöneticisi (SuperAdmin) ise direkt admin paneline fırlat
      if (roleObj?.is_superadmin) {
        window.location.href = '/admin/dashboard';
        return;
      }

      // 3. Admin Değilse Cari/Üye Ayrımı İçin Profil Getir
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (!profile?.username) {
        // Eğer kullanıcı personelse ama süper admin değilse yine admin paneline gitsin (Layout onu içeride kısıtlar)
        window.location.href = '/admin/dashboard';
        return;
      }

      // 4. username (T.C. No) ile cari_kartlari tablosundan 'Üye' mi yoksa dış cari mi kontrol et
      const { data: cari } = await supabase
        .from('cari_kartlari')
        .select('cari_tipi')
        .eq('tc_no', profile.username)
        .maybeSingle();

      if (cari?.cari_tipi === 'Üye') {
        window.location.href = '/uye/dashboard';
      } else if (cari) {
        window.location.href = '/cari/dashboard';
      } else {
        // Rolü yoksa ve cari kartı da bulunamadıysa varsayılan panel
        window.location.href = '/uye/dashboard';
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg('Sistem yönlendirmesi sırasında bir hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl space-y-6">
        
        {/* Logo & Başlık */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto text-white shadow-lg shadow-indigo-500/20">
            <Shield size={24} />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Merkezi Giriş Kapısı</h2>
          <p className="text-zinc-500 text-xs font-medium">Kooperatif Ortak, Cari ve Personel Portalı</p>
        </div>

        {/* Form Alanı */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">E-Posta Adresi</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-zinc-500" size={18} />
              <input 
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl p-3 pl-11 text-sm font-medium outline-none transition-all placeholder:text-zinc-600" 
                type="email" 
                placeholder="ornek@kooperatif.com" 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={loading}
                required 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-zinc-500" size={18} />
              <input 
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl p-3 pl-11 text-sm font-medium outline-none transition-all placeholder:text-zinc-600" 
                type="password" 
                placeholder="••••••••" 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={loading}
                required 
              />
            </div>
          </div>

          <button 
            disabled={loading} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/10 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Kimlik Doğrulanıyor...</span>
              </>
            ) : 'Sisteme Güvenli Giriş'}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-zinc-500">
            Hesabınız aktivite edilmediyse lütfen <a href="/register" className="text-indigo-400 font-bold hover:underline">Kooperatif Yönetimi</a> ile görüşün.
          </p>
        </div>
      </div>
    </div>
  );
}