import { createServerSupabaseClient } from '@/lib/supabase/server';
import StockTable from '@/components/StockTable';

export default async function StokPage() {
  const supabase = await createServerSupabaseClient();
  const { data: urunler } = await supabase
    .from('stok_kartlari')
    .select('*')
    .order('urun_adi');

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-800">📦 Stok ve Ürün Yönetimi</h1>
      <StockTable initialData={urunler || []} />
    </div>
  );
}