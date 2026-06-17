'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import { formatGHS, formatDate, ORDER_STATUS_COLORS } from '@/lib/utils'
import type { OrderWithCustomer, OrderStatus } from '@/types/database'

const STATUS_VARIANTS: Record<OrderStatus, 'default' | 'info' | 'success' | 'warning' | 'danger' | 'purple'> = {
  draft:     'default',
  quote:     'info',
  confirmed: 'success',
  active:    'success',
  returned:  'purple',
  cancelled: 'danger',
  overdue:   'warning',
}

const ALL_STATUSES: OrderStatus[] = ['draft', 'quote', 'confirmed', 'active', 'returned', 'cancelled', 'overdue']

export default function OrdersTable({ orders }: { orders: OrderWithCustomer[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')

  const filtered = orders.filter(o => {
    const matchSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.event_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Filters */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
        <input
          type="text"
          placeholder="Search orders, customers, events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} orders</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">Order</th>
              <th className="px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="px-4 py-3 font-medium text-gray-600">Event</th>
              <th className="px-4 py-3 font-medium text-gray-600">Pickup</th>
              <th className="px-4 py-3 font-medium text-gray-600">Return</th>
              <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Total</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Balance</th>
              <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-400">No orders found</td>
              </tr>
            ) : filtered.map(o => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <a href={`/orders/${o.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                    {o.order_number}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{o.customer_name}</div>
                  {o.company_name && <div className="text-xs text-gray-400">{o.company_name}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-700">{o.event_name}</div>
                  <div className="text-xs text-gray-400 capitalize">{o.event_type?.replace('_', ' ')}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDate(o.pickup_date)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(o.return_date)}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANTS[o.status]} className="capitalize">{o.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{formatGHS(o.total)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={o.balance_due > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                    {formatGHS(o.balance_due)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a href={`/orders/${o.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
