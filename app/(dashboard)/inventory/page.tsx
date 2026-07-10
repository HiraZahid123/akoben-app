import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import InventoryTable from './InventoryTable'
import { getCurrentUserRole } from '@/lib/auth-role'
import { getModuleAccess } from '@/lib/permissions'

export default async function InventoryPage() {
  const supabase = await createServerSupabaseClient()
  const role = await getCurrentUserRole()
  const canEdit = getModuleAccess(role, 'inventory') === 'full'

  const [{ data: items }, { data: categories }, { data: units }] = await Promise.all([
    supabase
      .from('inventory_availability')
      .select('*')
      .order('name'),
    supabase
      .from('inventory_categories')
      .select('*')
      .order('sort_order'),
    supabase
      .from('inventory_units')
      .select('item_id, status'),
  ])

  // Inventory tab must always reflect PHYSICAL stock on the shelf today — not future date-range
  // reservations. quantity_available gets decremented by a DB trigger for any order regardless
  // of date, so we override it here with quantity_total minus units currently checked out.
  const outCountByItem: Record<string, number> = {}
  const itemsWithUnits = new Set<string>()
  for (const u of units ?? []) {
    itemsWithUnits.add(u.item_id)
    if (u.status === 'out') outCountByItem[u.item_id] = (outCountByItem[u.item_id] ?? 0) + 1
  }
  const physicalItems = (items ?? []).map(item => ({
    ...item,
    quantity_available: itemsWithUnits.has(item.id)
      ? item.quantity_total - (outCountByItem[item.id] ?? 0)
      : item.quantity_total, // no unit tracking yet — assume nothing physically out
  }))

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Inventory"
        subtitle={`${physicalItems.length} items`}
        action={
          canEdit ? (
            <a
              href="/inventory/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + Add Item
            </a>
          ) : undefined
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <InventoryTable items={physicalItems} categories={categories ?? []} canEdit={canEdit} />
      </div>
    </div>
  )
}
