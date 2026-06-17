'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { quoteEmailHtml } from '@/lib/email-client'
import type { QuoteStatus } from '@/types/database'

interface Props {
  quoteId: string
  quoteNumber: string
  currentStatus: QuoteStatus
  customerEmail: string | null
  customerName: string
  total: number
  expiresAt: string
}

export default function QuoteActions({ quoteId, quoteNumber, currentStatus, customerEmail, customerName, total, expiresAt }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function sendQuoteEmail() {
    if (!customerEmail) { setMsg('No email on file for this customer'); return }
    setLoading(true); setMsg('')
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
        setMsg('Quote sent successfully!')
        router.refresh()
      } else {
        setMsg('Failed to send email')
      }
    } finally {
      setLoading(false)
    }
  }

  async function markAccepted() {
    setLoading(true)
    await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quoteId)
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
      await supabase.from('quotes').update({ status: 'accepted', converted_to_order: order.id }).eq('id', quoteId)
      router.push(`/orders/${order.id}`)
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {msg && <span className="text-xs text-gray-500">{msg}</span>}
      {currentStatus === 'draft' && (
        <button onClick={sendQuoteEmail} disabled={loading}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? '...' : '📧 Send to Customer'}
        </button>
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
        </>
      )}
      {currentStatus === 'accepted' && !loading && (
        <button onClick={convertToOrder} disabled={loading}
          className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
          {loading ? '...' : '→ Convert to Order'}
        </button>
      )}
    </div>
  )
}
