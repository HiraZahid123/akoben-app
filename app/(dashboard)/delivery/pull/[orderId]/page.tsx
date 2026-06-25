import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import { notFound } from 'next/navigation'
import PullOrderSheet from './PullOrderSheet'

export default async function PullOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
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
        <PullOrderSheet order={order as any} items={items ?? []} invoiceNumber={invoice?.invoice_number ?? null} />
      </div>
    </div>
  )
}
