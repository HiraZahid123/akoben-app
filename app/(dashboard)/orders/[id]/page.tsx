import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatGHS, formatDateTime } from '@/lib/utils'
import { notFound } from 'next/navigation'
import type { OrderStatus } from '@/types/database'
import OrderActions from './OrderActions'
import RemoveItemLink from './RemoveItemLink'
import { computeDateRangeAvailability } from '@/lib/availability'

const STATUS_VARIANTS: Record<OrderStatus, 'default' | 'info' | 'success' | 'warning' | 'danger' | 'purple'> = {
  draft: 'default', quote: 'info', confirmed: 'success', active: 'success',
  returned: 'purple', complete: 'purple', cancelled: 'danger', overdue: 'warning',
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from('orders_with_customer').select('*').eq('id', id).single(),
    supabase.from('order_items').select('*, inventory_items(id, name, sku)').eq('order_id', id),
  ])

  if (!order) notFound()

  // Check availability against this order's own pickup–return date range,
  // counting reservations from every other overlapping order — not just today's stock.
  const itemIds = (items ?? []).map(i => (i.inventory_items as any)?.id).filter(Boolean)
  const availability = order.pickup_date && order.return_date
    ? await computeDateRangeAvailability(supabase, {
        excludeOrderId: order.id,
        pickupDate: order.pickup_date,
        returnDate: order.return_date,
        itemIds,
      })
    : {}

  const availabilityMap: Record<string, { available: number; ordered: number }> = {}
  for (const item of items ?? []) {
    const itemId = (item.inventory_items as any)?.id
    const avail = availability[itemId]
    availabilityMap[item.id] = { available: avail?.availableForRange ?? 0, ordered: item.quantity }
  }

  return (
    <div>
      <PageHeader
        title={order.order_number}
        subtitle={`${order.customer_name} — ${order.event_name}`}
        action={
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_VARIANTS[order.status as OrderStatus]} className="capitalize text-sm px-3 py-1">
              {order.status}
            </Badge>
            <OrderActions
              orderId={order.id}
              currentStatus={order.status as OrderStatus}
              orderNumber={order.order_number}
              customerName={order.customer_name}
              customerPhone={(order as any).customer_phone}
              customerEmail={order.customer_email}
              eventName={order.event_name}
              total={(order as any).total}
            />
          </div>
        }
      />

      <div className="p-6 grid grid-cols-3 gap-6 max-w-6xl">
        {/* Main content */}
        <div className="col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-800">Rental Items</span>
              <span className="text-xs text-gray-400">Live availability shown below</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-5 py-3 font-medium text-gray-600">Item</th>
                  <th className="px-5 py-3 font-medium text-gray-600 text-center">Qty</th>
                  <th className="px-5 py-3 font-medium text-gray-600 text-center">Days</th>
                  <th className="px-5 py-3 font-medium text-gray-600 text-right">Rate/Day</th>
                  <th className="px-5 py-3 font-medium text-gray-600 text-right">Total</th>
                  <th className="px-5 py-3 font-medium text-gray-600 text-center">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items?.map(item => {
                  const avail = availabilityMap[item.id]
                  const isUnavailable = avail && avail.available < item.quantity
                  return (
                    <tr key={item.id} className={isUnavailable ? 'bg-red-50' : ''}>
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900">{(item.inventory_items as any)?.name}</div>
                        <div className="text-xs text-gray-400">{(item.inventory_items as any)?.sku}</div>
                      </td>
                      <td className="px-5 py-3 text-center text-gray-700">{item.quantity}</td>
                      <td className="px-5 py-3 text-center text-gray-700">{item.rental_days}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{formatGHS(item.unit_rate)}</td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900">{formatGHS(item.line_total)}</td>
                      <td className="px-5 py-3 text-center">
                        {isUnavailable ? (
                          <div className="space-y-1">
                            <span className="inline-block text-xs px-2 py-0.5 bg-red-100 text-red-700 font-medium rounded-full">
                              ⚠ Insufficient ({avail.available} available)
                            </span>
                            <div>
                              <RemoveItemLink orderId={id} itemId={item.id} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 font-medium rounded-full">✓ Available</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Financial Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatGHS(order.subtotal)}</span></div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatGHS(order.discount_amount)}</span></div>
              )}
              {order.delivery_fee > 0 && (
                <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{formatGHS(order.delivery_fee)}</span></div>
              )}
              {order.tax_amount > 0 && <div className="flex justify-between text-gray-600"><span>VAT (15%)</span><span>{formatGHS(order.tax_amount)}</span></div>}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                <span>Total</span><span>{formatGHS(order.total)}</span>
              </div>
              <div className="flex justify-between text-green-600"><span>Paid</span><span>{formatGHS(order.amount_paid)}</span></div>
              <div className={`flex justify-between font-semibold pt-1 border-t border-gray-100 ${order.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span>Balance Due</span><span>{formatGHS(order.balance_due)}</span>
              </div>
            </div>
          </div>

          {/* Event info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Event & Delivery</h3>
            <div className="text-sm space-y-2">
              <div><span className="text-gray-500">Event Date:</span> <span className="text-gray-800 ml-1">{order.event_date ?? '—'}</span></div>
              <div><span className="text-gray-500">Pickup:</span> <span className="text-gray-800 ml-1">{formatDateTime(order.pickup_date)}</span></div>
              <div><span className="text-gray-500">Return:</span> <span className="text-gray-800 ml-1">{formatDateTime(order.return_date)}</span></div>
              <div><span className="text-gray-500">Delivery:</span> <span className="text-gray-800 capitalize ml-1">{order.delivery_method?.replace(/_/g, ' ')}</span></div>
              {order.venue_name && <div><span className="text-gray-500">Venue:</span> <span className="text-gray-800 ml-1">{order.venue_name}</span></div>}
              {order.venue_region && <div><span className="text-gray-500">Region:</span> <span className="text-gray-800 ml-1">{order.venue_region}</span></div>}
            </div>
          </div>

          {/* Record history — traceability */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="font-semibold text-gray-800">Record History</h3>
            <div className="text-sm space-y-1">
              <div><span className="text-gray-500">Created:</span> <span className="text-gray-800 ml-1">{formatDateTime(order.created_at)}</span></div>
              {order.updated_at && order.updated_at !== order.created_at && (
                <div><span className="text-gray-500">Last Edited:</span> <span className="text-gray-800 ml-1">{formatDateTime(order.updated_at)}</span></div>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="font-semibold text-gray-800">Customer</h3>
            <div className="text-sm space-y-1">
              <div className="font-medium text-gray-900">{order.customer_name}</div>
              {order.company_name && <div className="text-gray-500">{order.company_name}</div>}
              {order.customer_email && <div className="text-gray-600">{order.customer_email}</div>}
              {order.customer_phone && <div className="text-gray-600">{order.customer_phone}</div>}
            </div>
            <a href={`/customers/${order.customer_id}`} className="text-xs text-blue-600 hover:text-blue-700">View profile →</a>
          </div>

          {/* Notes */}
          {(order.customer_notes || order.internal_notes) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
              <h3 className="font-semibold text-gray-800">Notes</h3>
              {order.customer_notes && (
                <div><p className="text-xs text-gray-500 mb-1">Customer notes</p><p className="text-sm text-gray-700">{order.customer_notes}</p></div>
              )}
              {order.internal_notes && (
                <div><p className="text-xs text-gray-500 mb-1">Internal</p><p className="text-sm text-gray-700">{order.internal_notes}</p></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
