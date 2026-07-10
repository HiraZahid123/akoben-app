'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/ToastProvider'
import { BOOKING_DEPOSIT_THRESHOLD_PCT } from '@/lib/utils'
import { CalendarCheck, AlertTriangle, Package, PackageCheck, ShieldAlert } from 'lucide-react'

interface Props {
  invoiceId: string
  orderId: string
  orderNumber: string
  invoiceNumber: string
  customerName: string
  total: number
  isBooked?: boolean
  amountPaid?: number
  currentStatus: string
  bookedViaOverride?: boolean
}

export default function InvoiceBookingActions({ invoiceId, orderId, orderNumber, invoiceNumber, customerName, total, isBooked, amountPaid, currentStatus, bookedViaOverride }: Props) {
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [loading, setLoading] = useState(false)
  const [booked, setBooked] = useState(isBooked ?? false)
  const [overrideFlag, setOverrideFlag] = useState(bookedViaOverride ?? false)
  const [canOverride, setCanOverride] = useState(false)
  const [staffName, setStaffName] = useState('Unknown staff')

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => {
      setCanOverride(!!d.canOverrideBookingRelease)
      setStaffName(d.fullName ?? 'Unknown staff')
    }).catch(() => {})
  }, [])

  const paid = amountPaid ?? 0
  const pctPaid = total > 0 ? (paid / total) * 100 : 0
  const depositMet = pctPaid >= BOOKING_DEPOSIT_THRESHOLD_PCT

  // Auto-clears once the customer's payment reaches the threshold
  const showOverrideBadge = overrideFlag && !depositMet

  // Fire-and-forget — do not await at the call site, so the Save action isn't blocked on the email round-trip
  function notifyOverride(action: string) {
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'irenebaidoo.agyapong@gmail.com',
        subject: `Manager Override Used — ${orderNumber}`,
        html: `<p>A manager override was used on <strong>${orderNumber}</strong> (invoice ${invoiceNumber}).</p>
          <p><strong>Action:</strong> ${action}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Order total:</strong> GHS ${total.toFixed(2)}</p>
          <p><strong>Amount paid:</strong> GHS ${paid.toFixed(2)} (${pctPaid.toFixed(1)}%)</p>
          <p><strong>Authorized by:</strong> ${staffName}</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>`,
      }),
    }).catch(() => {})
  }

  async function bookEvent() {
    if (!confirm('Book this event? This will register it on the calendar and activate the Pull Order.')) return
    setLoading(true)
    try {
      await supabase.from('orders').update({ is_booked: true, booked_at: new Date().toISOString(), status: 'confirmed' }).eq('id', orderId)
      setBooked(true)
      success('Event booked — now appears on the Calendar. Pull Order is now active.')
      router.refresh()
    } catch (err: any) {
      toastError(err.message ?? 'Failed to book event')
    } finally {
      setLoading(false)
    }
  }

  async function bookEventWithOverride() {
    if (!confirm(`Override the ${BOOKING_DEPOSIT_THRESHOLD_PCT}% deposit requirement and book this event now? Only GHS ${paid.toFixed(2)} of GHS ${total.toFixed(2)} has been paid. This will notify Irene by email.`)) return
    setLoading(true)
    try {
      await supabase.from('orders').update({ is_booked: true, booked_at: new Date().toISOString(), status: 'confirmed', booked_via_override: true }).eq('id', orderId)
      notifyOverride(`Booking confirmed with only GHS ${paid.toFixed(2)} of GHS ${total.toFixed(2)} paid (${pctPaid.toFixed(1)}%, below the ${BOOKING_DEPOSIT_THRESHOLD_PCT}% requirement)`)
      setBooked(true)
      setOverrideFlag(true)
      success('Event booked via manager override — Irene has been notified by email.')
      router.refresh()
    } catch (err: any) {
      toastError(err.message ?? 'Failed to book event')
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus === 'void') return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
      <h3 className="font-semibold text-gray-800 mb-1">Booking & Delivery</h3>

      {showOverrideBadge && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium rounded-lg px-3 py-2 mb-1">
          <ShieldAlert size={14} className="shrink-0" />
          Manager Override — Booking confirmed below required payment.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {!booked && depositMet && (
          <button onClick={bookEvent} disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? '...' : <><CalendarCheck size={14} /> Book Event</>}
          </button>
        )}
        {!booked && !depositMet && canOverride && (
          <button onClick={bookEventWithOverride} disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
            title={`Manager/Admin override — books the event despite less than ${BOOKING_DEPOSIT_THRESHOLD_PCT}% deposit. Sends an email notification to Irene.`}>
            {loading ? '...' : <><AlertTriangle size={14} /> Override {BOOKING_DEPOSIT_THRESHOLD_PCT}% & Book</>}
          </button>
        )}
        {!booked && !depositMet && !canOverride && (
          <p className="text-xs text-gray-400">Book Event unlocks once {BOOKING_DEPOSIT_THRESHOLD_PCT}% deposit is paid.</p>
        )}
        {booked && (
          <>
            <a href={`/delivery/pull/${orderId}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors text-center">
              <Package size={14} /> Pull Order
            </a>
            <a href={`/delivery/return/${orderId}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors text-center">
              <PackageCheck size={14} /> Return Order
            </a>
          </>
        )}
      </div>
    </div>
  )
}
