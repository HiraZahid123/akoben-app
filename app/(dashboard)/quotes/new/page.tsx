import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import CreateQuoteForm from '@/components/quotes/CreateQuoteForm'

export default async function NewQuotePage() {
  const supabase = await createServerSupabaseClient()

  const [{ data: customers }, { data: items }] = await Promise.all([
    supabase.from('customers').select('id, full_name, company_name, email, phone, discount_pct').order('full_name'),
    supabase.from('inventory_availability').select('id, name, sku, rate_daily, quantity_available, category_name').order('name'),
  ])

  return (
    <div>
      <PageHeader title="New Quote" subtitle="Create a rental quote to send to a customer" />
      <div className="p-6">
        <CreateQuoteForm customers={customers ?? []} inventoryItems={items ?? []} />
      </div>
    </div>
  )
}
