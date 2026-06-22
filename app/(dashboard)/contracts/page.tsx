import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { getCurrentUserRole } from '@/lib/auth-role'
import { redirect } from 'next/navigation'

export default async function ContractsPage() {
  if (await getCurrentUserRole() !== 'admin') redirect('/dashboard')
  const supabase = await createServerSupabaseClient()

  const { data: orders } = await supabase
    .from('orders_with_customer')
    .select('id, order_number, customer_name, event_name, event_date, status, created_at')
    .not('status', 'in', '(draft,cancelled)')
    .order('created_at', { ascending: false })
    .limit(50)

  const STATUS_VARIANTS: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger' | 'purple'> = {
    quote: 'info', confirmed: 'success', active: 'success',
    returned: 'purple', overdue: 'warning',
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Contracts" subtitle="Rental agreements — download PDF for any order" />

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-5xl">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-800">All Orders</span>
            <span className="text-xs text-gray-400">Click "Download Contract" to generate a PDF rental agreement</span>
          </div>

          {!orders || orders.length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-400 text-sm">
              No confirmed orders yet. Create an order first.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-5 py-3 font-medium text-gray-600">Order</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Customer</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Event</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Event Date</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Contract</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <a href={`/orders/${order.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                        {order.order_number}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{order.customer_name}</td>
                    <td className="px-5 py-3 text-gray-600">{order.event_name}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(order.event_date) || '—'}</td>
                    <td className="px-5 py-3">
                      <Badge variant={STATUS_VARIANTS[order.status] ?? 'default'} className="capitalize text-xs">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <a
                        href={`/api/pdf/contract/${order.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-900 transition-colors"
                      >
                        📄 Download PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-400 max-w-5xl">
          The rental agreement PDF includes: client details, event info, itemised rental list, payment terms, and signature lines.
          Rental terms can be customised in <a href="/settings" className="text-blue-500 hover:underline">Settings → Invoice & Contracts</a>.
        </div>
      </div>
    </div>
  )
}
