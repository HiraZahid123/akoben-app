'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import { formatGHS } from '@/lib/utils'
import type { InventoryAvailability, InventoryCategory } from '@/types/database'
import { Package } from 'lucide-react'

interface Props {
  items: InventoryAvailability[]
  categories: InventoryCategory[]
}

function stockBadge(available: number, total: number) {
  if (available === 0) return <Badge variant="danger">Out of stock</Badge>
  if (available < total * 0.3) return <Badge variant="warning">Low stock</Badge>
  return <Badge variant="success">In stock</Badge>
}

function conditionBadge(condition: string) {
  const map: Record<string, { label: string; variant: 'success' | 'default' | 'warning' | 'danger' }> = {
    excellent: { label: 'Excellent', variant: 'success' },
    good:      { label: 'Good',      variant: 'default' },
    fair:      { label: 'Fair',      variant: 'warning' },
    maintenance: { label: 'Maintenance', variant: 'danger' },
    retired:   { label: 'Retired',   variant: 'danger' },
  }
  const c = map[condition] ?? { label: condition, variant: 'default' as const }
  return <Badge variant={c.variant}>{c.label}</Badge>
}

export default function InventoryTable({ items, categories }: Props) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.sku ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'all' || item.category_id === categoryFilter
    return matchSearch && matchCat
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Filters */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <input
          type="text"
          placeholder="Search items or SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} items</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">Item</th>
              <th className="px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="px-4 py-3 font-medium text-gray-600">Location</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Daily Rate</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-center">Stock</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-center">Available</th>
              <th className="px-4 py-3 font-medium text-gray-600">Condition</th>
              <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  No items found
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {(item as any).image_url ? (
                        <img src={(item as any).image_url} alt={item.name} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                          <Package size={16} />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.sku && <div className="text-xs text-gray-400 mt-0.5">{item.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.category_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{(item as any).location ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatGHS(item.rate_daily)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {stockBadge(item.quantity_available, item.quantity_total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${item.quantity_available === 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {item.quantity_available}
                    </span>
                    <span className="text-gray-400"> / {item.quantity_total}</span>
                  </td>
                  <td className="px-4 py-3">
                    {conditionBadge(item.condition)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/inventory/${item.id}/edit`}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </a>
                      <span className="text-gray-300">|</span>
                      <a
                        href={`/inventory/${item.id}`}
                        className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                      >
                        View
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
