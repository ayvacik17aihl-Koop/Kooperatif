import { createServerSupabaseClient } from '@/lib/supabase/server';
import CariTable from '@/components/CariTable';

export default async function CariPage() {
  const supabase = await createServerSupabaseClient();
  const { data: cariler } = await supabase
    .from('cari_kartlari')
    .select('*')
    .order('tam_ad');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">👤 Cari Yönetimi</h1>
        <p className="text-gray-500 mt-1">Üye, müşteri ve tedarikçi hesaplarını buradan yönetebilirsiniz.</p>
      </div>
      
      <CariTable initialData={cariler || []} />
    </div>
  );
}