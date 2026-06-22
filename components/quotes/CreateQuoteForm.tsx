'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatGHS, GHANA_VAT_RATE } from '@/lib/utils'
import { useToast } from '@/components/ui/ToastProvider'

interface CustomerOption { id: string; full_name: string; company_name: string | null; email: string | null; phone: string | null; discount_pct: number }
interface ItemOption { id: string; name: string; sku: string | null; rate_daily: number; quantity_available: number; category_name: string | null }
interface LineItem { item_id: string; name: string; quantity: number; unit_rate: number; rental_days: number }

const EVENT_TYPES = ['wedding','traditional_wedding','outdooring','naming_ceremony','funeral','corporate','birthday','graduation','fundraiser','religious','festival','other']

interface InitialQuoteData {
  id: string
  customer_id: string
  event_name: string
  event_type: string
  event_date: string | null
  pickup_date: string | null
  return_date: string | null
  expires_at: string | null
  delivery_method: string
  venue_address: string | null
  delivery_fee: number
  discount_pct: number
  notes: string | null
  quote_items: { item_id: string; quantity: number; unit_rate: number; rental_days: number; inventory_items: { name: string } | null }[]
}

export default function CreateQuoteForm({ customers, inventoryItems, initialData }: { customers: CustomerOption[]; inventoryItems: ItemOption[]; initialData?: InitialQuoteData }) {
  const editMode = !!initialData
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [customerId, setCustomerId] = useState(initialData?.customer_id ?? '')
  const [eventName, setEventName] = useState(initialData?.event_name ?? '')
  const [eventType, setEventType] = useState(initialData?.event_type ?? 'other')
  const [eventDate, setEventDate] = useState(initialData?.event_date ?? '')
  const [pickupDate, setPickupDate] = useState(initialData?.pickup_date?.slice(0, 16) ?? '')
  const [returnDate, setReturnDate] = useState(initialData?.return_date?.slice(0, 16) ?? '')
  const [expiresAt, setExpiresAt] = useState(initialData?.expires_at?.slice(0, 10) ?? '')
  const [deliveryMethod, setDeliveryMethod] = useState(initialData?.delivery_method ?? 'customer_pickup')
  const [venueAddress, setVenueAddress] = useState(initialData?.venue_address ?? '')
  const [deliveryFee, setDeliveryFee] = useState(String(initialData?.delivery_fee ?? '0'))
  const [discountPct, setDiscountPct] = useState(String(initialData?.discount_pct ?? '0'))
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.quote_items?.map(qi => ({
      item_id: qi.item_id,
      name: (qi.inventory_items as any)?.name ?? qi.item_id,
      quantity: qi.quantity,
      unit_rate: qi.unit_rate,
      rental_days: qi.rental_days,
    })) ?? []
  )
  const [itemSearch, setItemSearch] = useState('')

  const rentalDays = useMemo(() => {
    if (!pickupDate || !returnDate) return 1
    return Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / 86400000))
  }, [pickupDate, returnDate])

  const subtotal = lineItems.reduce((s, li) => s + li.unit_rate * li.quantity * li.rental_days, 0)
  const discountAmount = Math.round(subtotal * parseFloat(discountPct || '0') / 100 * 100) / 100
  const dFee = parseFloat(deliveryFee || '0')
  const taxable = subtotal - discountAmount + dFee
  const taxAmount = Math.round(taxable * GHANA_VAT_RATE / 100 * 100) / 100
  const total = taxable + taxAmount

  const filteredItems = inventoryItems.filter(i =>
    i.quantity_available > 0 &&
    !lineItems.find(li => li.item_id === i.id) &&
    (i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
     (i.sku ?? '').toLowerCase().includes(itemSearch.toLowerCase()))
  )

  function addItem(item: ItemOption) {
    setLineItems(prev => [...prev, { item_id: item.id, name: item.name, quantity: 1, unit_rate: item.rate_daily, rental_days: rentalDays }])
    setItemSearch('')
  }

  function updateLine(idx: number, field: keyof LineItem, value: string | number) {
    setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, [field]: value } : li))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId || lineItems.length === 0) { setError('Select a customer and add at least one item'); return }
    setSaving(true); setError('')

    const quotePayload = {
      customer_id:     customerId,
      event_name:      eventName,
      event_type:      eventType as any,
      event_date:      eventDate || null,
      pickup_date:     pickupDate || null,
      return_date:     returnDate || null,
      expires_at:      expiresAt || null,
      delivery_method: deliveryMethod as any,
      venue_address:   venueAddress || null,
      delivery_fee:    dFee,
      discount_pct:    parseFloat(discountPct) || 0,
      tax_rate:        GHANA_VAT_RATE,
      notes:           notes || null,
    }

    let quoteId: string
    if (editMode) {
      const { error: qErr } = await supabase.from('quotes').update(quotePayload).eq('id', initialData!.id)
      if (qErr) { setError(qErr.message); toastError(qErr.message); setSaving(false); return }
      quoteId = initialData!.id
      await supabase.from('quote_items').delete().eq('quote_id', quoteId)
    } else {
      const { data: quote, error: qErr } = await supabase.from('quotes').insert({ ...quotePayload, status: 'draft', quote_number: '' }).select().single()
      if (qErr || !quote) { const msg = qErr?.message ?? 'Failed to create quote'; setError(msg); toastError(msg); setSaving(false); return }
      quoteId = quote.id
    }

    await supabase.from('quote_items').insert(
      lineItems.map(li => ({
        quote_id: quoteId, item_id: li.item_id,
        quantity: li.quantity, unit_rate: li.unit_rate,
        rental_days: li.rental_days, line_total: li.unit_rate * li.quantity * li.rental_days,
      }))
    )

    success(editMode ? 'Quote updated successfully' : 'Quote created successfully')
    router.push(`/quotes/${quoteId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">Customer</h2>
            <select required value={customerId} onChange={e => setCustomerId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}{c.company_name ? ` — ${c.company_name}` : ''}</option>)}
            </select>
            {customerId && (
              <p className="text-xs text-gray-400">
                {customers.find(c => c.id === customerId)?.email}
              </p>
            )}
          </div>

          {/* Event */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Event Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                <input required value={eventName} onChange={e => setEventName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Asante Outdoor Wedding" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select value={eventType} onChange={e => setEventType(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                <input type="datetime-local" value={pickupDate} onChange={e => setPickupDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                <input type="datetime-local" value={returnDate} onChange={e => setReturnDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quote Expires</label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (₵)</label>
                <input type="number" min="0" step="0.01" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (included in quote email)</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Items</h2>
            <div className="relative">
              <input type="text" placeholder="Search and add items..." value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {itemSearch && filteredItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-52 overflow-y-auto">
                  {filteredItems.slice(0, 8).map(item => (
                    <button key={item.id} type="button" onClick={() => addItem(item)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 text-sm text-left">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <span className="text-blue-600 font-medium shrink-0 ml-4">{formatGHS(item.rate_daily)}/day</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {lineItems.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-2 font-medium text-gray-600">Item</th>
                    <th className="pb-2 font-medium text-gray-600 text-center w-20">Qty</th>
                    <th className="pb-2 font-medium text-gray-600 text-center w-20">Days</th>
                    <th className="pb-2 font-medium text-gray-600 text-right w-28">Total</th>
                    <th className="pb-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lineItems.map((li, idx) => (
                    <tr key={li.item_id}>
                      <td className="py-2 font-medium text-gray-900">{li.name}</td>
                      <td className="py-2 text-center">
                        <input type="number" min="1" value={li.quantity}
                          onChange={e => updateLine(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="py-2 text-center">
                        <input type="number" min="1" value={li.rental_days}
                          onChange={e => updateLine(idx, 'rental_days', parseInt(e.target.value) || 1)}
                          className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="py-2 text-right font-medium">{formatGHS(li.unit_rate * li.quantity * li.rental_days)}</td>
                      <td className="py-2 text-center">
                        <button type="button" onClick={() => setLineItems(p => p.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No items added yet.</p>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 sticky top-6">
            <h2 className="font-semibold text-gray-800">Quote Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatGHS(subtotal)}</span></div>
              {parseFloat(discountPct) > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount ({discountPct}%)</span><span>−{formatGHS(discountAmount)}</span></div>
              )}
              {dFee > 0 && <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{formatGHS(dFee)}</span></div>}
              {taxAmount > 0 && <div className="flex justify-between text-gray-600"><span>VAT (15%)</span><span>{formatGHS(taxAmount)}</span></div>}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                <span>Total</span><span>{formatGHS(total)}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
              <input type="number" min="0" max="100" step="0.5" value={discountPct}
                onChange={e => setDiscountPct(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={saving || lineItems.length === 0}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Create Quote'}
            </button>
            <button type="button" onClick={() => router.back()}
              className="w-full text-gray-500 py-2 text-sm hover:text-gray-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
