import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import InventoryForm from '@/components/inventory/InventoryForm'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth-role'
import { getModuleAccess } from '@/lib/permissions'

export default async function EditInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const role = await getCurrentUserRole()
  if (getModuleAccess(role, 'inventory') !== 'full') redirect(`/inventory/${id}`)

  const supabase = await createServerSupabaseClient()

  const [r1, r2] = await Promise.all([
    supabase.from('inventory_items').select('*').eq('id', id).single(),
    supabase.from('inventory_categories').select('*').order('sort_order'),
  ])

  if (!r1.data) notFound()
  const item = r1.data as any
  const categories = (r2.data ?? []) as any[]

  return (
    <div>
      <PageHeader title={`Edit: ${item.name}`} subtitle={item.sku ?? undefined} />
      <div className="p-6">
        <InventoryForm categories={categories ?? []} item={item} mode="edit" />
      </div>
    </div>
  )
}
