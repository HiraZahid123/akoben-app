import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatDate, formatDateTime, formatGHS, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import { notFound } from 'next/navigation'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: customer }, { data: orders }, { data: comms }] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).single(),
    supabase.from('orders_with_customer').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
    supabase.from('crm_communication_log').select('*').eq('customer_id', id).order('created_at', { ascending: false }).limit(10),
  ])

  if (!customer) notFound()

  const CHANNEL_ICONS: Record<string, string> = {
    email: '✉️', sms: '💬', whatsapp: '📱',
    phone_call: '📞', in_person: '🤝', other: '📌',
  }

  const STATUS_VARIANTS: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger' | 'purple'> = {
    draft: 'default', confirmed: 'info', active: 'success',
    returned: 'purple', cancelled: 'danger', overdue: 'danger',
  }

  return (
    <div>
      <PageHeader
        title={customer.full_name}
        subtitle={customer.company_name ?? (customer.customer_type ?? 'Customer')}
        action={
          <div className="flex gap-2">
            <a href={`/crm/new?customer_id=${id}`}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              + Log Communication
            </a>
            <a href={`/customers/${id}/edit`}
              className="px-3 py-1.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Edit
            </a>
          </div>
        }
      />

      <div className="p-6 grid grid-cols-3 gap-6 max-w-6xl">
        <div className="col-span-2 space-y-5">

          {/* Orders */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-800">Orders</span>
              <a href={`/orders/new`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ New Order</a>
            </div>
            {orders && orders.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Order</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Event</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <a href={`/orders/${o.id}`} className="font-medium text-blue-600 hover:text-blue-700">{o.order_number}</a>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{o.event_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{o.event_date ? formatDate(o.event_date) : '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANTS[o.status] ?? 'default'} className="capitalize text-xs">{o.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatGHS(o.total_amount ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No orders yet.</p>
            )}
          </div>

          {/* Recent Communications */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-800">Recent Communications</span>
              <a href={`/crm/new?customer_id=${id}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Log</a>
            </div>
            {comms && comms.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {comms.map((c: any) => (
                  <div key={c.id} className="px-5 py-3 flex items-start gap-3">
                    <span className="text-lg mt-0.5">{CHANNEL_ICONS[c.channel] ?? '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.subject ?? c.channel}</p>
                      {c.body && <p className="text-xs text-gray-400 truncate mt-0.5">{c.body}</p>}
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">{formatDateTime(c.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No communications logged yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Contact Info</h3>
            <div className="text-sm space-y-2">
              {customer.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-gray-400">📞</span> {customer.phone}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-gray-400">✉️</span>
                  <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">{customer.email}</a>
                </div>
              )}
              {customer.whatsapp && (
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-gray-400">📱</span> {customer.whatsapp}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Address</h3>
            <div className="text-sm text-gray-600 space-y-1">
              {customer.address && <div>{customer.address}</div>}
              {customer.city && <div>{customer.city}{customer.region ? `, ${customer.region}` : ''}</div>}
              {customer.gps_address && (
                <div className="text-xs text-gray-400 mt-1">GPS: {customer.gps_address}</div>
              )}
              {!customer.address && !customer.city && <div className="text-gray-400">No address on file</div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Account Details</h3>
            <div className="text-sm space-y-2 text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-400">Type</span>
                <span className="capitalize">{customer.customer_type ?? '—'}</span>
              </div>
              {customer.ghana_tin && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Ghana TIN</span>
                  <span>{customer.ghana_tin}</span>
                </div>
              )}
              {customer.discount_pct > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Discount</span>
                  <span className="text-green-600">{customer.discount_pct}%</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Since</span>
                <span>{formatDate(customer.created_at)}</span>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
