'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/ToastProvider'
import { CheckCircle2, Check, AlertTriangle, Wrench, ScanLine } from 'lucide-react'

interface Unit { id: string; unit_number: string | null; barcode: string | null; status: string; condition: string }
interface OrderItem {
  id: string
  quantity: number
  inventory_items: { id: string; name: string; sku: string | null; inventory_units: Unit[] } | null
}

interface Props {
  order: any
  items: OrderItem[]
  invoiceNumber: string | null
  checkedOutUnitIds: string[]
}

export default function ReturnOrderSheet({ order, items, invoiceNumber, checkedOutUnitIds }: Props) {
  const router = useRouter()
  const { success, error: toastError } = useToast()

  const checkedOutSet = new Set(checkedOutUnitIds)

  // scannedIn: itemId → array of unit IDs scanned back in
  const [scannedIn, setScannedIn] = useState<Record<string, string[]>>({})
  const [conditions, setConditions] = useState<Record<string, 'good' | 'damaged' | 'maintenance'>>({})
  const [scanInput, setScanInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Flat map: barcode/unit_number → unit + item (only checked-out units)
  const unitMap: Record<string, { unit: Unit; item: OrderItem }> = {}
  for (const item of items) {
    for (const unit of item.inventory_items?.inventory_units ?? []) {
      if (!checkedOutSet.has(unit.id)) continue
      if (unit.barcode) unitMap[unit.barcode] = { unit, item }
      if (unit.unit_number) unitMap[unit.unit_number] = { unit, item }
    }
  }

  function handleScan(e: React.FormEvent) {
    e.preventDefault()
    const code = scanInput.trim()
    if (!code) return
    const found = unitMap[code]
    if (!found) { toastError(`No checked-out unit found for: ${code}`); setScanInput(''); return }
    const { unit, item } = found
    const already = scannedIn[item.id] ?? []
    if (already.includes(unit.id)) { toastError('Already scanned in'); setScanInput(''); return }
    setScannedIn(prev => ({ ...prev, [item.id]: [...(prev[item.id] ?? []), unit.id] }))
    setScanInput('')
    inputRef.current?.focus()
  }

  function manualSetQty(itemId: string, qty: number) {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const outUnits = (item.inventory_items?.inventory_units ?? []).filter(u => checkedOutSet.has(u.id)).slice(0, qty)
    setScannedIn(prev => ({ ...prev, [itemId]: outUnits.map(u => u.id) }))
  }

  function setCondition(unitId: string, cond: 'good' | 'damaged' | 'maintenance') {
    setConditions(prev => ({ ...prev, [unitId]: cond }))
  }

  async function confirmReturn() {
    const totalIn = Object.values(scannedIn).reduce((s, arr) => s + arr.length, 0)
    if (totalIn === 0) { toastError('No items scanned in yet'); return }
    setLoading(true)
    try {
      for (const item of items) {
        const unitIds = scannedIn[item.id] ?? []
        for (const unitId of unitIds) {
          const unit = (item.inventory_items?.inventory_units ?? []).find(u => u.id === unitId)
          const cond = conditions[unitId] ?? 'good'
          const newStatus = cond === 'good' ? 'available' : 'maintenance'
          const newCondition = cond === 'good' ? 'good' : cond

          await supabase.from('inventory_units').update({
            status: newStatus,
            condition: newCondition,
          }).eq('id', unitId)

          await supabase.from('barcode_scan_log').insert({
            barcode: unit?.barcode ?? unit?.unit_number ?? unitId,
            unit_id: unitId,
            item_id: item.inventory_items?.id,
            action: 'checkin',
            result: `return_order:${order.order_number}:${cond === 'good' ? 'success' : cond}`,
          })
        }
      }

      // Return fully confirmed — order is now complete
      await supabase.from('orders').update({ status: 'complete' }).eq('id', order.id)

      setSubmitted(true)
      success(`Return confirmed — ${totalIn} items checked back in for ${order.order_number}`)
      setTimeout(() => router.push('/delivery'), 1500)
    } catch (err: any) {
      toastError(err.message ?? 'Failed to confirm return')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center max-w-2xl">
        <CheckCircle2 size={40} className="mx-auto mb-3 text-green-500" strokeWidth={1.5} />
        <h2 className="text-xl font-bold text-gray-900 mb-1">Return Confirmed</h2>
        <p className="text-gray-500 text-sm">Items restored to inventory. Redirecting to Delivery log...</p>
      </div>
    )
  }

  const totalOut = checkedOutUnitIds.length
  const totalIn = Object.values(scannedIn).reduce((s, arr) => s + arr.length, 0)

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-6 text-sm">
        <div><span className="text-gray-500">Order #</span><span className="font-bold text-gray-900 ml-2">{order.order_number}</span></div>
        <div><span className="text-gray-500">Invoice #</span><span className="font-bold text-gray-900 ml-2">{invoiceNumber ?? '—'}</span></div>
        <div><span className="text-gray-500">Customer</span><span className="font-medium text-gray-800 ml-2">{order.customer_name}</span></div>
        <div><span className="text-gray-500">Event</span><span className="font-medium text-gray-800 ml-2">{order.event_name}</span></div>
      </div>

      {/* Scanner input */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Scan Returning Item Barcode</p>
        <form onSubmit={handleScan} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={scanInput}
            onChange={e => setScanInput(e.target.value)}
            autoFocus
            placeholder="Scan or type barcode / unit number..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
            <ScanLine size={14} /> Scan
          </button>
        </form>
      </div>

      {/* Return table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="font-semibold text-gray-800">Items to Return</span>
          <span className="text-sm text-gray-500">{totalIn} / {totalOut} checked in</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left bg-gray-50">
              <th className="px-5 py-3 font-medium text-gray-600">Item</th>
              <th className="px-5 py-3 font-medium text-gray-600">SKU / Barcode</th>
              <th className="px-5 py-3 font-medium text-gray-600 text-center">Checked Out Qty</th>
              <th className="px-5 py-3 font-medium text-gray-600 text-center">Scanned Check-in Qty</th>
              <th className="px-5 py-3 font-medium text-gray-600">Condition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(item => {
              const outUnits = (item.inventory_items?.inventory_units ?? []).filter(u => checkedOutSet.has(u.id))
              if (outUnits.length === 0) return null
              const inCount = (scannedIn[item.id] ?? []).length
              const done = inCount >= outUnits.length
              const scannedUnitIds = scannedIn[item.id] ?? []
              return (
                <tr key={item.id} className={done ? 'bg-green-50' : ''}>
                  <td className="px-5 py-3 font-medium text-gray-900">{item.inventory_items?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    <div>{item.inventory_items?.sku ?? '—'}</div>
                    <div className="text-gray-300 mt-0.5">{outUnits.map(u => u.barcode ?? u.unit_number ?? '—').join(', ')}</div>
                  </td>
                  <td className="px-5 py-3 text-center text-gray-700">{outUnits.length}</td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => manualSetQty(item.id, Math.max(0, inCount - 1))}
                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">−</button>
                      <span className={`w-8 text-center font-bold ${done ? 'text-green-600' : inCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {inCount}
                      </span>
                      <button onClick={() => manualSetQty(item.id, Math.min(outUnits.length, inCount + 1))}
                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">+</button>
                      {done && <Check size={14} className="text-green-500" />}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {scannedUnitIds.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {scannedUnitIds.map(uid => {
                          const cond = conditions[uid] ?? 'good'
                          return (
                            <div key={uid} className="flex gap-1">
                              {(['good', 'damaged', 'maintenance'] as const).map(c => (
                                <button key={c} onClick={() => setCondition(uid, c)}
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                                    cond === c
                                      ? c === 'good' ? 'bg-green-500 text-white' : c === 'damaged' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}>
                                  <span className="inline-flex items-center gap-1">
                                    {c === 'good' ? <Check size={11} /> : c === 'damaged' ? <AlertTriangle size={11} /> : <Wrench size={11} />}
                                    {c === 'good' ? 'Good' : c === 'damaged' ? 'Damaged' : 'Repair'}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {totalIn === totalOut
              ? <span className="inline-flex items-center gap-1 text-green-600 font-medium"><Check size={14} /> All items accounted for</span>
              : <span className="text-amber-600">{totalOut - totalIn} item(s) still to scan</span>}
          </div>
          <button
            onClick={confirmReturn}
            disabled={loading || totalIn === 0}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors">
            {loading ? 'Processing...' : <><Check size={14} /> Confirm Return</>}
          </button>
        </div>
      </div>
    </div>
  )
}
