'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/ToastProvider'

interface Unit { id: string; unit_number: string | null; barcode: string | null; status: string; condition: string }
interface OrderItem {
  id: string
  quantity: number
  unit_rate: number
  rental_days: number
  line_total: number
  inventory_items: { id: string; name: string; sku: string | null; inventory_units: Unit[] } | null
}

interface Props {
  order: any
  items: OrderItem[]
  invoiceNumber: string | null
}

export default function PullOrderSheet({ order, items, invoiceNumber }: Props) {
  const router = useRouter()
  const { success, error: toastError } = useToast()

  // scannedByItem: itemId → array of unit IDs scanned out
  const [scannedByItem, setScannedByItem] = useState<Record<string, string[]>>({})
  const [scanInput, setScanInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Flat map: barcode/unit_number → unit + item
  const unitMap: Record<string, { unit: Unit; item: OrderItem }> = {}
  for (const item of items) {
    for (const unit of item.inventory_items?.inventory_units ?? []) {
      if (unit.barcode) unitMap[unit.barcode] = { unit, item }
      if (unit.unit_number) unitMap[unit.unit_number] = { unit, item }
    }
  }

  function handleScan(e: React.FormEvent) {
    e.preventDefault()
    const code = scanInput.trim()
    if (!code) return
    const found = unitMap[code]
    if (!found) { toastError(`No unit found for barcode: ${code}`); setScanInput(''); return }
    const { unit, item } = found
    if (unit.status !== 'available') { toastError(`Unit ${unit.unit_number ?? code} is not available (${unit.status})`); setScanInput(''); return }
    const already = scannedByItem[item.id] ?? []
    if (already.includes(unit.id)) { toastError('Already scanned'); setScanInput(''); return }
    if (already.length >= item.quantity) { toastError(`Already scanned all ${item.quantity} units for ${item.inventory_items?.name}`); setScanInput(''); return }
    setScannedByItem(prev => ({ ...prev, [item.id]: [...(prev[item.id] ?? []), unit.id] }))
    setScanInput('')
    inputRef.current?.focus()
  }

  function manualSetQty(itemId: string, qty: number) {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const availUnits = (item.inventory_items?.inventory_units ?? []).filter(u => u.status === 'available').slice(0, qty)
    setScannedByItem(prev => ({ ...prev, [itemId]: availUnits.map(u => u.id) }))
  }

  async function confirmPull() {
    const totalScanned = Object.values(scannedByItem).reduce((s, arr) => s + arr.length, 0)
    if (totalScanned === 0) { toastError('No items scanned yet'); return }
    setLoading(true)
    try {
      for (const item of items) {
        const unitIds = scannedByItem[item.id] ?? []
        for (const unitId of unitIds) {
          const unit = (item.inventory_items?.inventory_units ?? []).find(u => u.id === unitId)
          await supabase.from('inventory_units').update({ status: 'out' }).eq('id', unitId)
          await supabase.from('barcode_scan_log').insert({
            barcode: unit?.barcode ?? unit?.unit_number ?? unitId,
            unit_id: unitId,
            item_id: item.inventory_items?.id,
            action: 'checkout',
            result: `pull_order:${order.order_number}`,
          })
        }
      }
      await supabase.from('orders').update({ status: 'active' }).eq('id', order.id)
      setSubmitted(true)
      success(`Pull order confirmed — ${totalScanned} items checked out for ${order.order_number}`)
      setTimeout(() => router.push('/delivery'), 1500)
    } catch (err: any) {
      toastError(err.message ?? 'Failed to confirm pull order')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center max-w-2xl">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Pull Order Confirmed</h2>
        <p className="text-gray-500 text-sm">Items marked as out. Redirecting to Delivery log...</p>
      </div>
    )
  }

  const totalOrdered = items.reduce((s, i) => s + i.quantity, 0)
  const totalScanned = Object.values(scannedByItem).reduce((s, arr) => s + arr.length, 0)

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-6 text-sm">
        <div><span className="text-gray-500">Order #</span><span className="font-bold text-gray-900 ml-2">{order.order_number}</span></div>
        <div><span className="text-gray-500">Invoice #</span><span className="font-bold text-gray-900 ml-2">{invoiceNumber ?? '—'}</span></div>
        <div><span className="text-gray-500">Customer</span><span className="font-medium text-gray-800 ml-2">{order.customer_name}</span></div>
        <div><span className="text-gray-500">Event</span><span className="font-medium text-gray-800 ml-2">{order.event_name}</span></div>
        <div><span className="text-gray-500">Event Date</span><span className="font-medium text-gray-800 ml-2">{order.event_date ?? '—'}</span></div>
      </div>

      {/* Barcode scanner input */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Scan Barcode / Unit Number</p>
        <form onSubmit={handleScan} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={scanInput}
            onChange={e => setScanInput(e.target.value)}
            autoFocus
            placeholder="Scan or type barcode / unit number..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            ✓ Scan
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">Or use the manual +/− buttons in the table below</p>
      </div>

      {/* Pull order table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="font-semibold text-gray-800">Items</span>
          <span className="text-sm text-gray-500">{totalScanned} / {totalOrdered} scanned</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left bg-gray-50">
              <th className="px-5 py-3 font-medium text-gray-600">Item</th>
              <th className="px-5 py-3 font-medium text-gray-600">SKU / Barcode</th>
              <th className="px-5 py-3 font-medium text-gray-600 text-center">Ordered Qty</th>
              <th className="px-5 py-3 font-medium text-gray-600 text-center">Scanned Checkout Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(item => {
              const scanned = (scannedByItem[item.id] ?? []).length
              const available = (item.inventory_items?.inventory_units ?? []).filter(u => u.status === 'available').length
              const allBarcodes = (item.inventory_items?.inventory_units ?? [])
                .filter(u => u.status === 'available')
                .map(u => u.barcode ?? u.unit_number ?? '—')
                .join(', ')
              const done = scanned >= item.quantity
              return (
                <tr key={item.id} className={done ? 'bg-green-50' : ''}>
                  <td className="px-5 py-3 font-medium text-gray-900">{item.inventory_items?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    <div>{item.inventory_items?.sku ?? '—'}</div>
                    <div className="text-gray-300 mt-0.5 truncate max-w-48" title={allBarcodes}>{allBarcodes}</div>
                  </td>
                  <td className="px-5 py-3 text-center text-gray-700">{item.quantity}</td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => manualSetQty(item.id, Math.max(0, scanned - 1))}
                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm">−</button>
                      <span className={`w-8 text-center font-bold ${done ? 'text-green-600' : scanned > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {scanned}
                      </span>
                      <button onClick={() => manualSetQty(item.id, Math.min(available, scanned + 1))}
                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm">+</button>
                      {done && <span className="text-green-500 text-xs">✓</span>}
                    </div>
                    {available < item.quantity && (
                      <div className="text-xs text-amber-600 mt-0.5">Only {available} available</div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-500">
            {totalScanned === totalOrdered
              ? <span className="text-green-600 font-medium">✓ All items accounted for</span>
              : <span className="text-amber-600">{totalOrdered - totalScanned} item(s) still need scanning</span>}
          </div>
          <button
            onClick={confirmPull}
            disabled={loading || totalScanned === 0}
            className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
            {loading ? 'Processing...' : '✓ Confirm Pull Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
