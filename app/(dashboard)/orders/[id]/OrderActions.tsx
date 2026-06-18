'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/ToastProvider'
import type { OrderStatus } from '@/types/database'

const TRANSITIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus; color: string }[]>> = {
  draft:     [{ label: 'Confirm Order',          next: 'confirmed', color: 'bg-green-600 hover:bg-green-700' }],
  confirmed: [{ label: 'Mark Active (Items Out)', next: 'active',    color: 'bg-blue-600 hover:bg-blue-700' }],
  active:    [{ label: 'Mark Returned',           next: 'returned',  color: 'bg-purple-600 hover:bg-purple-700' }],
}

const STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  confirmed: 'Order confirmed',
  active: 'Order marked active — items are out',
  returned: 'Order marked as returned',
}

export default function OrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const router = useRouter()
  const { success, error } = useToast()
  const [loading, setLoading] = useState(false)
  const transitions = TRANSITIONS[currentStatus] ?? []

  async function changeStatus(next: OrderStatus) {
    setLoading(true)
    const { error: err } = await supabase.from('orders').update({ status: next }).eq('id', orderId)
    if (err) { error('Failed to update order status') } else { success(STATUS_LABELS[next] ?? 'Order updated'); router.refresh() }
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
    const { data: order } = await supabase.from('orders_with_customer').select('*').eq('id', orderId).single()
    if (!order) { error('Could not load order'); setLoading(false); return }
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    const { data: inv, error: invErr } = await supabase.from('invoices').insert({
      order_id: orderId,
      customer_id: (order as any).customer_id,
      due_date: dueDate,
      subtotal: (order as any).subtotal ?? 0,
      discount_amount: (order as any).discount_amount ?? 0,
      tax_amount: (order as any).tax_amount ?? 0,
      total_amount: (order as any).total ?? 0,
      amount_paid: (order as any).amount_paid ?? 0,
      balance_due: (order as any).balance_due ?? 0,
      status: 'draft',
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
    </div>
  )
}
