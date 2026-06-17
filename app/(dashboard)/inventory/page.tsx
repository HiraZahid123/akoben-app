import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import InventoryTable from './InventoryTable'

export default async function InventoryPage() {
  const supabase = await createServerSupabaseClient()

  const [{ data: items }, { data: categories }] = await Promise.all([
    supabase
      .from('inventory_availability')
      .select('*')
      .order('name'),
    supabase
      .from('inventory_categories')
      .select('*')
      .order('sort_order'),
  ])

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Inventory"
        subtitle={`${items?.length ?? 0} items`}
        action={
          <a
            href="/inventory/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Add Item
          </a>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <InventoryTable items={items ?? []} categories={categories ?? []} />
      </div>
    </div>
  )
}
