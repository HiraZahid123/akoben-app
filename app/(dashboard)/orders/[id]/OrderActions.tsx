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
    if (err) {
      error('Failed to update order status')
    } else {
      success(STATUS_LABELS[next] ?? 'Order updated')
      router.refresh()
    }
    setLoading(false)
  }

  if (transitions.length === 0) return null

  return (
    <div className="flex gap-2">
      {transitions.map(t => (
        <button
          key={t.next}
          onClick={() => changeStatus(t.next)}
          disabled={loading}
          className={`px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${t.color}`}
        >
          {loading ? '...' : t.label}
        </button>
      ))}
    </div>
  )
}
