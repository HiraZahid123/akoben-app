import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import OrdersTable from './OrdersTable'

export default async function OrdersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: orders } = await supabase
    .from('orders_with_customer')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Orders"
        subtitle={`${orders?.length ?? 0} orders`}
        action={
          <a href="/orders/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + New Order
          </a>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <OrdersTable orders={orders ?? []} />
      </div>
    </div>
  )
}
