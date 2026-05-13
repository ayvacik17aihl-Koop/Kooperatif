import { createServerSupabaseClient } from '@/lib/supabase/server';
import AlisFaturasiTable from '@/components/AlisFaturasiTable';

export default async function AlisFaturasiPage() {
  const supabase = await createServerSupabaseClient();
  
  const { data: faturalar } = await supabase
    .from('faturalar')
    .select(`
      *,
      cari:cari_kartlari(tam_ad)
    `)
    .eq('tür', 'Alış')
    .order('tarih', { ascending: false });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">🛒 Alış Faturaları</h1>
          <p className="text-gray-500 mt-1">Ürün girişlerini ve tedarikçi borçlarını buradan yönetin.</p>
        </div>
      </div>
      
      <AlisFaturasiTable initialData={faturalar || []} />
    </div>
  );
}