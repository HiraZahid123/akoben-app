import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import LogCommunicationForm from './LogCommunicationForm'

export default async function NewCommunicationPage({ searchParams }: { searchParams: Promise<{ customer_id?: string }> }) {
  const { customer_id } = await searchParams
  const supabase = await createServerSupabaseClient()

  const [{ data: customers }, { data: orders }] = await Promise.all([
    supabase.from('customers').select('id, full_name, company_name, email, phone').order('full_name'),
    supabase.from('orders').select('id, order_number, event_name, customer_id').order('created_at', { ascending: false }).limit(100),
  ])

  return (
    <div>
      <PageHeader title="Log Communication" subtitle="Record a customer interaction" />
      <div className="p-6 max-w-2xl">
        <LogCommunicationForm
          customers={customers ?? []}
          orders={orders ?? []}
          defaultCustomerId={customer_id}
        />
      </div>
    </div>
  )
}
