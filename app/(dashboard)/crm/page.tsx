import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import CRMTable from './CRMTable'

export default async function CRMPage() {
  const supabase = await createServerSupabaseClient()

  const { data: logs } = await supabase
    .from('crm_communication_log')
    .select('*, customers(id, full_name, company_name, phone, email)')
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: customers } = await supabase
    .from('customers')
    .select('id, full_name, company_name')
    .order('full_name')

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="CRM"
        subtitle="Communication history with customers"
        action={
          <a href="/crm/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            + Log Communication
          </a>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <CRMTable logs={logs ?? []} customers={customers ?? []} />
      </div>
    </div>
  )
}
