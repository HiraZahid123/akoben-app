import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import CustomersTable from './CustomersTable'
import { getCurrentUserRole } from '@/lib/auth-role'
import { getModuleAccess } from '@/lib/permissions'

export default async function CustomersPage() {
  const supabase = await createServerSupabaseClient()
  const role = await getCurrentUserRole()
  const canEdit = getModuleAccess(role, 'customers') === 'full'
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Customers"
        subtitle={`${customers?.length ?? 0} customers`}
        action={
          canEdit ? (
            <a
              href="/customers/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + New Customer
            </a>
          ) : undefined
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <CustomersTable customers={customers ?? []} canEdit={canEdit} />
      </div>
    </div>
  )
}
