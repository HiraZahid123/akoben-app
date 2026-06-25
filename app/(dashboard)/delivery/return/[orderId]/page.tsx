import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import { notFound } from 'next/navigation'
import ReturnOrderSheet from './ReturnOrderSheet'

export default async function ReturnOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: order }, { data: items }, { data: invoice }] = await Promise.all([
    supabase.from('orders_with_customer').select('*').eq('id', orderId).single(),
    supabase.from('order_items')
      .select('*, inventory_items(id, name, sku, inventory_units(id, unit_number, barcode, status, condition))')
      .eq('order_id', orderId),
    supabase.from('invoices').select('id, invoice_number').eq('order_id', orderId).maybeSingle(),
  ])

  if (!order) notFound()

  // Fetch previously checked-out units for this order from scan log
  const { data: checkoutLogs } = await supabase
    .from('barcode_scan_log')
    .select('unit_id, barcode')
    .eq('action', 'checkout')
    .like('result', `pull_order:${order.order_number}`)

  const checkedOutUnitIds = new Set((checkoutLogs ?? []).map((l: any) => l.unit_id))

  return (
    <div>
      <PageHeader
        title={`Return Order — ${order.order_number}`}
        subtitle={`${order.customer_name} — ${order.event_name}`}
        action={
          <a href="/delivery" className="px-3 py-1.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
            ← Back to Delivery
          </a>
        }
      />
      <div className="p-6">
        <ReturnOrderSheet
          order={order as any}
          items={items ?? []}
          invoiceNumber={invoice?.invoice_number ?? null}
          checkedOutUnitIds={Array.from(checkedOutUnitIds)}
        />
      </div>
    </div>
  )
}
