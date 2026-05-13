import { createServerSupabaseClient } from '@/lib/supabase/server';
import UserRoleSelect from '@/components/UserRoleSelect';

export default async function AdminUsersPage() {
  // Başına await ekledik:
  const supabase = await createServerSupabaseClient();
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error(error);
    return <div className="p-10 text-red-500">Hata: {error.message}</div>;
  }

  return (

  
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-8 border-b pb-4">
          👨‍✈️ Kullanıcı Yetki Yönetimi
        </h1>
        
        <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Ad Soyad</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase">E-Posta (ID)</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Mevcut Rol</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles?.map((profile) => (
                <tr key={profile.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{profile.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{profile.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                      profile.role === 'muhasebe' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <UserRoleSelect userId={profile.id} currentRole={profile.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}