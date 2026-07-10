'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { Mail, MessageCircle } from 'lucide-react'

interface Props {
  orderId: string
  orderNumber: string
  customerEmail: string | null
  customerPhone: string | null
}

export default function EmailContractButton({ orderId, orderNumber, customerEmail, customerPhone }: Props) {
  const { success, error: toastError } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleEmail() {
    const to = prompt('Send the contract PDF to which email address?', customerEmail ?? '')
    if (!to) return
    setLoading(true)
    try {
      const res = await fetch('/api/contracts/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, to }),
      })
      const data = await res.json()
      if (!res.ok) { toastError(data.error ?? 'Failed to send contract'); return }
      success(`Contract emailed to ${to}`)
    } catch {
      toastError('Failed to send contract')
    } finally {
      setLoading(false)
    }
  }

  function handleWhatsApp() {
    if (!customerPhone) { toastError('No phone number on file for this customer'); return }
    const phone = customerPhone.replace(/\D/g, '').replace(/^0/, '233')
    const pdfUrl = `${window.location.origin}/api/pdf/contract/${orderId}`
    const msg = `Hello, please find your rental agreement for order ${orderNumber} here: ${pdfUrl}`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <button onClick={handleEmail} disabled={loading}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {loading ? '…' : <><Mail size={12} /> Email</>}
      </button>
      <button onClick={handleWhatsApp}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors">
        <MessageCircle size={12} /> WhatsApp
      </button>
    </div>
  )
}
