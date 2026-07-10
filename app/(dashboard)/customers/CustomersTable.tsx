'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import { formatGHS, formatDate } from '@/lib/utils'
import type { Customer } from '@/types/database'

export default function CustomersTable({ customers, canEdit = true }: { customers: Customer[]; canEdit?: boolean }) {
  const [search, setSearch] = useState('')

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search) ||
    (c.company_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-sm"
        />
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} customers</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 font-medium text-gray-600">Contact</th>
              <th className="px-4 py-3 font-medium text-gray-600">Location</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Total Orders</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Total Spent</th>
              <th className="px-4 py-3 font-medium text-gray-600">Last Order</th>
              <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No customers found</td>
              </tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{c.full_name}</div>
                  {c.company_name && <div className="text-xs text-gray-400">{c.company_name}</div>}
                  <Badge variant="default" className="mt-1">{c.customer_type}</Badge>
                </td>
                <td className="px-4 py-3">
                  {c.email && <div className="text-gray-700">{c.email}</div>}
                  {c.phone && <div className="text-gray-500 text-xs mt-0.5">{c.phone}</div>}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {c.city && <div>{c.city}</div>}
                  {c.region && <div className="text-xs">{c.region}</div>}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-700">{c.total_orders}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{formatGHS(c.total_spent)}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(c.last_order_date)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <a href={`/customers/${c.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View</a>
                    {canEdit && (
                      <>
                        <span className="text-gray-300">|</span>
                        <a href={`/customers/${c.id}/edit`} className="text-xs text-gray-600 hover:text-gray-700 font-medium">Edit</a>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
