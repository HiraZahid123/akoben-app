import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import RecordPaymentForm from './RecordPaymentForm'
import { notFound } from 'next/navigation'

export default async function RecordPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: order }, { data: invoice }] = await Promise.all([
    supabase.from('orders_with_customer').select('*').eq('id', id).single(),
    supabase.from('invoices').select('id').eq('order_id', id).maybeSingle(),
  ])

  if (!order) notFound()

  return (
    <div>
      <PageHeader
        title="Record Payment"
        subtitle={`${order.order_number} — ${order.customer_name}`}
      />
      <div className="p-6 max-w-lg">
        <RecordPaymentForm
          orderId={id}
          invoiceId={invoice?.id ?? null}
          customerId={order.customer_id}
          balanceDue={(order as any).balance_due}
          orderNumber={order.order_number}
          orderTotal={(order as any).total}
          orderStatus={order.status}
        />
      </div>
    </div>
  )
}
