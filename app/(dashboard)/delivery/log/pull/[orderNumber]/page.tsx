import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import { formatDateTime } from '@/lib/utils'
import { notFound } from 'next/navigation'
import PrintButton from '@/app/(dashboard)/reports/PrintButton'
import LogWhatsAppButton from '../../../LogWhatsAppButton'

export default async function PullOrderLogPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params
  const decodedOrderNumber = decodeURIComponent(orderNumber)
  const supabase = await createServerSupabaseClient()

  const [{ data: entries }, { data: order }] = await Promise.all([
    supabase
      .from('barcode_scan_log')
      .select('id, scanned_at, barcode, inventory_units(unit_number, inventory_items(name, sku))')
      .eq('action', 'checkout')
      .eq('result', `pull_order:${decodedOrderNumber}`)
      .order('scanned_at'),
    supabase
      .from('orders_with_customer')
      .select('id, order_number, customer_name, customer_phone, event_name, pickup_date')
      .eq('order_number', decodedOrderNumber)
      .maybeSingle(),
  ])

  if (!entries || entries.length === 0) notFound()

  const message = `Pull Order Log — ${decodedOrderNumber}\n${order?.event_name ?? ''}\n\n` +
    entries.map(e => `• ${(e.inventory_units as any)?.inventory_items?.name ?? '—'} (${(e.inventory_units as any)?.unit_number ?? e.barcode})`).join('\n') +
    `\n\nTotal items: ${entries.length}\nPlease confirm this matches what's loaded.`

  return (
    <div>
      <PageHeader
        title={`Pull Order Log — ${decodedOrderNumber}`}
        subtitle={order ? `${order.customer_name} — ${order.event_name}` : ''}
        action={
          <a href="/delivery" className="print:hidden px-3 py-1.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
            ← Back to Delivery
          </a>
        }
      />
      <div className="p-6 max-w-4xl">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between print:border-b-2 print:border-gray-900">
            <div>
              <span className="font-semibold text-gray-800">Checked Out Items</span>
              <span className="text-sm text-gray-400 ml-3">{entries.length} item(s)</span>
            </div>
            <div className="print:hidden flex items-center gap-2">
              <LogWhatsAppButton phone={order?.customer_phone ?? null} message={message} label="Send to Driver/Crew" />
              <PrintButton />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left print:bg-white">
                <th className="px-5 py-3 font-medium text-gray-600">Date/Time</th>
                <th className="px-5 py-3 font-medium text-gray-600">Item</th>
                <th className="px-5 py-3 font-medium text-gray-600">SKU</th>
                <th className="px-5 py-3 font-medium text-gray-600">Unit #</th>
                <th className="px-5 py-3 font-medium text-gray-600">Barcode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry: any) => (
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
      </div>
    </div>
  )
}
