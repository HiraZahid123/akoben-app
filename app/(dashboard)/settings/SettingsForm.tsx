'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GHANA_REGIONS } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function SettingsForm({ settings }: { settings: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    business_name: settings?.business_name ?? '',
    email: settings?.email ?? '',
    phone: settings?.phone ?? '',
    address: settings?.address ?? '',
    city: settings?.city ?? '',
    region: settings?.region ?? 'Central',
    gps_address: settings?.gps_address ?? '',
    default_tax_rate: String(settings?.default_tax_rate ?? 15),
    default_deposit_pct: String(settings?.default_deposit_pct ?? 30),
    default_rental_days: String(settings?.default_rental_days ?? 1),
    overdue_grace_hours: String(settings?.overdue_grace_hours ?? 2),
    invoice_footer: settings?.invoice_footer ?? '',
    rental_terms: settings?.rental_terms ?? '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        ...form,
        default_tax_rate: parseFloat(form.default_tax_rate),
        default_deposit_pct: parseFloat(form.default_deposit_pct),
        default_rental_days: parseInt(form.default_rental_days),
        overdue_grace_hours: parseInt(form.overdue_grace_hours),
      }

      let err
      if (settings?.id) {
        const res = await supabase.from('business_settings').update(payload).eq('id', settings.id)
        err = res.error
      } else {
        const res = await supabase.from('business_settings').insert(payload)
        err = res.error
      }
      if (err) throw err
      setSaved(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">Settings saved successfully.</div>
      )}

      {/* Business Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Business Information</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
          <input type="text" required value={form.business_name} onChange={e => set('business_name', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="info@yourbusiness.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+233 24 000 0000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
          <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
              placeholder="Cape Coast"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select value={form.region} onChange={e => set('region', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ghana Post GPS Address</label>
          <input type="text" value={form.gps_address} onChange={e => set('gps_address', e.target.value)}
            placeholder="e.g. CF-0000-0000"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p className="text-xs text-gray-400 mt-1">Find your code at <a href="https://ghanapostgps.com" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">ghanapostgps.com</a></p>
        </div>
      </div>

      {/* Financial Defaults */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Financial Defaults</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%)</label>
            <input type="number" step="0.01" min="0" max="100" value={form.default_tax_rate}
              onChange={e => set('default_tax_rate', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-400 mt-1">Ghana VAT is 15%</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Required (%)</label>
            <input type="number" step="0.01" min="0" max="100" value={form.default_deposit_pct}
              onChange={e => set('default_deposit_pct', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Rental Days</label>
            <input type="number" min="1" value={form.default_rental_days}
              onChange={e => set('default_rental_days', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overdue Grace Period (hours)</label>
            <input type="number" min="0" value={form.overdue_grace_hours}
              onChange={e => set('overdue_grace_hours', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Invoice & Contracts</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Footer</label>
          <textarea value={form.invoice_footer} onChange={e => set('invoice_footer', e.target.value)}
            rows={3} placeholder="e.g. Thank you for choosing Akoben Event Rentals!"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rental Terms & Conditions</label>
          <textarea value={form.rental_terms} onChange={e => set('rental_terms', e.target.value)}
            rows={6} placeholder="Enter your standard rental terms here..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm">
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  )
}
