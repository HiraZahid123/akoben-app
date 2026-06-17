import { createServerSupabaseClient } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import CreateOrderForm from '@/components/orders/CreateOrderForm'

export default async function NewOrderPage() {
  const supabase = await createServerSupabaseClient()

  const [{ data: customers }, { data: items }] = await Promise.all([
    supabase.from('customers').select('id, full_name, company_name, phone, discount_pct').order('full_name'),
    supabase.from('inventory_availability').select('id, name, sku, rate_daily, quantity_available, category_name').order('name'),
  ])

  return (
    <div>
      <PageHeader title="New Order" subtitle="Create a rental order" />
      <div className="p-6">
        <CreateOrderForm customers={customers ?? []} inventoryItems={items ?? []} />
      </div>
    </div>
  )
}
