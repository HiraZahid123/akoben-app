'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import { formatGHS, formatDate } from '@/lib/utils'
import type { QuoteStatus } from '@/types/database'

const STATUS_VARIANTS: Record<QuoteStatus, 'default' | 'info' | 'success' | 'warning' | 'danger' | 'purple'> = {
  draft:    'default',
  sent:     'info',
  accepted: 'success',
  declined: 'danger',
  expired:  'warning',
}

export default function QuotesTable({ quotes }: { quotes: any[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')

  const filtered = quotes.filter(q => {
    const customer = q.customers
    const matchSearch =
      q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      (q.event_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (customer?.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || q.status === statusFilter
    return matchSearch && matchStatus
  })

  const statuses: QuoteStatus[] = ['draft', 'sent', 'accepted', 'declined', 'expired']

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
        <input
          type="text"
          placeholder="Search quotes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            All
          </button>
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} quotes</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">Quote #</th>
              <th className="px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="px-4 py-3 font-medium text-gray-600">Event</th>
              <th className="px-4 py-3 font-medium text-gray-600">Event Date</th>
              <th className="px-4 py-3 font-medium text-gray-600">Expires</th>
              <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Total</th>
              <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No quotes found</td></tr>
            ) : filtered.map(q => (
              <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <a href={`/quotes/${q.id}`} className="font-medium text-blue-600 hover:text-blue-700">{q.quote_number}</a>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{q.customers?.full_name ?? '—'}</div>
                  {q.customers?.company_name && <div className="text-xs text-gray-400">{q.customers.company_name}</div>}
                </td>
                <td className="px-4 py-3 text-gray-700">{q.event_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(q.event_date)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(q.expires_at)}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANTS[q.status as QuoteStatus]} className="capitalize">
                    {q.status === 'accepted' && q.converted_to_order ? 'Converted to Order' : q.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{formatGHS(q.total)}</td>
                <td className="px-4 py-3">
                  <a href={`/quotes/${q.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
