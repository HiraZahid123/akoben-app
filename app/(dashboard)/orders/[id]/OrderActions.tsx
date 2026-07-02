'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/ToastProvider'
import type { OrderStatus } from '@/types/database'

const TRANSITIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus; color: string }[]>> = {
  draft:     [{ label: 'Confirm Order', next: 'confirmed', color: 'bg-green-600 hover:bg-green-700' }],
  active:    [{ label: 'Mark Returned', next: 'returned',  color: 'bg-purple-600 hover:bg-purple-700' }],
}

const STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  confirmed: 'Order confirmed',
  active: 'Order marked active — items are out',
  returned: 'Order marked as returned',
}

export default function OrderActions({ orderId, currentStatus, orderNumber, customerName, customerPhone, customerEmail, eventName, total }: {
  orderId: string
  currentStatus: OrderStatus
  orderNumber?: string
  customerName?: string
  customerPhone?: string | null
  customerEmail?: string | null
  eventName?: string
  total?: number
}) {
  const router = useRouter()
  const { success, error } = useToast()
  const [loading, setLoading] = useState(false)
  const transitions = TRANSITIONS[currentStatus] ?? []

  function sendWhatsApp() {
    if (!customerPhone) { error('No phone number on file for this customer'); return }
    const phone = customerPhone.replace(/\D/g, '').replace(/^0/, '233')
    const msg = `Hello ${customerName}, your order *${orderNumber}* has been confirmed with Akoben Event Rentals.\n\nEvent: ${eventName}\nTotal: GHS ${(total ?? 0).toFixed(2)}\n\nThank you for booking with us!`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  async function sendEmail() {
    if (!customerEmail) { error('No email on file for this customer'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customerEmail,
          subject: `Order ${orderNumber} — Akoben Event Rentals`,
          html: `<p>Dear ${customerName},</p><p>Your order <strong>${orderNumber}</strong> for <strong>${eventName}</strong> has been updated.</p><p>Total: <strong>GHS ${(total ?? 0).toFixed(2)}</strong></p><p>Please contact us if you have any questions. Thank you for booking with Akoben Event Rentals!</p>`,
        }),
      })
      if (res.ok) success(`Order emailed to ${customerEmail}`)
      else error('Failed to send email')
    } finally {
      setLoading(false)
    }
  }

  async function changeStatus(next: OrderStatus) {
    setLoading(true)
    const { error: err } = await supabase.from('orders').update({ status: next }).eq('id', orderId)
    if (err) { error('Failed to update order status') } else { success(STATUS_LABELS[next] ?? 'Order updated'); router.refresh() }
    setLoading(false)
  }

  async function voidOrder() {
    if (!confirm('Void this order? It will be flagged as void for traceability but not deleted.')) return
    setLoading(true)
    const { error: err } = await supabase.from('orders').update({ status: 'cancelled' as OrderStatus }).eq('id', orderId)
    if (err) { error('Failed to void order') } else { success('Order voided — marked as cancelled') ; router.refresh() }
    setLoading(false)
  }

  async function generateInvoice() {
    setLoading(true)
    const { data: existing } = await supabase.from('invoices').select('id').eq('order_id', orderId).limit(1).single()
    if (existing) {
      router.push(`/invoices/${existing.id}`)
      setLoading(false)
      return
    }
    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()
    if (!order) { error('Could not load order'); setLoading(false); return }
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    const total = (order as any).total ?? 0
    const { data: inv, error: invErr } = await supabase.from('invoices').insert({
      order_id: orderId,
      customer_id: (order as any).customer_id,
      due_date: dueDate,
      subtotal: (order as any).subtotal ?? 0,
      delivery_fee: (order as any).delivery_fee ?? 0,
      tax_amount: (order as any).tax_amount ?? 0,
      total: total,
      amount_paid: 0,
      balance_due: total,
      status: 'draft' as any,
      invoice_number: '',
    }).select().single()
    if (invErr || !inv) { error('Failed to generate invoice'); setLoading(false); return }
    success('Invoice generated')
    router.push(`/invoices/${inv.id}`)
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {transitions.map(t => (
        <button key={t.next} onClick={() => changeStatus(t.next)} disabled={loading}
          className={`px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${t.color}`}>
          {loading ? '...' : t.label}
        </button>
      ))}
      <a href={`/orders/${orderId}/edit`}
        className="px-3 py-1.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
        Edit
      </a>
      <button onClick={generateInvoice} disabled={loading}
        className="px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors">
        {loading ? '...' : '🧾 Invoice'}
      </button>
      <a href={`/api/pdf/contract/${orderId}`} target="_blank"
        className="px-3 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors">
        📄 Contract
      </a>
      <button onClick={sendEmail} disabled={loading}
        className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {loading ? '...' : '📧 Email'}
      </button>
      {customerPhone && (
        <button onClick={sendWhatsApp}
          className="px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors">
          💬 WhatsApp
        </button>
      )}
      {currentStatus !== 'cancelled' && currentStatus !== 'returned' && (
        <button onClick={voidOrder} disabled={loading}
          className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
          title="Void this order — marks it as cancelled for traceability">
          {loading ? '...' : '⊘ Void Order'}
        </button>
      )}
    </div>
  )
}
