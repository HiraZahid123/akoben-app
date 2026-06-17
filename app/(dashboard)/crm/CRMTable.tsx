'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils'

const CHANNEL_ICONS: Record<string, string> = {
  email: '✉️',
  sms: '💬',
  whatsapp: '📱',
  phone_call: '📞',
  in_person: '🤝',
  other: '📌',
}

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  phone_call: 'Phone Call',
  in_person: 'In Person',
  other: 'Other',
}

export default function CRMTable({ logs, customers }: { logs: any[]; customers: any[] }) {
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')

  const filtered = logs.filter(l => {
    const name = (l.customers?.full_name ?? '').toLowerCase()
    const subject = (l.subject ?? '').toLowerCase()
    const body = (l.body ?? '').toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase()) || subject.includes(search.toLowerCase()) || body.includes(search.toLowerCase())
    const matchChannel = channelFilter === 'all' || l.channel === channelFilter
    const matchCustomer = customerFilter === 'all' || l.customer_id === customerFilter
    return matchSearch && matchChannel && matchCustomer
  })

  const channels = ['email', 'sms', 'whatsapp', 'phone_call', 'in_person', 'other']

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Search communications..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />

        <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Channels</option>
          {channels.map(c => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}
        </select>

        <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-52">
          <option value="all">All Customers</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}{c.company_name ? ` (${c.company_name})` : ''}</option>)}
        </select>

        <span className="text-sm text-gray-500 ml-auto self-center">{filtered.length} entries</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 font-medium text-gray-600">Channel</th>
                <th className="px-4 py-3 font-medium text-gray-600">Direction</th>
                <th className="px-4 py-3 font-medium text-gray-600">Subject / Summary</th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No communications found</td></tr>
              ) : filtered.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                  <td className="px-4 py-3">
                    <a href={`/customers/${log.customer_id}`} className="font-medium text-blue-600 hover:text-blue-700">
                      {log.customers?.full_name ?? '—'}
                    </a>
                    {log.customers?.company_name && (
                      <div className="text-xs text-gray-400">{log.customers.company_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span>{CHANNEL_ICONS[log.channel] ?? '📌'}</span>
                      <span className="text-gray-700">{CHANNEL_LABELS[log.channel] ?? log.channel}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={log.direction === 'outbound' ? 'info' : 'default'} className="capitalize text-xs">
                      {log.direction}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    {log.subject && <p className="font-medium text-gray-900 truncate">{log.subject}</p>}
                    {log.body && <p className="text-xs text-gray-400 truncate mt-0.5">{log.body}</p>}
                    {!log.subject && !log.body && <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/crm/${log.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
