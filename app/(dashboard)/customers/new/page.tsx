import PageHeader from '@/components/layout/PageHeader'
import CustomerForm from '@/components/customers/CustomerForm'

export default function NewCustomerPage() {
  return (
    <div>
      <PageHeader title="New Customer" subtitle="Add a customer to your database" />
      <div className="p-6">
        <CustomerForm mode="create" />
      </div>
    </div>
  )
}
