'use client'

import { MessageCircle } from 'lucide-react'

interface Props {
  // Kept for backwards compatibility but intentionally unused as a default —
  // this button sends to a driver/crew member, not the customer on file.
  phone?: string | null
  message: string
  label?: string
}

export default function LogWhatsAppButton({ message, label = 'WhatsApp' }: Props) {
  function send() {
    const input = prompt('Send to which driver/crew phone number? (e.g. 024 000 0000)')
    if (!input) return
    const cleaned = input.replace(/\D/g, '').replace(/^0/, '233')
    window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <button onClick={send}
      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-green-100 text-green-700 font-medium rounded hover:bg-green-200 transition-colors">
      <MessageCircle size={12} /> {label}
    </button>
  )
}
