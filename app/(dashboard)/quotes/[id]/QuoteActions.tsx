'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { quoteEmailHtml } from '@/lib/email-client'
import { useToast } from '@/components/ui/ToastProvider'
import type { QuoteStatus } from '@/types/database'

interface Props {
  quoteId: string
  quoteNumber: string
  currentStatus: QuoteStatus
  customerEmail: string | null
  customerPhone: string | null
  customerName: string
  total: number
  expiresAt: string
  convertedToOrder?: string | null
}

export default function QuoteActions({ quoteId, quoteNumber, currentStatus, customerEmail, customerPhone, customerName, total, expiresAt, convertedToOrder }: Props) {
  const router = useRouter()
  const { success, error: toastError, info } = useToast()
  const [loading, setLoading] = useState(false)

  function sendWhatsApp() {
    if (!customerPhone) { toastError('No phone number on file for this customer'); return }
    const phone = customerPhone.replace(/\D/g, '').replace(/^0/, '233')
    const msg = `Hello ${customerName}, please find your quote *${quoteNumber}* from Akoben Event Rentals.\n\nTotal: GHS ${total.toFixed(2)}\nExpires: ${expiresAt}\n\nPlease reply to confirm or request changes. Thank you!`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  async function sendQuoteEmail() {
    if (!customerEmail) { toastError('No email on file for this customer'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customerEmail,
          subject: `Your Quote ${quoteNumber} — Akoben Event Rentals`,
          html: quoteEmailHtml({ customerName, quoteNumber, total, expiresAt, viewUrl: window.location.href }),
        }),
      })
      if (res.ok) {
        await supabase.from('quotes').update({ status: 'sent' }).eq('id', quoteId)
        success(`Quote emailed to ${customerEmail}`)
        router.refresh()
      } else {
        toastError('Failed to send email')
      }
    } finally {
      setLoading(false)
    }
  }

  async function markAccepted() {
    setLoading(true)
    await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quoteId)
    success('Quote marked as accepted')
    router.refresh()
    setLoading(false)
  }

  async function convertToOrder() {
    setLoading(true)
    // Fetch quote items to copy over
    const { data: qItems } = await supabase.from('quote_items').select('*').eq('quote_id', quoteId)
    const { data: quote } = await supabase.from('quotes').select('*').eq('id', quoteId).single()
    if (!quote) { setLoading(false); return }

    const { data: order } = await supabase.from('orders').insert({
      customer_id:      quote.customer_id,
      event_name:       quote.event_name,
      event_type:       quote.event_type,
      event_date:       quote.event_date,
      pickup_date:      quote.pickup_date ?? new Date().toISOString(),
      return_date:      quote.return_date ?? new Date().toISOString(),
      delivery_method:  quote.delivery_method,
      venue_address:    quote.venue_address,
      delivery_fee:     quote.delivery_fee,
      discount_pct:     quote.discount_pct,
      tax_rate:         quote.tax_rate,
      status:           'confirmed',
      converted_from_quote: quoteId,
      order_number:     '',
    }).select().single()

    if (order && qItems) {
      await supabase.from('order_items').insert(
        qItems.map(qi => ({
          order_id: order.id, item_id: qi.item_id,
          quantity: qi.quantity, unit_rate: qi.unit_rate,
          rental_days: qi.rental_days, line_total: qi.line_total,
        }))
      )

      // Auto-generate invoice
      const subtotal = qItems.reduce((s, qi) => s + (qi.line_total ?? 0), 0)
      const discountAmount = Math.round(subtotal * (quote.discount_pct ?? 0) / 100 * 100) / 100
      const deliveryFee = quote.delivery_fee ?? 0
      const taxable = subtotal - discountAmount + deliveryFee
      const taxAmount = Math.round(taxable * (quote.tax_rate ?? 0) / 100 * 100) / 100
      const totalAmount = taxable + taxAmount
      const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

      const { data: invoice } = await supabase.from('invoices').insert({
        order_id: order.id,
        customer_id: quote.customer_id,
        due_date: dueDate,
        subtotal,
        delivery_fee: deliveryFee,
        tax_amount: taxAmount,
        total: totalAmount,
        amount_paid: 0,
        balance_due: totalAmount,
        status: 'draft' as any,
        invoice_number: '',
      }).select().single()

      await supabase.from('quotes').update({ status: 'accepted', converted_to_order: order.id }).eq('id', quoteId)
      success('Quote converted to order — invoice created')
      router.push(invoice ? `/invoices/${invoice.id}` : `/orders/${order.id}`)
    } else {
      toastError('Failed to convert quote to order')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {currentStatus === 'draft' && (
        <>
          <button onClick={sendQuoteEmail} disabled={loading}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? '...' : '📧 Send to Customer'}
          </button>
          <button onClick={sendWhatsApp}
            className="px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors">
            💬 WhatsApp
          </button>
        </>
      )}
      {currentStatus === 'sent' && (
        <>
          <button onClick={markAccepted} disabled={loading}
            className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
            {loading ? '...' : '✓ Mark Accepted'}
          </button>
          <button onClick={sendQuoteEmail} disabled={loading}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors">
            Resend
          </button>
          <button onClick={sendWhatsApp}
            className="px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors">
            💬 WhatsApp
          </button>
        </>
      )}
      {currentStatus === 'accepted' && !convertedToOrder && (
        <button onClick={convertToOrder} disabled={loading}
          className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
          {loading ? '...' : '→ Convert to Order'}
        </button>
      )}
      {currentStatus === 'accepted' && convertedToOrder && (
        <a href={`/orders/${convertedToOrder}`}
          className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors">
          ✓ View Order →
        </a>
      )}
    </div>
  )
}
