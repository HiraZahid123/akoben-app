'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/ToastProvider'

interface Bundle {
  id: string
  bundle_sku: string
  bundle_name: string
  unit_count: number
  status: string
}

export default function BundleManager({ itemId, itemName }: { itemId: string; itemName: string }) {
  const { success, error: toastError } = useToast()
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ bundleSku: '', bundleName: '', unitCount: '' })

  useEffect(() => { load() }, [itemId])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/inventory/bundles?itemId=${itemId}`)
    if (res.ok) setBundles(await res.json())
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/inventory/bundles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, bundleSku: form.bundleSku, bundleName: form.bundleName, unitCount: parseInt(form.unitCount) }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toastError(data.error ?? 'Failed to create bundle'); return }
    success(`Bundle "${form.bundleName}" created — scanning ${form.bundleSku} checks out ${form.unitCount} units`)
    setForm({ bundleSku: '', bundleName: '', unitCount: '' })
    setAdding(false)
    load()
  }

  async function handleDelete(bundle: Bundle) {
    if (!confirm(`Delete bundle "${bundle.bundle_name}" (${bundle.bundle_sku})?`)) return
    await fetch(`/api/inventory/bundles?id=${bundle.id}`, { method: 'DELETE' })
    success('Bundle deleted')
    load()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">SKU Bundles</h2>
          <p className="text-xs text-gray-400 mt-0.5">Group units of {itemName} under one scannable SKU (e.g. "50 red napkins" as one code)</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + New Bundle
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="p-5 bg-blue-50 border-b border-blue-100 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bundle SKU *</label>
              <input required value={form.bundleSku} onChange={e => setForm(f => ({ ...f, bundleSku: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="e.g. NAP-RED-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bundle Name *</label>
              <input required value={form.bundleName} onChange={e => setForm(f => ({ ...f, bundleName: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="e.g. 50 Red Napkins" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit Count *</label>
              <input required type="number" min="1" value={form.unitCount} onChange={e => setForm(f => ({ ...f, unitCount: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="50" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Creating...' : 'Create Bundle'}
            </button>
            <button type="button" onClick={() => setAdding(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="px-5 py-8 text-sm text-gray-400 text-center">Loading...</p>
      ) : bundles.length === 0 ? (
        <p className="px-5 py-8 text-sm text-gray-400 text-center">No bundles yet. Create one to group units under a single scannable SKU.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left">
              <th className="px-5 py-3 font-medium text-gray-600">Bundle SKU</th>
              <th className="px-5 py-3 font-medium text-gray-600">Name</th>
              <th className="px-5 py-3 font-medium text-gray-600 text-center">Units</th>
              <th className="px-5 py-3 font-medium text-gray-600">Status</th>
              <th className="px-5 py-3 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bundles.map(b => (
              <tr key={b.id}>
                <td className="px-5 py-3 font-mono text-xs text-gray-700">{b.bundle_sku}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{b.bundle_name}</td>
                <td className="px-5 py-3 text-center text-gray-700">{b.unit_count}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => handleDelete(b)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
