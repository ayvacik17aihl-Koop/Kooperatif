'use client';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function UserRoleSelect({ userId, currentRole }: { userId: string, currentRole: string }) {
  const supabase = createClient();
  const router = useRouter();

  const handleRoleChange = async (newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      alert("Yetki güncellenemedi: " + error.message);
    } else {
      alert("Yetki başarıyla güncellendi!");
      router.refresh(); // Sayfayı yenileyerek değişikliği yansıt
    }
  };

  return (
    <select 
      defaultValue={currentRole} 
      onChange={(e) => handleRoleChange(e.target.value)}
      className="border border-gray-300 rounded-md p-1 bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
    >
      <option value="personel">Personel</option>
      <option value="muhasebe">Muhasebe</option>
      <option value="admin">Admin</option>
    </select>
  );
}