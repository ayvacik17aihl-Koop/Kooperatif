'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface Izin {
  izin_id: string;
  modul_adi: string;
  islem_tipi: string;
}

interface RolKart {
  rol_id: string;
  rol_adi: string;
  aciklama: string;
  is_superadmin: boolean;
  izinler: Izin[];
}

export default function YetkilerPage() {
  const [roller, setRoller] = useState<RolKart[]>([]);
  const [dinamikModuller, setDinamikModuller] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [yeniModulAdi, setYeniModulAdi] = useState(''); // Yeni modül ekleme state'i
  const supabase = createClient();

  // 1. Tüm Dinamik Verileri (Roller, İzinler ve Modüller) Veritabanından Çek
  const verileriGetir = async () => {
    setLoading(true);
    
    // Roller ve izin matrisini çek
    const { data: rollerData } = await supabase.from('view_roller_ve_izinler').select('*');
    // Aktif modülleri tamamen dinamik olarak veritabanından çek
    const { data: modullerData } = await supabase.from('view_aktif_moduller').select('*');

    if (rollerData) setRoller(rollerData as RolKart[]);
    if (modullerData) setDinamikModuller(modullerData.map(m => m.modul_adi));
    
    setLoading(false);
  };

  useEffect(() => {
    verileriGetir();
  }, []);

  // 2. Süper Admin Switch Kontrolü
  const superAdminDegistir = async (rolId: string, mevcutDurum: boolean) => {
    const { error } = await supabase
      .from('roller')
      .update({ is_superadmin: !mevcutDurum })
      .eq('id', rolId);

    if (!error) verileriGetir();
  };

  // 3. Dinamik Modül İznini Güncelle Veya Ekle
  const izinGuncelle = async (rolId: string, modulAdi: string, yeniTip: string) => {
    const { data: mevcutIzin } = await supabase
      .from('izinler')
      .select('id')
      .eq('rol_id', rolId)
      .eq('modul_adi', modulAdi)
      .single();

    if (yeniTip === 'NONE') {
      if (mevcutIzin) {
        await supabase.from('izinler').delete().eq('id', mevcutIzin.id);
      }
    } else {
      if (mevcutIzin) {
        await supabase.from('izinler').update({ islem_tipi: yeniTip }).eq('id', mevcutIzin.id);
      } else {
        await supabase.from('izinler').insert({ rol_id: rolId, modul_adi: modulAdi, islem_tipi: yeniTip });
      }
    }
    verileriGetir();
  };

  // 4. Sisteme Tamamen Yeni Bir Modül Tanımlama (Dinamikliğin Gücü)
  const yeniModulEkle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yeniModulAdi.trim()) return;

    const temizModulAdi = yeniModulAdi.trim().toLowerCase();

    // Yeni modülü sisteme tanıtmak için sistemdeki ilk role (Örn: Başkan) varsayılan bir 'ALL' izni veriyoruz
    if (roller.length > 0) {
      const { error } = await supabase
        .from('izinler')
        .insert({ rol_id: roller[0].rol_id, modul_adi: temizModulAdi, islem_tipi: 'ALL' });
      
      if (!error) {
        setYeniModulAdi('');
        verileriGetir();
      }
    }
  };

  if (loading) return <div className="p-8 text-center font-semibold text-gray-600">Dinamik yetki matrisi yükleniyor...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Üst Navigasyon Bilgisi */}
      <div className="text-sm text-gray-400 mb-2">Ayarlar &gt; <span className="text-gray-600 font-medium">Yetki Tanımlamaları</span></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gelişmiş Rol & Yetki Matrisi</h1>
          <p className="text-gray-500 text-sm">Sistemdeki modüller tamamen veritabanından beslenir. Yeni bir modül ismi yazarak matrisi genişletebilirsiniz.</p>
        </div>

        {/* Yeni Modül Ekleme Formu (Tamamen Dinamik Yapı İçin) */}
        <form onSubmit={yeniModulEkle} className="flex gap-2 bg-white p-2 rounded-lg border shadow-sm">
          <input 
            type="text" 
            placeholder="Örn: raporlar, demirbas" 
            value={yeniModulAdi}
            onChange={(e) => setYeniModulAdi(e.target.value)}
            className="text-xs p-2 border rounded text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button className="bg-blue-600 text-white text-xs px-3 py-2 rounded font-bold hover:bg-blue-700">
            + Yeni Modül Tanımla
          </button>
        </form>
      </div>

      {/* Rol Kartları Listesi */}
      <div className="grid grid-cols-1 gap-6">
        {roller.map((rol) => (
          <div key={rol.rol_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            
            {/* Kart Üst Alanı */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 mb-4 gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  {rol.rol_adi}
                  {rol.is_superadmin && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-md font-semibold">Yönetici</span>}
                </h2>
                <p className="text-sm text-gray-500">{rol.aciklama || 'Açıklama belirtilmemiş.'}</p>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <span className="text-sm font-medium text-gray-700">Süper Admin (Tam Yetki):</span>
                <button
                  onClick={() => superAdminDegistir(rol.rol_id, rol.is_superadmin)}
                  className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                    rol.is_superadmin 
                      ? 'bg-red-600 text-white shadow-sm' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {rol.is_superadmin ? 'AÇIK' : 'KAPALI'}
                </button>
              </div>
            </div>

            {/* İzin Alanları (Tamamen Dinamik Döngü) */}
            {rol.is_superadmin ? (
              <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-200 font-medium">
                🛡️ Bu rol Süper Admin bayrağına sahip olduğu için alt izin kısıtlamalarına tabi değildir. Eklenen tüm yeni dinamik modüllere de otomatik olarak tam yetkilidir.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {dinamikModuller.map((modul) => {
                  const aktifIzin = rol.izinler.find((i) => i.modul_adi === modul);
                  const mevcutYetki = aktifIzin ? aktifIzin.islem_tipi : 'NONE';

                  return (
                    <div key={modul} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-col justify-between gap-2">
                      <span className="text-sm font-bold text-gray-700 capitalize">
                        {modul === 'uyeler' ? 'Üye İşlemleri' : modul}
                      </span>
                      <select
                        value={mevcutYetki}
                        onChange={(e) => izinGuncelle(rol.rol_id, modul, e.target.value)}
                        className="w-full text-xs p-2 rounded border bg-white text-gray-800 font-medium focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="NONE">Erişim Yok (Gizle)</option>
                        <option value="READ">Sadece Oku (READ)</option>
                        <option value="ALL">Tam Yetki (ALL)</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}