'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { GHANA_REGIONS } from '@/lib/utils'
import { useToast } from '@/components/ui/ToastProvider'
import type { Customer } from '@/types/database'

interface Props {
  customer?: Partial<Customer>
  mode: 'create' | 'edit'
}

const CUSTOMER_TYPES = ['individual', 'corporate', 'planner', 'nonprofit'] as const

export default function CustomerForm({ customer, mode }: Props) {
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name:        customer?.full_name ?? '',
    company_name:     customer?.company_name ?? '',
    customer_type:    customer?.customer_type ?? 'individual',
    email:            customer?.email ?? '',
    phone:            customer?.phone ?? '',
    alt_phone:        customer?.alt_phone ?? '',
    address_line1:    customer?.address_line1 ?? '',
    address_line2:    customer?.address_line2 ?? '',
    city:             customer?.city ?? '',
    region:           customer?.region ?? '',
    gps_address:      customer?.gps_address ?? '',
    tax_id:           customer?.tax_id ?? '',
    discount_pct:     customer?.discount_pct?.toString() ?? '0',
    referral_source:  customer?.referral_source ?? '',
    notes:            customer?.notes ?? '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      full_name:       form.full_name,
      company_name:    form.company_name || null,
      customer_type:   form.customer_type as Customer['customer_type'],
      email:           form.email || null,
      phone:           form.phone || null,
      alt_phone:       form.alt_phone || null,
      address_line1:   form.address_line1 || null,
      address_line2:   form.address_line2 || null,
      city:            form.city || null,
      region:          (form.region as Customer['region']) || null,
      gps_address:     form.gps_address || null,
      country:         'Ghana',
      tax_id:          form.tax_id || null,
      discount_pct:    parseFloat(form.discount_pct) || 0,
      referral_source: form.referral_source || null,
      notes:           form.notes || null,
    }

    let err
    if (mode === 'create') {
      const res = await supabase.from('customers').insert(payload)
      err = res.error
    } else {
      const res = await supabase.from('customers').update(payload).eq('id', customer!.id!)
      err = res.error
    }

    if (err) {
      setError(err.message)
      toastError(err.message)
      setSaving(false)
    } else {
      success(mode === 'create' ? 'Customer created successfully' : 'Customer updated successfully')
      router.push('/customers')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {/* Identity */}
        <div className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input required value={form.full_name} onChange={e => set('full_name', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Kwame Mensah" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input value={form.company_name} onChange={e => set('company_name', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
              <select value={form.customer_type} onChange={e => set('customer_type', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CUSTOMER_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="kwame@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (primary)</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+233 24 000 0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Phone</label>
              <input value={form.alt_phone} onChange={e => set('alt_phone', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+233 20 000 0000" />
            </div>
          </div>
        </div>

        {/* Ghana Address */}
        <div className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Ghana Address</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street / Area</label>
              <input value={form.address_line1} onChange={e => set('address_line1', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Pedu Junction, opposite Woodin" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City / Town</label>
              <input value={form.city} onChange={e => set('city', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cape Coast" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <select value={form.region} onChange={e => set('region', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select region</option>
                {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghana Post GPS Address</label>
              <input value={form.gps_address} onChange={e => set('gps_address', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. CM-0024-1234" />
              <p className="text-xs text-gray-400 mt-1">Find your GPS address at ghanapostgps.com</p>
            </div>
          </div>
        </div>

        {/* Other */}
        <div className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Other Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghana TIN</label>
              <input value={form.tax_id} onChange={e => set('tax_id', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tax Identification Number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
              <input type="number" min="0" max="100" value={form.discount_pct} onChange={e => set('discount_pct', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral Source</label>
              <input value={form.referral_source} onChange={e => set('referral_source', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Facebook, Word of mouth" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input value={form.notes} onChange={e => set('notes', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : mode === 'create' ? 'Add Customer' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
