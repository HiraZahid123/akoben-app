'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatGHS, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import { useToast } from '@/components/ui/ToastProvider'

interface Props {
  orderId: string
  invoiceId: string | null
  customerId: string
  balanceDue: number
  orderNumber: string
  orderTotal: number
  orderStatus: string
}

const PAYMENT_TYPES = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'partial', label: 'Partial Payment' },
  { value: 'final', label: 'Final Payment' },
  { value: 'refund', label: 'Refund' },
]

const MOBILE_MONEY_METHODS = ['mtn_mobile_money', 'vodafone_cash', 'airteltigo_money']

export default function RecordPaymentForm({ orderId, invoiceId, customerId, balanceDue, orderNumber, orderTotal, orderStatus }: Props) {
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    amount: balanceDue > 0 ? String(balanceDue.toFixed(2)) : '',
    payment_type: 'partial',
    method: 'cash',
    mobile_number: '',
    reference: '',
    notes: '',
  })

  const isMoMo = MOBILE_MONEY_METHODS.includes(form.method)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return }

    setLoading(true)
    try {
      const payload: any = {
        order_id: orderId,
        customer_id: customerId,
        amount,
        payment_type: form.payment_type,
        method: form.method,
        reference: form.reference || null,
        notes: form.notes || null,
      }
      if (invoiceId) payload.invoice_id = invoiceId
      if (isMoMo && form.mobile_number) payload.mobile_number = form.mobile_number

      const { error: insertError } = await supabase.from('payments').insert(payload)
      if (insertError) throw insertError

      // Auto-confirm order when 50% deposit is reached
      if (orderStatus === 'draft' && orderTotal > 0) {
        const newAmountPaid = (orderTotal - balanceDue) + amount
        if (newAmountPaid >= orderTotal * 0.5) {
          await supabase.from('orders').update({ status: 'confirmed' }).eq('id', orderId)
          success('Payment recorded — order confirmed (50% deposit reached)')
        } else {
          success('Payment recorded successfully')
        }
      } else {
        success('Payment recorded successfully')
      }
      router.push(`/orders/${orderId}`)
      router.refresh()
    } catch (err: any) {
      const msg = err.message ?? 'Failed to record payment'
      setError(msg)
      toastError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="pb-4 border-b border-gray-100">
        <p className="text-sm text-gray-500">Order <span className="font-medium text-gray-800">{orderNumber}</span></p>
        <p className="text-sm text-gray-500 mt-0.5">
          Balance due: <span className={`font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatGHS(balanceDue)}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₵) *</label>
        <input
          type="number" step="0.01" min="0.01" required
          value={form.amount}
          onChange={e => set('amount', e.target.value)}
          placeholder="0.00"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type *</label>
        <select value={form.payment_type} onChange={e => set('payment_type', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {PAYMENT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
        <select value={form.method} onChange={e => set('method', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {isMoMo && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
          <input
            type="tel"
            value={form.mobile_number}
            onChange={e => set('mobile_number', e.target.value)}
            placeholder="+233 24 000 0000"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Transaction ID</label>
        <input
          type="text"
          value={form.reference}
          onChange={e => set('reference', e.target.value)}
          placeholder="e.g. MoMo transaction ID, receipt number"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          placeholder="Any additional notes..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm">
          {loading ? 'Recording...' : 'Record Payment'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
          Cancel
        </button>
      </div>
    </form>
  )
}
