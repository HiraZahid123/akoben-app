'use client'

interface Props {
  phone: string | null
  message: string
  label?: string
}

export default function LogWhatsAppButton({ phone, message, label = 'WhatsApp' }: Props) {
  function send() {
    if (!phone) { alert('No phone number on file to send this to'); return }
    const cleaned = phone.replace(/\D/g, '').replace(/^0/, '233')
    window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <button onClick={send}
      className="text-xs px-2.5 py-1 bg-green-100 text-green-700 font-medium rounded hover:bg-green-200 transition-colors">
      💬 {label}
    </button>
  )
}
