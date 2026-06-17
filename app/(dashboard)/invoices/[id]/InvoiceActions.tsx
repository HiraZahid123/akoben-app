'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { invoiceEmailHtml } from '@/lib/email-client'
import type { InvoiceStatus } from '@/types/database'

interface Props {
  invoiceId: string
  orderId: string
  invoiceNumber: string
  currentStatus: InvoiceStatus
  customerEmail: string | null
  customerName: string
  total: number
  dueDate: string
}

export default function InvoiceActions({ invoiceId, orderId, invoiceNumber, currentStatus, customerEmail, customerName, total, dueDate }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function sendInvoiceEmail() {
    if (!customerEmail) { setMsg('No email on file'); return }
    setLoading(true); setMsg('')
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customerEmail,
          subject: `Invoice ${invoiceNumber} — Akoben Event Rentals`,
          html: invoiceEmailHtml({ customerName, invoiceNumber, total, dueDate }),
        }),
      })
      if (res.ok) {
        await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoiceId)
        setMsg('Invoice sent!')
        router.refresh()
      } else {
        setMsg('Failed to send')
      }
    } finally { setLoading(false) }
  }

  async function markVoid() {
    if (!confirm('Mark this invoice as void?')) return
    setLoading(true)
    await supabase.from('invoices').update({ status: 'void' }).eq('id', invoiceId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-gray-500">{msg}</span>}
      {currentStatus !== 'paid' && currentStatus !== 'void' && (
        <>
          <button onClick={sendInvoiceEmail} disabled={loading}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? '...' : '📧 Email Invoice'}
          </button>
          <a href={`/orders/${orderId}/payment`}
            className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
            + Record Payment
          </a>
        </>
      )}
      {currentStatus !== 'void' && currentStatus !== 'paid' && (
        <button onClick={markVoid} disabled={loading}
          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors">
          Void
        </button>
      )}
    </div>
  )
}
