'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { invoiceEmailHtml } from '@/lib/email-client'
import { useToast } from '@/components/ui/ToastProvider'
import type { InvoiceStatus } from '@/types/database'

interface Props {
  invoiceId: string
  orderId: string
  invoiceNumber: string
  currentStatus: InvoiceStatus
  customerEmail: string | null
  customerPhone: string | null
  customerName: string
  total: number
  dueDate: string
  balanceDue?: number
  isBooked?: boolean
  amountPaid?: number
}

export default function InvoiceActions({ invoiceId, orderId, invoiceNumber, currentStatus, customerEmail, customerPhone, customerName, total, dueDate, balanceDue, isBooked, amountPaid }: Props) {
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [loading, setLoading] = useState(false)
  const [booked, setBooked] = useState(isBooked ?? false)

  const paid = amountPaid ?? 0
  const depositMet = total > 0 && paid >= total * 0.5

  async function bookEvent() {
    if (!depositMet) { toastError('At least 50% deposit required to book event'); return }
    if (!confirm('Book this event? This will register it on the calendar and activate the Pull Order.')) return
    setLoading(true)
    try {
      await supabase.from('orders').update({ is_booked: true, booked_at: new Date().toISOString(), status: 'confirmed' }).eq('id', orderId)
      setBooked(true)
      success('Event booked — now appears on the Calendar. Pull Order is now active.')
      router.refresh()
    } catch (err: any) {
      toastError(err.message ?? 'Failed to book event')
    } finally {
      setLoading(false)
    }
  }

  function sendWhatsApp() {
    if (!customerPhone) { toastError('No phone number on file for this customer'); return }
    const phone = customerPhone.replace(/\D/g, '').replace(/^0/, '233')
    const amount = balanceDue ?? total
    const msg = `Hello ${customerName}, your invoice *${invoiceNumber}* from Akoben Event Rentals is ready.\n\nBalance Due: GHS ${amount.toFixed(2)}\nDue Date: ${dueDate}\n\nPlease make payment at your earliest convenience. Thank you!`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  async function sendPaystackLink() {
    if (!customerEmail) { toastError('No email on file for this customer'); return }
    const amountToPay = balanceDue ?? total
    if (amountToPay <= 0) { toastError('Balance is already paid'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, orderId, email: customerEmail, amount: amountToPay, customerName, invoiceNumber }),
      })
      const data = await res.json()
      if (!res.ok) { toastError(data.error ?? 'Failed to create payment link'); return }
      // Send payment link via email
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customerEmail,
          subject: `Pay Invoice ${invoiceNumber} Online — Akoben Event Rentals`,
          html: `<p>Dear ${customerName},</p><p>Please click the link below to pay invoice <strong>${invoiceNumber}</strong> of <strong>GHS ${amountToPay.toFixed(2)}</strong> online via card or mobile money:</p><p><a href="${data.authorization_url}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Pay Now →</a></p><p>Powered by Paystack. Thank you!</p>`,
        }),
      })
      success(`Payment link sent to ${customerEmail}`)
    } finally { setLoading(false) }
  }

  async function sendInvoiceEmail() {
    if (!customerEmail) { toastError('No email on file for this customer'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customerEmail,
          subject: `Invoice ${invoiceNumber} — Akoben Event Rentals`,
          html: invoiceEmailHtml({ customerName, invoiceNumber, total: balanceDue ?? total, dueDate }),
        }),
      })
      if (res.ok) {
        await (supabase.from('invoices') as any).update({ status: 'sent' }).eq('id', invoiceId)
        success(`Invoice emailed to ${customerEmail}`)
        router.refresh()
      } else {
        toastError('Failed to send invoice email')
      }
    } finally { setLoading(false) }
  }

  async function markVoid() {
    const hasPayments = (amountPaid ?? 0) > 0
    const msg = hasPayments
      ? `Void this invoice? Payments of GHS ${(amountPaid ?? 0).toFixed(2)} have already been recorded — a negative balance will show in the summary. You may need to issue a refund or credit note.`
      : 'Void this invoice? It will be kept for traceability but marked as invalid.'
    if (!confirm(msg)) return
    setLoading(true)
    await (supabase.from('invoices') as any).update({ status: 'void' }).eq('id', invoiceId)
    success('Invoice marked as void')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {currentStatus !== 'paid' && currentStatus !== 'void' && (
        <>
          <button onClick={sendInvoiceEmail} disabled={loading}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? '...' : '📧 Email Invoice'}
          </button>
          <button onClick={sendWhatsApp}
            className="px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors">
            💬 WhatsApp
          </button>
          <button onClick={sendPaystackLink} disabled={loading}
            className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            title="Send a Paystack payment link to the customer">
            {loading ? '...' : '🔗 Send Payment Link'}
          </button>
          <a href={`/orders/${orderId}/payment`}
            className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
            + Record Payment
          </a>
        </>
      )}
      {/* Book Event button — shown when deposit is met but not yet booked */}
      {!booked && depositMet && currentStatus !== 'void' && (
        <button onClick={bookEvent} disabled={loading}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {loading ? '...' : '📅 Book Event'}
        </button>
      )}
      {/* Pull Order — only active after booking */}
      {booked && (
        <a href={`/delivery/pull/${orderId}`}
          className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
          📦 Pull Order
        </a>
      )}
      {/* Return Order — only after booking */}
      {booked && (
        <a href={`/delivery/return/${orderId}`}
          className="px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors">
          📥 Return Order
        </a>
      )}
      {currentStatus !== 'void' && (
        <button onClick={markVoid} disabled={loading}
          className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
          title="Void this invoice — kept for traceability. If payments were made, a negative balance will show.">
          {loading ? '...' : '⊘ Void'}
        </button>
      )}
      <a href={`/api/pdf/invoice/${invoiceId}`} target="_blank"
        className="px-3 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors">
        ⬇ PDF
      </a>
    </div>
  )
}
