import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import InventoryForm from '@/components/inventory/InventoryForm'

export default async function NewInventoryPage() {
  const supabase = await createServerSupabaseClient()
  const { data: categories } = await supabase.from('inventory_categories').select('*').order('sort_order')

  return (
    <div>
      <PageHeader title="Add Inventory Item" subtitle="Add a new rental item to your catalog" />
      <div className="p-6">
        <InventoryForm categories={categories ?? []} mode="create" />
      </div>
    </div>
  )
}
