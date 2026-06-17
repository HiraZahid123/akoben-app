'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/ToastProvider'
import type { InventoryCategory, InventoryItem } from '@/types/database'

interface Props {
  categories: InventoryCategory[]
  item?: Partial<InventoryItem>
  mode: 'create' | 'edit'
}

const CONDITIONS = ['excellent', 'good', 'fair', 'maintenance', 'retired'] as const

export default function InventoryForm({ categories, item, mode }: Props) {
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name:             item?.name ?? '',
    sku:              item?.sku ?? '',
    description:      item?.description ?? '',
    category_id:      item?.category_id ?? '',
    rate_daily:       item?.rate_daily?.toString() ?? '',
    rate_weekend:     item?.rate_weekend?.toString() ?? '',
    rate_weekly:      item?.rate_weekly?.toString() ?? '',
    replacement_cost: item?.replacement_cost?.toString() ?? '',
    quantity_total:   item?.quantity_total?.toString() ?? '1',
    condition:        item?.condition ?? 'good',
    weight_kg:        item?.weight_kg?.toString() ?? '',
    dimensions:       item?.dimensions ?? '',
    setup_time_min:   item?.setup_time_min?.toString() ?? '0',
    notes:            item?.notes ?? '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name:             form.name,
      sku:              form.sku || null,
      description:      form.description || null,
      category_id:      form.category_id || null,
      rate_daily:       parseFloat(form.rate_daily) || 0,
      rate_weekend:     form.rate_weekend ? parseFloat(form.rate_weekend) : null,
      rate_weekly:      form.rate_weekly ? parseFloat(form.rate_weekly) : null,
      replacement_cost: form.replacement_cost ? parseFloat(form.replacement_cost) : null,
      quantity_total:   parseInt(form.quantity_total) || 1,
      quantity_available: parseInt(form.quantity_total) || 1,
      condition:        form.condition,
      weight_kg:        form.weight_kg ? parseFloat(form.weight_kg) : null,
      dimensions:       form.dimensions || null,
      setup_time_min:   parseInt(form.setup_time_min) || 0,
      notes:            form.notes || null,
    }

    let err
    if (mode === 'create') {
      const res = await supabase.from('inventory_items').insert(payload)
      err = res.error
    } else {
      const res = await supabase.from('inventory_items').update(payload).eq('id', item!.id!)
      err = res.error
    }

    if (err) {
      setError(err.message)
      toastError(err.message)
      setSaving(false)
    } else {
      success(mode === 'create' ? 'Item added to inventory' : 'Item updated successfully')
      router.push('/inventory')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {/* Basic info */}
        <div className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input
                required
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Chiavari Chair (Gold)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                value={form.sku}
                onChange={e => set('sku', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. CHR-GOLD-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category_id}
                onChange={e => set('category_id', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Pricing (GHS ₵)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">₵</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rate_daily}
                  onChange={e => set('rate_daily', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weekend Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">₵</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rate_weekend}
                  onChange={e => set('rate_weekend', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">₵</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rate_weekly}
                  onChange={e => set('rate_weekly', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Replacement Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">₵</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.replacement_cost}
                  onChange={e => set('replacement_cost', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Stock & Condition</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity *</label>
              <input
                required
                type="number"
                min="1"
                value={form.quantity_total}
                onChange={e => set('quantity_total', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                value={form.condition}
                onChange={e => set('condition', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Physical details */}
        <div className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Physical Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
              <input
                value={form.dimensions}
                onChange={e => set('dimensions', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='e.g. 60" round'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.weight_kg}
                onChange={e => set('weight_kg', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Setup Time (minutes)</label>
              <input
                type="number"
                min="0"
                value={form.setup_time_min}
                onChange={e => set('setup_time_min', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : mode === 'create' ? 'Add Item' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
