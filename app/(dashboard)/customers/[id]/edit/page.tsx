import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import CustomerForm from '@/components/customers/CustomerForm'
import { notFound } from 'next/navigation'

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (!customer) notFound()

  return (
    <div>
      <PageHeader
        title="Edit Customer"
        subtitle={customer.full_name}
        action={<a href={`/customers`} className="text-sm text-gray-500 hover:text-gray-700">← Back to Customers</a>}
      />
      <div className="p-6">
        <CustomerForm mode="edit" customer={customer} />
      </div>
    </div>
  )
}
