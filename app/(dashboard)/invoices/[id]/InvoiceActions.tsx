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
}

export default function InvoiceActions({ invoiceId, orderId, invoiceNumber, currentStatus, customerEmail, customerPhone, customerName, total, dueDate, balanceDue }: Props) {
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [loading, setLoading] = useState(false)

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
    if (!confirm('Mark this invoice as void?')) return
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
      {currentStatus === 'paid' && (
        <a href={`/scanner`}
          className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
          📦 Pull Order
        </a>
      )}
      {currentStatus !== 'void' && currentStatus !== 'paid' && (
        <button onClick={markVoid} disabled={loading}
          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors">
          Void
        </button>
      )}
      <a href={`/api/pdf/invoice/${invoiceId}`} target="_blank"
        className="px-3 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors">
        ⬇ PDF
      </a>
    </div>
  )
}
