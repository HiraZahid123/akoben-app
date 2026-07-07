'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/ToastProvider'

export default function VoidButton({ invoiceId, amountPaid }: { invoiceId: string; amountPaid: number }) {
  const router = useRouter()
  const { success } = useToast()
  const [loading, setLoading] = useState(false)

  async function markVoid() {
    const hasPayments = amountPaid > 0
    const msg = hasPayments
      ? `Void this invoice? Payments of GHS ${amountPaid.toFixed(2)} have already been recorded — a negative balance will show in the summary. You may need to issue a refund or credit note.`
      : 'Void this invoice? It will be kept for traceability but marked as invalid.'
    if (!confirm(msg)) return
    setLoading(true)
    await (supabase.from('invoices') as any).update({ status: 'void' }).eq('id', invoiceId)
    success('Invoice marked as void')
    router.refresh()
    setLoading(false)
  }

  return (
    <button onClick={markVoid} disabled={loading}
      className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
      title="Void this invoice — kept for traceability. If payments were made, a negative balance will show.">
      {loading ? '...' : '⊘ Void'}
    </button>
  )
}
