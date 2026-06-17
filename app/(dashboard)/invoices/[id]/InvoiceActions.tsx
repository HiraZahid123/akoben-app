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
  customerName: string
  total: number
  dueDate: string
}

export default function InvoiceActions({ invoiceId, orderId, invoiceNumber, currentStatus, customerEmail, customerName, total, dueDate }: Props) {
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [loading, setLoading] = useState(false)

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
          html: invoiceEmailHtml({ customerName, invoiceNumber, total, dueDate }),
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
    <div className="flex items-center gap-2">
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
