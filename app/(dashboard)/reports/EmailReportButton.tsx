'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'

interface Props {
  title: string
  subtitle: string
  columns: string[]
  rows: string[][]
}

export default function EmailReportButton({ title, subtitle, columns, rows }: Props) {
  const { success, error: toastError } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    const to = prompt('Send this report as a PDF to which email address?')
    if (!to) return
    setLoading(true)
    try {
      const res = await fetch('/api/reports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, title, subtitle, columns, rows }),
      })
      const data = await res.json()
      if (!res.ok) { toastError(data.error ?? 'Failed to send report'); return }
      success(`Report emailed to ${to}`)
    } catch {
      toastError('Failed to send report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleSend} disabled={loading || rows.length === 0}
      className="print:hidden px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
      {loading ? 'Sending…' : '📧 Email PDF'}
    </button>
  )
}
