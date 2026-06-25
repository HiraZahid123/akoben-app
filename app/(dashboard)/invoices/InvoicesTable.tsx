'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import { formatGHS, formatDate } from '@/lib/utils'
import type { InvoiceStatus } from '@/types/database'

const STATUS_VARIANTS: Record<InvoiceStatus, 'default' | 'info' | 'success' | 'warning' | 'danger' | 'purple'> = {
  draft: 'default', sent: 'info', unpaid: 'warning', partial: 'purple',
  paid: 'success', overdue: 'danger', void: 'default',
}

const STATUS_LABELS: Partial<Record<InvoiceStatus, string>> = {
  paid:    'Fully Paid',
  partial: 'Partially Paid',
  unpaid:  'Unpaid',
}

const FILTER_STATUSES: InvoiceStatus[] = ['unpaid', 'partial', 'paid', 'overdue', 'sent', 'void']

export default function InvoicesTable({ invoices }: { invoices: any[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')

  const filtered = invoices.filter(inv => {
    const matchSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customers?.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
        <input type="text" placeholder="Search invoices..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-60" />
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
          {FILTER_STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {STATUS_LABELS[s] ?? s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} invoices</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">Invoice</th>
              <th className="px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="px-4 py-3 font-medium text-gray-600">Order</th>
              <th className="px-4 py-3 font-medium text-gray-600">Due Date</th>
              <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Total</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Balance</th>
              <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No invoices found</td></tr>
            ) : filtered.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <a href={`/invoices/${inv.id}`} className="font-medium text-blue-600 hover:text-blue-700">{inv.invoice_number}</a>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{inv.customers?.full_name ?? '—'}</div>
                  {inv.customers?.company_name && <div className="text-xs text-gray-400">{inv.customers.company_name}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">{inv.orders?.order_number ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(inv.due_date)}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANTS[inv.status as InvoiceStatus]}>
                    {STATUS_LABELS[inv.status as InvoiceStatus] ?? inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{formatGHS(inv.total)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={inv.balance_due > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                    {formatGHS(inv.balance_due)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a href={`/invoices/${inv.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
