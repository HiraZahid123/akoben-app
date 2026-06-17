import { createServerSupabaseClient } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatGHS, formatDate, formatDateTime, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import { notFound } from 'next/navigation'
import InvoiceActions from './InvoiceActions'
import type { InvoiceStatus } from '@/types/database'

const STATUS_VARIANTS: Record<InvoiceStatus, 'default' | 'info' | 'success' | 'warning' | 'danger' | 'purple'> = {
  draft: 'default', sent: 'info', unpaid: 'warning', partial: 'purple',
  paid: 'success', overdue: 'danger', void: 'default',
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: invoice }, { data: payments }] = await Promise.all([
    supabase.from('invoices')
      .select('*, customers(id, full_name, company_name, email, phone), orders(id, order_number, event_name, order_items(*, inventory_items(name)))')
      .eq('id', id).single(),
    supabase.from('payments').select('*').eq('invoice_id', id).order('created_at'),
  ])

  if (!invoice) notFound()
  const customer = invoice.customers as any
  const order = invoice.orders as any
  const orderItems = order?.order_items ?? []

  return (
    <div>
      <PageHeader
        title={invoice.invoice_number}
        subtitle={`${customer?.full_name} — ${order?.event_name ?? ''}`}
        action={
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_VARIANTS[invoice.status as InvoiceStatus]} className="capitalize text-sm px-3 py-1">
              {invoice.status}
            </Badge>
            <InvoiceActions
              invoiceId={invoice.id}
              orderId={invoice.order_id}
              invoiceNumber={invoice.invoice_number}
              currentStatus={invoice.status as InvoiceStatus}
              customerEmail={customer?.email}
              customerName={customer?.full_name}
              total={invoice.total}
              dueDate={formatDate(invoice.due_date)}
            />
          </div>
        }
      />

      <div className="p-6 grid grid-cols-3 gap-6 max-w-6xl">
        <div className="col-span-2 space-y-5">
          {/* Line items from order */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-800">Items</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-5 py-3 font-medium text-gray-600">Item</th>
                  <th className="px-5 py-3 font-medium text-gray-600 text-center">Qty</th>
                  <th className="px-5 py-3 font-medium text-gray-600 text-center">Days</th>
                  <th className="px-5 py-3 font-medium text-gray-600 text-right">Rate</th>
                  <th className="px-5 py-3 font-medium text-gray-600 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orderItems.map((oi: any) => (
                  <tr key={oi.id}>
                    <td className="px-5 py-3 font-medium text-gray-900">{oi.inventory_items?.name}</td>
                    <td className="px-5 py-3 text-center text-gray-700">{oi.quantity}</td>
                    <td className="px-5 py-3 text-center text-gray-700">{oi.rental_days}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{formatGHS(oi.unit_rate)}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatGHS(oi.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Totals */}
            <div className="px-5 py-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatGHS(invoice.subtotal)}</span></div>
              {invoice.delivery_fee > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Delivery</span><span>{formatGHS(invoice.delivery_fee)}</span></div>}
              <div className="flex justify-between text-sm text-gray-600"><span>VAT (15%)</span><span>{formatGHS(invoice.tax_amount)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
                <span>Total</span><span>{formatGHS(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-800">Payment History</span>
              <a href={`/orders/${invoice.order_id}/payment`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Record Payment</a>
            </div>
            {payments && payments.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-5 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Method</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Reference</th>
                    <th className="px-5 py-3 font-medium text-gray-600 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="px-5 py-3 text-gray-600">{formatDateTime(p.created_at)}</td>
                      <td className="px-5 py-3 text-gray-700">{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{p.reference ?? '—'}</td>
                      <td className="px-5 py-3 text-right font-medium text-green-600">{formatGHS(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-5 py-6 text-sm text-gray-400">No payments recorded yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Balance</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Invoice Total</span><span className="font-medium">{formatGHS(invoice.total)}</span></div>
              <div className="flex justify-between text-green-600"><span>Amount Paid</span><span className="font-medium">{formatGHS(invoice.amount_paid)}</span></div>
              <div className={`flex justify-between font-bold pt-2 border-t border-gray-100 text-base ${invoice.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span>Balance Due</span><span>{formatGHS(invoice.balance_due)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="font-semibold text-gray-800">Details</h3>
            <div className="text-sm space-y-1.5">
              <div><span className="text-gray-500">Due Date:</span> <span className="text-gray-800 ml-1 font-medium">{formatDate(invoice.due_date)}</span></div>
              {invoice.paid_at && <div><span className="text-gray-500">Paid At:</span> <span className="text-gray-800 ml-1">{formatDateTime(invoice.paid_at)}</span></div>}
              {order && <div><span className="text-gray-500">Order:</span> <a href={`/orders/${order.id}`} className="text-blue-600 ml-1 hover:text-blue-700">{order.order_number}</a></div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="font-semibold text-gray-800">Customer</h3>
            <div className="text-sm space-y-1">
              <div className="font-medium text-gray-900">{customer?.full_name}</div>
              {customer?.email && <div className="text-gray-600">{customer.email}</div>}
              {customer?.phone && <div className="text-gray-600">{customer.phone}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
