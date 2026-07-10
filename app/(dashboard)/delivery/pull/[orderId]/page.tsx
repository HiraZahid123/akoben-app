import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import { notFound } from 'next/navigation'
import PullOrderSheet from './PullOrderSheet'
import { Lock } from 'lucide-react'

export default async function PullOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: order }, { data: items }, { data: invoice }] = await Promise.all([
    supabase.from('orders_with_customer').select('*').eq('id', orderId).single(),
    supabase.from('order_items')
      .select('*, inventory_items(id, name, sku, inventory_units(id, unit_number, barcode, status, condition))')
      .eq('order_id', orderId),
    supabase.from('invoices').select('id, invoice_number, total, balance_due').eq('order_id', orderId).maybeSingle(),
  ])

  if (!order) notFound()

  const itemIds = (items ?? []).map(i => (i.inventory_items as any)?.id).filter(Boolean)
  const { data: bundles } = itemIds.length > 0
    ? await supabase.from('inventory_bundles').select('*').in('item_id', itemIds).eq('status', 'available')
    : { data: [] }

  // Pull Order becomes active starting 1 day before the pickup date
  const oneDayBeforePickup = order.pickup_date
    ? new Date(new Date(order.pickup_date).getTime() - 24 * 60 * 60 * 1000)
    : null
  const isActiveYet = !oneDayBeforePickup || new Date() >= oneDayBeforePickup

  return (
    <div>
      <PageHeader
        title={`Pull Order — ${order.order_number}`}
        subtitle={`${order.customer_name} — ${order.event_name}`}
        action={
          <a href={`/delivery`} className="px-3 py-1.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
            ← Back to Delivery
          </a>
        }
      />
      <div className="p-6">
        {!isActiveYet ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 max-w-2xl text-center">
            <Lock size={28} className="mx-auto mb-2 text-amber-500" strokeWidth={1.5} />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Pull Order Not Yet Active</h2>
            <p className="text-sm text-gray-600">
              This order's pickup date is <strong>{new Date(order.pickup_date).toLocaleDateString()}</strong>.
              Pull Order becomes available starting <strong>{oneDayBeforePickup?.toLocaleDateString()}</strong> (1 day before pickup).
            </p>
          </div>
        ) : (
          <PullOrderSheet
            order={order as any}
            items={items ?? []}
            invoiceNumber={invoice?.invoice_number ?? null}
            balanceDue={invoice?.balance_due ?? 0}
            invoiceTotal={invoice?.total ?? 0}
            bundles={bundles ?? []}
          />
        )}
      </div>
    </div>
  )
}
