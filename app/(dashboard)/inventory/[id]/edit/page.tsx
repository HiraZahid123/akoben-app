import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import InventoryForm from '@/components/inventory/InventoryForm'
import { notFound } from 'next/navigation'

export default async function EditInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: item }, { data: categories }] = await Promise.all([
    supabase.from('inventory_items').select('*').eq('id', id).single(),
    supabase.from('inventory_categories').select('*').order('sort_order'),
  ])

  if (!item) notFound()

  return (
    <div>
      <PageHeader title={`Edit: ${item.name}`} subtitle={item.sku ?? undefined} />
      <div className="p-6">
        <InventoryForm categories={categories ?? []} item={item} mode="edit" />
      </div>
    </div>
  )
}
