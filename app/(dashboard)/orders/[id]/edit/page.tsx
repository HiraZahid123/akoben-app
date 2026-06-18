import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import CreateOrderForm from '@/components/orders/CreateOrderForm'
import { notFound } from 'next/navigation'

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: order }, { data: customers }, { data: items }] = await Promise.all([
    supabase.from('orders').select('*, order_items(*, inventory_items(name))').eq('id', id).single(),
    supabase.from('customers').select('id, full_name, company_name, phone, discount_pct').order('full_name'),
    supabase.from('inventory_availability').select('id, name, sku, rate_daily, quantity_available, category_name').order('name'),
  ])

  if (!order) notFound()

  return (
    <div>
      <PageHeader title={`Edit Order ${(order as any).order_number}`} subtitle="Update order details" />
      <div className="p-6">
        <CreateOrderForm
          customers={customers ?? []}
          inventoryItems={items ?? []}
          initialData={order as any}
        />
      </div>
    </div>
  )
}
