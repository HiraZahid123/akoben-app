import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatGHS, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import QuoteActions from './QuoteActions'
import type { QuoteStatus } from '@/types/database'

const STATUS_VARIANTS: Record<QuoteStatus, 'default' | 'info' | 'success' | 'warning' | 'danger' | 'purple'> = {
  draft: 'default', sent: 'info', accepted: 'success', declined: 'danger', expired: 'warning',
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase.from('quotes').select('*, customers(id, full_name, company_name, email, phone)').eq('id', id).single(),
    supabase.from('quote_items').select('*, inventory_items(name, sku)').eq('quote_id', id),
  ])

  if (!quote) notFound()
  const customer = quote.customers as any

  return (
    <div>
      <PageHeader
        title={quote.quote_number}
        subtitle={`${customer?.full_name} — ${quote.event_name}`}
        action={
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_VARIANTS[quote.status as QuoteStatus]} className="capitalize text-sm px-3 py-1">
              {quote.status === 'accepted' && quote.converted_to_order ? 'Converted to Order' : quote.status}
            </Badge>
            <a href={`/quotes/${quote.id}/edit`}
              className="px-3 py-1.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Edit
            </a>
            <QuoteActions
              quoteId={quote.id}
              quoteNumber={quote.quote_number}
              currentStatus={quote.status as QuoteStatus}
              customerEmail={customer?.email}
              customerPhone={customer?.phone}
              customerName={customer?.full_name}
              total={quote.total}
              expiresAt={formatDate(quote.expires_at)}
              convertedToOrder={quote.converted_to_order}
            />
          </div>
        }
      />

      <div className="p-6 grid grid-cols-3 gap-6 max-w-6xl">
        <div className="col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-800">Quoted Items</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-5 py-3 font-medium text-gray-600">Item</th>
                  <th className="px-5 py-3 font-medium text-gray-600 text-center">Qty</th>
                  <th className="px-5 py-3 font-medium text-gray-600 text-center">Days</th>
                  <th className="px-5 py-3 font-medium text-gray-600 text-right">Rate/Day</th>
                  <th className="px-5 py-3 font-medium text-gray-600 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items?.map(item => (
                  <tr key={item.id}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{(item.inventory_items as any)?.name}</div>
                      <div className="text-xs text-gray-400">{(item.inventory_items as any)?.sku}</div>
                    </td>
                    <td className="px-5 py-3 text-center text-gray-700">{item.quantity}</td>
                    <td className="px-5 py-3 text-center text-gray-700">{item.rental_days}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{formatGHS(item.unit_rate)}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">{formatGHS(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {quote.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
              <p className="text-sm text-gray-700">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Quote Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatGHS(quote.subtotal)}</span></div>
              {quote.discount_pct > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount ({quote.discount_pct}%)</span><span>−{formatGHS(quote.subtotal * quote.discount_pct / 100)}</span></div>
              )}
              {quote.delivery_fee > 0 && <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{formatGHS(quote.delivery_fee)}</span></div>}
              {quote.tax_amount > 0 && <div className="flex justify-between text-gray-600"><span>VAT ({quote.tax_rate}%)</span><span>{formatGHS(quote.tax_amount)}</span></div>}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                <span>Total</span><span>{formatGHS(quote.total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="font-semibold text-gray-800">Details</h3>
            <div className="text-sm space-y-1.5">
              <div><span className="text-gray-500">Event Date:</span> <span className="text-gray-800 ml-1">{formatDate(quote.event_date)}</span></div>
              <div><span className="text-gray-500">Pickup:</span> <span className="text-gray-800 ml-1">{formatDate(quote.pickup_date)}</span></div>
              <div><span className="text-gray-500">Return:</span> <span className="text-gray-800 ml-1">{formatDate(quote.return_date)}</span></div>
              <div><span className="text-gray-500">Expires:</span> <span className="text-gray-800 ml-1">{formatDate(quote.expires_at)}</span></div>
              {quote.venue_name && <div><span className="text-gray-500">Venue:</span> <span className="text-gray-800 ml-1">{quote.venue_name}</span></div>}
              {quote.venue_region && <div><span className="text-gray-500">Region:</span> <span className="text-gray-800 ml-1">{quote.venue_region}</span></div>}
              {quote.venue_address && <div><span className="text-gray-500">Address:</span> <span className="text-gray-800 ml-1">{quote.venue_address}</span></div>}
              {(quote as any).setup_fee > 0 && <div><span className="text-gray-500">Setup Fee:</span> <span className="text-gray-800 ml-1">{formatGHS((quote as any).setup_fee)}</span></div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="font-semibold text-gray-800">Customer</h3>
            <div className="text-sm space-y-1">
              <div className="font-medium text-gray-900">{customer?.full_name}</div>
              {customer?.email && <div className="text-gray-600">{customer.email}</div>}
              {customer?.phone && <div className="text-gray-600">{customer.phone}</div>}
            </div>
            <a href={`/customers/${customer?.id}`} className="text-xs text-blue-600 hover:text-blue-700">View profile →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
