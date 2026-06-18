import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import CreateQuoteForm from '@/components/quotes/CreateQuoteForm'
import { notFound } from 'next/navigation'

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: quote }, { data: customers }, { data: items }] = await Promise.all([
    supabase.from('quotes').select('*, quote_items(*, inventory_items(name))').eq('id', id).single(),
    supabase.from('customers').select('id, full_name, company_name, email, phone, discount_pct').order('full_name'),
    supabase.from('inventory_availability').select('id, name, sku, rate_daily, quantity_available, category_name').order('name'),
  ])

  if (!quote) notFound()

  return (
    <div>
      <PageHeader title={`Edit Quote ${(quote as any).quote_number}`} subtitle="Update quote details" />
      <div className="p-6">
        <CreateQuoteForm
          customers={customers ?? []}
          inventoryItems={items ?? []}
          initialData={quote as any}
        />
      </div>
    </div>
  )
}
