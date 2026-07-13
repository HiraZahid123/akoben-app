'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatGHS, GHANA_REGIONS, GHANA_VAT_RATE, BOOKING_DEPOSIT_THRESHOLD_PCT } from '@/lib/utils'
import { useToast } from '@/components/ui/ToastProvider'
import { Phone, Calendar } from 'lucide-react'

interface CustomerOption { id: string; full_name: string; company_name: string | null; phone: string | null; discount_pct: number }
interface ItemOption { id: string; name: string; sku: string | null; rate_daily: number; quantity_available: number; category_name: string | null }
interface LineItem { item_id: string; name: string; quantity: number; unit_rate: number; rental_days: number }

const EVENT_TYPES = [
  'wedding', 'traditional_wedding', 'outdooring', 'naming_ceremony',
  'funeral', 'corporate', 'birthday', 'graduation', 'fundraiser',
  'religious', 'festival', 'other',
]
const DELIVERY_METHODS = [
  { value: 'customer_pickup', label: 'Customer Pickup' },
  { value: 'delivery_only',   label: 'Delivery Only' },
  { value: 'setup_teardown',  label: 'Setup & Teardown' },
  { value: 'delivery_setup',  label: 'Delivery + Setup' },
]

interface InitialOrderData {
  id: string
  customer_id: string
  event_name: string
  event_type: string
  event_date: string | null
  pickup_date: string | null
  return_date: string | null
  delivery_method: string
  venue_name: string | null
  venue_address: string | null
  venue_region: string | null
  delivery_fee: number
  setup_fee: number
  security_deposit: number
  additional_charges_description: string | null
  additional_charges_amount: number
  discount_pct: number
  internal_notes: string | null
  customer_notes: string | null
  order_items: { item_id: string; quantity: number; unit_rate: number; rental_days: number; inventory_items: { name: string } | null }[]
}

export default function CreateOrderForm({ customers, inventoryItems, initialData }: { customers: CustomerOption[]; inventoryItems: ItemOption[]; initialData?: InitialOrderData }) {
  const editMode = !!initialData
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [customerId, setCustomerId] = useState(initialData?.customer_id ?? '')
  const [eventName, setEventName] = useState(initialData?.event_name ?? '')
  const [eventType, setEventType] = useState(initialData?.event_type ?? 'other')
  const [eventDate, setEventDate] = useState(initialData?.event_date ?? '')
  const [pickupDate, setPickupDate] = useState(initialData?.pickup_date?.slice(0, 16) ?? '')
  const [returnDate, setReturnDate] = useState(initialData?.return_date?.slice(0, 16) ?? '')
  const [deliveryMethod, setDeliveryMethod] = useState(initialData?.delivery_method ?? 'customer_pickup')
  const [venueName, setVenueName] = useState(initialData?.venue_name ?? '')
  const [venueAddress, setVenueAddress] = useState(initialData?.venue_address ?? '')
  const [venueRegion, setVenueRegion] = useState(initialData?.venue_region ?? '')
  const [deliveryFee, setDeliveryFee] = useState(String(initialData?.delivery_fee ?? '0'))
  const [setupFee, setSetupFee] = useState(String(initialData?.setup_fee ?? '0'))
  const [securityDeposit, setSecurityDeposit] = useState(String(initialData?.security_deposit ?? '0'))
  const [additionalChargesDescription, setAdditionalChargesDescription] = useState(initialData?.additional_charges_description ?? '')
  const [additionalChargesAmount, setAdditionalChargesAmount] = useState(String(initialData?.additional_charges_amount ?? '0'))
  const [discountPct, setDiscountPct] = useState(String(initialData?.discount_pct ?? '0'))
  const [internalNotes, setInternalNotes] = useState(initialData?.internal_notes ?? '')
  const [customerNotes, setCustomerNotes] = useState(initialData?.customer_notes ?? '')

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.order_items?.map(oi => ({
      item_id: oi.item_id,
      name: (oi.inventory_items as any)?.name ?? oi.item_id,
      quantity: oi.quantity,
      unit_rate: oi.unit_rate,
      rental_days: oi.rental_days,
    })) ?? []
  )
  const [itemSearch, setItemSearch] = useState('')

  const selectedCustomer = customers.find(c => c.id === customerId)

  // Auto-calculate rental days from dates
  const rentalDays = useMemo(() => {
    if (!pickupDate || !returnDate) return 1
    const diff = Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(1, diff)
  }, [pickupDate, returnDate])

  // Totals
  const subtotal = lineItems.reduce((sum, li) => sum + li.unit_rate * li.quantity * li.rental_days, 0)
  const discountAmount = Math.round(subtotal * parseFloat(discountPct || '0') / 100 * 100) / 100
  const dFee = parseFloat(deliveryFee || '0')
  const sFee = parseFloat(setupFee || '0')
  const taxable = subtotal - discountAmount + dFee + sFee
  const taxAmount = Math.round(taxable * GHANA_VAT_RATE / 100 * 100) / 100
  const secDeposit = parseFloat(securityDeposit || '0')
  const addCharges = parseFloat(additionalChargesAmount || '0')
  const total = taxable + taxAmount + secDeposit + addCharges
  const depositRequired = Math.round(total * BOOKING_DEPOSIT_THRESHOLD_PCT / 100 * 100) / 100

  function addItem(item: ItemOption) {
    if (lineItems.find(li => li.item_id === item.id)) return
    setLineItems(prev => [...prev, {
      item_id: item.id,
      name: item.name,
      quantity: 1,
      unit_rate: item.rate_daily,
      rental_days: rentalDays,
    }])
    setItemSearch('')
  }

  function updateLine(idx: number, field: keyof LineItem, value: string | number) {
    setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, [field]: value } : li))
  }

  function removeLine(idx: number) {
    setLineItems(prev => prev.filter((_, i) => i !== idx))
  }

  const filteredItems = inventoryItems.filter(i =>
    i.quantity_available > 0 &&
    !lineItems.find(li => li.item_id === i.id) &&
    (i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
     (i.sku ?? '').toLowerCase().includes(itemSearch.toLowerCase()) ||
     (i.category_name ?? '').toLowerCase().includes(itemSearch.toLowerCase()))
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) { setError('Please select a customer'); return }
    if (lineItems.length === 0) { setError('Please add at least one item'); return }
    setSaving(true)
    setError('')

    const orderPayload = {
      customer_id:     customerId,
      event_name:      eventName,
      event_type:      eventType as any,
      event_date:      eventDate || null,
      pickup_date:     pickupDate,
      return_date:     returnDate,
      delivery_method: deliveryMethod as any,
      venue_name:      venueName || null,
      venue_address:   venueAddress || null,
      venue_region:    (venueRegion as any) || null,
      delivery_fee:    dFee,
      setup_fee:       sFee,
      security_deposit: secDeposit,
      additional_charges_description: additionalChargesDescription || null,
      additional_charges_amount: addCharges,
      subtotal:        subtotal,
      discount_pct:    parseFloat(discountPct) || 0,
      discount_amount: discountAmount,
      tax_rate:        GHANA_VAT_RATE,
      tax_amount:      taxAmount,
      total:           total,
      amount_paid:     0,
      balance_due:     total,
      deposit_required: depositRequired,
      internal_notes:  internalNotes || null,
      customer_notes:  customerNotes || null,
    }

    let orderId: string
    if (editMode) {
      const { error: oErr } = await supabase.from('orders').update(orderPayload).eq('id', initialData!.id)
      if (oErr) { setError(oErr.message); toastError(oErr.message); setSaving(false); return }
      orderId = initialData!.id
      await supabase.from('order_items').delete().eq('order_id', orderId)
    } else {
      const { data: order, error: oErr } = await supabase.from('orders').insert({ ...orderPayload, status: 'confirmed', order_number: '' }).select().single()
      if (oErr || !order) { const msg = oErr?.message ?? 'Failed to create order'; setError(msg); toastError(msg); setSaving(false); return }
      orderId = order.id
    }

    const { error: itemsErr } = await supabase.from('order_items').insert(
      lineItems.map(li => ({
        order_id: orderId, item_id: li.item_id,
        quantity: li.quantity, unit_rate: li.unit_rate,
        rental_days: li.rental_days, line_total: li.unit_rate * li.quantity * li.rental_days,
      }))
    )
    if (itemsErr) { setError(itemsErr.message); toastError(itemsErr.message); setSaving(false); return }

    // Sync linked invoice totals when editing
    if (editMode) {
      const { data: inv } = await supabase.from('invoices').select('id, amount_paid').eq('order_id', orderId).limit(1).maybeSingle()
      if (inv) {
        const amtPaid = inv.amount_paid ?? 0
        await supabase.from('invoices').update({
          subtotal,
          delivery_fee: dFee,
          setup_fee: sFee,
          security_deposit: secDeposit,
          additional_charges_description: additionalChargesDescription || null,
          additional_charges_amount: addCharges,
          tax_amount: taxAmount,
          total,
          balance_due: Math.max(0, total - amtPaid),
        }).eq('id', inv.id)
      }
    }

    success(editMode ? 'Order updated successfully' : 'Order created successfully')
    router.push(`/orders/${orderId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-2 space-y-5">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Customer</h2>
            <select required value={customerId} onChange={e => setCustomerId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.full_name}{c.company_name ? ` — ${c.company_name}` : ''}
                </option>
              ))}
            </select>
            {selectedCustomer?.phone && (
              <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={11} /> {selectedCustomer.phone}</p>
            )}
          </div>

          {/* Event details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Event Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                <input required value={eventName} onChange={e => setEventName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Mensah Wedding Reception" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select value={eventType} onChange={e => setEventType(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {EVENT_TYPES.map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
                <input required type="datetime-local" value={pickupDate} onChange={e => setPickupDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Date *</label>
                <input required type="datetime-local" value={returnDate} onChange={e => setReturnDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {rentalDays > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-blue-600 font-medium flex items-center gap-1"><Calendar size={12} /> {rentalDays} rental day{rentalDays !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Delivery</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
                <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {DELIVERY_METHODS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              {deliveryMethod !== 'customer_pickup' && <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                  <input value={venueName} onChange={e => setVenueName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Coconut Grove Beach Hotel" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Region</label>
                  <select value={venueRegion} onChange={e => setVenueRegion(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select region</option>
                    {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Address</label>
                  <input value={venueAddress} onChange={e => setVenueAddress(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (₵)</label>
                  <input type="number" min="0" step="0.01" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drop Off / Breakdown Fee (₵)</label>
                  <input type="number" min="0" step="0.01" value={setupFee} onChange={e => setSetupFee(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (₵)</label>
                  <input type="number" min="0" step="0.01" value={securityDeposit} onChange={e => setSecurityDeposit(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </>}
            </div>
          </div>

          {/* Additional Charges */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Additional Charges</h2>
            <p className="text-xs text-gray-400 -mt-2">For unplanned extra charges, e.g. a late return fee.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={additionalChargesDescription} onChange={e => setAdditionalChargesDescription(e.target.value)}
                  placeholder="e.g. Late return fee"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₵)</label>
                <input type="number" min="0" step="0.01" value={additionalChargesAmount} onChange={e => setAdditionalChargesAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Rental Items</h2>

            {/* Item search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search and add items..."
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {itemSearch && filteredItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-56 overflow-y-auto">
                  {filteredItems.slice(0, 8).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addItem(item)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 text-left text-sm"
                    >
                      <div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                        {item.sku && <span className="text-gray-400 ml-2 text-xs">{item.sku}</span>}
                        <span className="text-gray-400 ml-2 text-xs">{item.category_name}</span>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-blue-600 font-medium">{formatGHS(item.rate_daily)}/day</div>
                        <div className="text-xs text-gray-400">{item.quantity_available} avail.</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Line items */}
            {lineItems.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-2 font-medium text-gray-600">Item</th>
                    <th className="pb-2 font-medium text-gray-600 text-center w-20">Qty</th>
                    <th className="pb-2 font-medium text-gray-600 text-center w-24">Days</th>
                    <th className="pb-2 font-medium text-gray-600 text-right w-28">Rate/Day</th>
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
                      <td className="py-2 text-right text-gray-700">{formatGHS(li.unit_rate)}</td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        {formatGHS(li.unit_rate * li.quantity * li.rental_days)}
                      </td>
                      <td className="py-2 text-center">
                        <button type="button" onClick={() => removeLine(idx)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {lineItems.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No items added yet. Search above to add.</p>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Notes</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Notes (visible on invoice)</label>
              <textarea rows={2} value={customerNotes} onChange={e => setCustomerNotes(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
              <textarea rows={2} value={internalNotes} onChange={e => setInternalNotes(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
        </div>

        {/* Right column — Order summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 sticky top-6">
            <h2 className="font-semibold text-gray-800">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatGHS(subtotal)}</span>
              </div>
              {parseFloat(discountPct) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({discountPct}%)</span>
                  <span>−{formatGHS(discountAmount)}</span>
                </div>
              )}
              {dFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{formatGHS(dFee)}</span>
                </div>
              )}
              {sFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Drop Off / Breakdown Fee</span>
                  <span>{formatGHS(sFee)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>VAT (15%)</span>
                  <span>{formatGHS(taxAmount)}</span>
                </div>
              )}
              {secDeposit > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Security Deposit</span>
                  <span>{formatGHS(secDeposit)}</span>
                </div>
              )}
              {addCharges > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>{additionalChargesDescription || 'Additional Charges'}</span>
                  <span>{formatGHS(addCharges)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{formatGHS(total)}</span>
              </div>
              <div className="flex justify-between text-blue-600 text-xs pt-1">
                <span>Deposit required ({BOOKING_DEPOSIT_THRESHOLD_PCT}%)</span>
                <span>{formatGHS(depositRequired)}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
                <input type="number" min="0" max="100" step="0.5" value={discountPct}
                  onChange={e => setDiscountPct(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <button type="submit" disabled={saving || lineItems.length === 0}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2">
              {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Create Order'}
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
