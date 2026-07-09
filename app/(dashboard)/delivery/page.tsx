import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import { formatDateTime } from '@/lib/utils'
import LogWhatsAppButton from './LogWhatsAppButton'

export default async function DeliveryPage() {
  const supabase = await createServerSupabaseClient()

  // Fetch booked orders that haven't been returned/cancelled yet — candidates for Pull Order
  const { data: bookedOrders } = await supabase
    .from('orders_with_customer')
    .select('id, order_number, customer_name, event_name, pickup_date, status')
    .eq('is_booked', true)
    .not('status', 'in', '(cancelled,returned)')
    .order('pickup_date')

  // Fetch all pull order checkout logs
  const { data: checkouts } = await supabase
    .from('barcode_scan_log')
    .select('id, scanned_at, result')
    .eq('action', 'checkout')
    .like('result', 'pull_order:%')

  const { data: checkins } = await supabase
    .from('barcode_scan_log')
    .select('id, scanned_at, result')
    .eq('action', 'checkin')

  // Group checkouts by order number
  const outByOrder: Record<string, { count: number; lastScanned: string }> = {}
  for (const entry of checkouts ?? []) {
    const orderNum = (entry.result ?? '').replace('pull_order:', '')
    if (!outByOrder[orderNum]) outByOrder[orderNum] = { count: 0, lastScanned: entry.scanned_at }
    outByOrder[orderNum].count += 1
    if (entry.scanned_at > outByOrder[orderNum].lastScanned) outByOrder[orderNum].lastScanned = entry.scanned_at
  }

  // Group check-ins by order number (result format: "return_order:ORD-XXXX:condition")
  const inByOrder: Record<string, { count: number; lastScanned: string }> = {}
  for (const entry of checkins ?? []) {
    const match = /^return_order:([^:]+):/.exec(entry.result ?? '')
    if (!match) continue
    const orderNum = match[1]
    if (!inByOrder[orderNum]) inByOrder[orderNum] = { count: 0, lastScanned: entry.scanned_at }
    inByOrder[orderNum].count += 1
    if (entry.scanned_at > inByOrder[orderNum].lastScanned) inByOrder[orderNum].lastScanned = entry.scanned_at
  }

  const pulledOrderNumbers = Object.keys(outByOrder).sort().reverse()
  const returnedOrderNumbers = Object.keys(inByOrder).sort().reverse()

  // Fetch customer phone/name for all orders referenced in either log, for WhatsApp sends
  const allOrderNumbers = [...new Set([...pulledOrderNumbers, ...returnedOrderNumbers])]
  const { data: orderContacts } = allOrderNumbers.length > 0
    ? await supabase.from('orders_with_customer').select('order_number, customer_name, customer_phone, event_name').in('order_number', allOrderNumbers)
    : { data: [] }
  const contactByOrder: Record<string, any> = {}
  for (const o of orderContacts ?? []) contactByOrder[o.order_number] = o

  // Orders that are booked but not yet pulled (no checkout log for them yet)
  const readyForPull = (bookedOrders ?? []).filter(o => !outByOrder[o.order_number])

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Delivery" subtitle="Pull order logs & check-in records" />
      <div className="flex-1 overflow-auto p-6 space-y-8">

        {/* Ready for Pull */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-4">Ready for Pull</h2>
          {readyForPull.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              No booked orders awaiting pickup right now.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-5 py-3 font-medium text-gray-600">Order</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Customer</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Event</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Pickup Date</th>
                    <th className="px-5 py-3 font-medium text-gray-600 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {readyForPull.map((o: any) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3 font-medium text-gray-900">{o.order_number}</td>
                      <td className="px-5 py-3 text-gray-700">{o.customer_name}</td>
                      <td className="px-5 py-3 text-gray-600">{o.event_name}</td>
                      <td className="px-5 py-3 text-gray-600">{formatDateTime(o.pickup_date)}</td>
                      <td className="px-5 py-3 text-right">
                        <a href={`/delivery/pull/${o.id}`}
                          className="text-xs px-3 py-1.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                          📦 Open Pull Order
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pull Order Log — collapsible so it doesn't crowd the page with many orders */}
        <details className="bg-white rounded-xl border border-gray-200 overflow-hidden group" open={pulledOrderNumbers.length <= 5}>
          <summary className="cursor-pointer px-5 py-4 bg-gray-50 flex items-center justify-between select-none list-none">
            <span className="font-semibold text-gray-800 flex items-center gap-2">
              📦 Pull Order Log
              <span className="text-xs font-normal text-gray-400">({pulledOrderNumbers.length} order{pulledOrderNumbers.length === 1 ? '' : 's'})</span>
            </span>
            <span className="text-gray-400 text-sm group-open:rotate-180 transition-transform">▾</span>
          </summary>
          {pulledOrderNumbers.length === 0 ? (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">No pull orders logged yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-gray-100 text-left">
                  <th className="px-5 py-2 font-medium text-gray-500 text-xs">Order</th>
                  <th className="px-5 py-2 font-medium text-gray-500 text-xs">Customer</th>
                  <th className="px-5 py-2 font-medium text-gray-500 text-xs">Items Out</th>
                  <th className="px-5 py-2 font-medium text-gray-500 text-xs">Returned</th>
                  <th className="px-5 py-2 font-medium text-gray-500 text-xs">Last Scan</th>
                  <th className="px-5 py-2 font-medium text-gray-500 text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pulledOrderNumbers.map(orderNum => {
                  const contact = contactByOrder[orderNum]
                  const message = `Pull Order — ${orderNum}\n${contact?.event_name ?? ''}\n\nPlease see the attached pull order log link on the portal for the full item list.\nTotal items out: ${outByOrder[orderNum].count}`
                  return (
                    <tr key={orderNum}>
                      <td className="px-5 py-3 font-medium text-gray-900">{orderNum}</td>
                      <td className="px-5 py-3 text-gray-600">{contact?.customer_name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-700">{outByOrder[orderNum].count}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          (inByOrder[orderNum]?.count ?? 0) >= outByOrder[orderNum].count ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {inByOrder[orderNum]?.count ?? 0} returned
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{formatDateTime(outByOrder[orderNum].lastScanned)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a href={`/delivery/log/pull/${encodeURIComponent(orderNum)}`}
                            className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 font-medium rounded hover:bg-blue-200 transition-colors">
                            🖨 View / Print
                          </a>
                          <LogWhatsAppButton phone={contact?.customer_phone ?? null} message={message} label="Send" />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </details>

        {/* Return Order Log — collapsible */}
        <details className="bg-white rounded-xl border border-gray-200 overflow-hidden group" open={returnedOrderNumbers.length <= 5}>
          <summary className="cursor-pointer px-5 py-4 bg-gray-50 flex items-center justify-between select-none list-none">
            <span className="font-semibold text-gray-800 flex items-center gap-2">
              📥 Return Order Log
              <span className="text-xs font-normal text-gray-400">({returnedOrderNumbers.length} order{returnedOrderNumbers.length === 1 ? '' : 's'})</span>
            </span>
            <span className="text-gray-400 text-sm group-open:rotate-180 transition-transform">▾</span>
          </summary>
          {returnedOrderNumbers.length === 0 ? (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">No returns logged yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-gray-100 text-left">
                  <th className="px-5 py-2 font-medium text-gray-500 text-xs">Order</th>
                  <th className="px-5 py-2 font-medium text-gray-500 text-xs">Customer</th>
                  <th className="px-5 py-2 font-medium text-gray-500 text-xs">Items Returned</th>
                  <th className="px-5 py-2 font-medium text-gray-500 text-xs">Last Scan</th>
                  <th className="px-5 py-2 font-medium text-gray-500 text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {returnedOrderNumbers.map(orderNum => {
                  const contact = contactByOrder[orderNum]
                  const message = `Return Order — ${orderNum}\n${contact?.event_name ?? ''}\n\nTotal items returned: ${inByOrder[orderNum].count}`
                  return (
                    <tr key={orderNum}>
                      <td className="px-5 py-3 font-medium text-gray-900">{orderNum}</td>
                      <td className="px-5 py-3 text-gray-600">{contact?.customer_name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-700">{inByOrder[orderNum].count}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{formatDateTime(inByOrder[orderNum].lastScanned)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a href={`/delivery/log/return/${encodeURIComponent(orderNum)}`}
                            className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 font-medium rounded hover:bg-blue-200 transition-colors">
                            🖨 View / Print
                          </a>
                          <LogWhatsAppButton phone={contact?.customer_phone ?? null} message={message} label="Send" />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </details>
      </div>
    </div>
  )
}
