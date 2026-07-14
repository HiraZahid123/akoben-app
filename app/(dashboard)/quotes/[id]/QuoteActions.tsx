'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { quoteEmailHtml } from '@/lib/email-client'
import { useToast } from '@/components/ui/ToastProvider'
import type { QuoteStatus } from '@/types/database'
import { Mail, MessageCircle, Check, ArrowRight, Ban, Trash2 } from 'lucide-react'

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
  items?: { name: string; quantity: number; lineTotal: number }[]
  deliveryFee?: number
  setupFee?: number
  securityDeposit?: number
  additionalChargesDescription?: string | null
  additionalChargesAmount?: number
}

export default function QuoteActions({ quoteId, quoteNumber, currentStatus, customerEmail, customerPhone, customerName, total, expiresAt, convertedToOrder, items, deliveryFee, setupFee, securityDeposit, additionalChargesDescription, additionalChargesAmount }: Props) {
  const router = useRouter()
  const { success, error: toastError, info } = useToast()
  const [loading, setLoading] = useState(false)

  function buildWhatsAppHref() {
    if (!customerPhone) return null
    const phone = customerPhone.replace(/\D/g, '').replace(/^0/, '233')
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const pdfUrl = `${origin}/api/pdf/quote/${quoteId}`
    const msg = `Hello ${customerName}, please find your quote *${quoteNumber}* from Akoben Event Rentals.\n\nTotal: GHS ${total.toFixed(2)}\nExpires: ${expiresAt}\n\nItemized quote: ${pdfUrl}\n\nPlease reply to confirm or request changes. Thank you!`
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }
  const whatsAppHref = buildWhatsAppHref()

  function handleWhatsAppClick(e: React.MouseEvent) {
    if (!customerPhone) { e.preventDefault(); toastError('No phone number on file for this customer') }
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
          html: quoteEmailHtml({
            customerName, quoteNumber, total, expiresAt,
            // Public, no-login PDF — the previous link pointed at the auth-gated dashboard page
            viewUrl: `${window.location.origin}/api/pdf/quote/${quoteId}`,
            items, deliveryFee, setupFee, securityDeposit,
            additionalChargesDescription, additionalChargesAmount,
          }),
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

  async function deleteQuote() {
    if (!confirm('Permanently delete this quote? This cannot be undone.')) return
    setLoading(true)
    await supabase.from('quote_items').delete().eq('quote_id', quoteId)
    await supabase.from('quotes').delete().eq('id', quoteId)
    success('Quote deleted')
    router.push('/quotes')
    setLoading(false)
  }

  async function voidQuote() {
    if (!confirm('Void this quote? It will be marked as void for record-keeping but not deleted.')) return
    setLoading(true)
    await supabase.from('quotes').update({ status: 'void' as any }).eq('id', quoteId)
    success('Quote voided')
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
      venue_name:       quote.venue_name,
      venue_region:     quote.venue_region,
      venue_address:    quote.venue_address,
      delivery_fee:     quote.delivery_fee,
      setup_fee:        quote.setup_fee,
      security_deposit: quote.security_deposit,
      additional_charges_description: quote.additional_charges_description,
      additional_charges_amount: quote.additional_charges_amount,
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
      const setupFee = quote.setup_fee ?? 0
      const securityDeposit = quote.security_deposit ?? 0
      const additionalChargesAmount = quote.additional_charges_amount ?? 0
      const taxable = subtotal - discountAmount + deliveryFee + setupFee
      const taxAmount = Math.round(taxable * (quote.tax_rate ?? 0) / 100 * 100) / 100
      const totalAmount = taxable + taxAmount + securityDeposit + additionalChargesAmount
      // Payment is due on pickup day, not a fixed number of days after creation
      const dueDate = (order.pickup_date ?? new Date().toISOString()).slice(0, 10)

      const { data: invoice } = await supabase.from('invoices').insert({
        order_id: order.id,
        customer_id: quote.customer_id,
        due_date: dueDate,
        subtotal,
        delivery_fee: deliveryFee,
        setup_fee: setupFee,
        security_deposit: securityDeposit,
        additional_charges_description: quote.additional_charges_description,
        additional_charges_amount: additionalChargesAmount,
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
      {/* Resend buttons — always visible so updated quotes can be re-sent */}
      <button onClick={sendQuoteEmail} disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {loading ? '...' : <><Mail size={14} /> {currentStatus === 'draft' ? 'Send to Customer' : 'Resend Email'}</>}
      </button>
      <a href={whatsAppHref ?? '#'} onClick={handleWhatsAppClick} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors">
        <MessageCircle size={14} /> WhatsApp
      </a>

      {currentStatus === 'sent' && (
        <button onClick={markAccepted} disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
          {loading ? '...' : <><Check size={14} /> Mark Accepted</>}
        </button>
      )}
      {currentStatus === 'accepted' && !convertedToOrder && (
        <button onClick={convertToOrder} disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
          {loading ? '...' : <>Convert to Order <ArrowRight size={14} /></>}
        </button>
      )}
      {currentStatus === 'accepted' && convertedToOrder && (
        <a href={`/orders/${convertedToOrder}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors">
          <Check size={14} /> View Order <ArrowRight size={14} />
        </a>
      )}

      {/* Void — for quotes converted to order but had errors (keeps record) */}
      {(currentStatus as string) !== 'void' && (
        <button onClick={voidQuote} disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-200 disabled:opacity-50 transition-colors"
          title="Mark as void — keeps the record but flags it as invalid">
          {loading ? '...' : <><Ban size={14} /> Void</>}
        </button>
      )}

      {/* Delete — only for quotes not yet converted to an order */}
      {!convertedToOrder && (currentStatus as string) !== 'void' && (
        <button onClick={deleteQuote} disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
          title="Permanently delete this quote — use only if it was never converted to an order">
          {loading ? '...' : <><Trash2 size={14} /> Delete</>}
        </button>
      )}
    </div>
  )
}
