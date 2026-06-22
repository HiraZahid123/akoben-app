import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import InvoicesTable from './InvoicesTable'
import { getCurrentUserRole } from '@/lib/auth-role'
import { redirect } from 'next/navigation'

export default async function InvoicesPage() {
  if (await getCurrentUserRole() !== 'admin') redirect('/dashboard')
  const supabase = await createServerSupabaseClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, customers(full_name, company_name), orders(order_number, event_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Invoices"
        subtitle={`${invoices?.length ?? 0} invoices`}
      />
      <div className="flex-1 overflow-auto p-6">
        <InvoicesTable invoices={invoices ?? []} />
      </div>
    </div>
  )
}
