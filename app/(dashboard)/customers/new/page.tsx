import PageHeader from '@/components/layout/PageHeader'
import CustomerForm from '@/components/customers/CustomerForm'
import { getCurrentUserRole } from '@/lib/auth-role'
import { getModuleAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'

export default async function NewCustomerPage() {
  const role = await getCurrentUserRole()
  if (getModuleAccess(role, 'customers') !== 'full') redirect('/customers')

  return (
    <div>
      <PageHeader title="New Customer" subtitle="Add a customer to your database" />
      <div className="p-6">
        <CustomerForm mode="create" />
      </div>
    </div>
  )
}
