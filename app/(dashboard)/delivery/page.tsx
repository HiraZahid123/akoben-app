import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import { formatDateTime } from '@/lib/utils'

export default async function DeliveryPage() {
  const supabase = await createServerSupabaseClient()

  // Fetch all pull order checkout logs
  const { data: checkouts } = await supabase
    .from('barcode_scan_log')
    .select('id, scanned_at, barcode, result, inventory_units(unit_number, inventory_items(name, sku))')
    .eq('action', 'checkout')
    .like('result', 'pull_order:%')
    .order('scanned_at', { ascending: false })

  // Fetch orders that have been pulled (for Return Order links)
  const pulledOrderNumbers = [...new Set((checkouts ?? []).map((c: any) => (c.result ?? '').replace('pull_order:', '')))]
  const { data: pulledOrders } = pulledOrderNumbers.length > 0
    ? await supabase.from('orders').select('id, order_number, status').in('order_number', pulledOrderNumbers)
    : { data: [] }

  const { data: checkins } = await supabase
    .from('barcode_scan_log')
    .select('id, scanned_at, barcode, result, inventory_units(unit_number, inventory_items(name, sku))')
    .eq('action', 'checkin')
    .order('scanned_at', { ascending: false })

  // Group checkouts by order number
  const outByOrder: Record<string, any[]> = {}
  for (const entry of checkouts ?? []) {
    const orderNum = (entry.result ?? '').replace('pull_order:', '')
    if (!outByOrder[orderNum]) outByOrder[orderNum] = []
    outByOrder[orderNum].push(entry)
  }

  const orderNumbers = Object.keys(outByOrder).sort().reverse()
  const orderIdByNumber: Record<string, string> = {}
  for (const o of pulledOrders ?? []) orderIdByNumber[o.order_number] = o.id

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Delivery" subtitle="Pull order logs & check-in records" />
      <div className="flex-1 overflow-auto p-6 space-y-8">

        {/* Check-Out Logs */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-4">Check-Out Logs (Pull Orders)</h2>
          {orderNumbers.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
              No pull orders logged yet. Use the Pull Order button on a confirmed invoice.
            </div>
          ) : (
            <div className="space-y-4">
              {orderNumbers.map(orderNum => (
                <div key={orderNum} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{orderNum}-out</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{outByOrder[orderNum].length} items checked out</span>
                      {orderIdByNumber[orderNum] && (
                        <a href={`/delivery/return/${orderIdByNumber[orderNum]}`}
                          className="text-xs px-2 py-1 bg-orange-100 text-orange-700 font-medium rounded hover:bg-orange-200 transition-colors">
                          📥 Return Order
                        </a>
                      )}
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="px-5 py-2 font-medium text-gray-500 text-xs">Date/Time</th>
                        <th className="px-5 py-2 font-medium text-gray-500 text-xs">Item</th>
                        <th className="px-5 py-2 font-medium text-gray-500 text-xs">SKU</th>
                        <th className="px-5 py-2 font-medium text-gray-500 text-xs">Unit #</th>
                        <th className="px-5 py-2 font-medium text-gray-500 text-xs">Barcode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {outByOrder[orderNum].map((entry: any) => (
                        <tr key={entry.id}>
                          <td className="px-5 py-2 text-gray-500">{formatDateTime(entry.scanned_at)}</td>
                          <td className="px-5 py-2 text-gray-900 font-medium">{entry.inventory_units?.inventory_items?.name ?? '—'}</td>
                          <td className="px-5 py-2 text-gray-500 text-xs">{entry.inventory_units?.inventory_items?.sku ?? '—'}</td>
                          <td className="px-5 py-2 text-gray-600">{entry.inventory_units?.unit_number ?? '—'}</td>
                          <td className="px-5 py-2 text-gray-400 font-mono text-xs">{entry.barcode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Check-In Logs */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-4">Check-In Logs (Returns)</h2>
          {(checkins ?? []).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              No check-ins recorded yet.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 font-semibold text-gray-800">
                All Check-Ins
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-5 py-2 font-medium text-gray-500 text-xs">Date/Time</th>
                    <th className="px-5 py-2 font-medium text-gray-500 text-xs">Item</th>
                    <th className="px-5 py-2 font-medium text-gray-500 text-xs">Unit #</th>
                    <th className="px-5 py-2 font-medium text-gray-500 text-xs">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {checkins?.map((entry: any) => (
                    <tr key={entry.id}>
                      <td className="px-5 py-2 text-gray-500">{formatDateTime(entry.scanned_at)}</td>
                      <td className="px-5 py-2 text-gray-900 font-medium">{entry.inventory_units?.inventory_items?.name ?? entry.barcode}</td>
                      <td className="px-5 py-2 text-gray-600">{entry.inventory_units?.unit_number ?? '—'}</td>
                      <td className="px-5 py-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          entry.result === 'success' ? 'bg-green-100 text-green-700' :
                          entry.result === 'damaged' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {entry.result ?? 'returned'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
