'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { invoiceEmailHtml } from '@/lib/email-client'
import { useToast } from '@/components/ui/ToastProvider'

const CHANNELS = [
  { value: 'email', label: '✉️ Email' },
  { value: 'sms', label: '💬 SMS' },
  { value: 'whatsapp', label: '📱 WhatsApp' },
  { value: 'phone_call', label: '📞 Phone Call' },
  { value: 'in_person', label: '🤝 In Person' },
  { value: 'other', label: '📌 Other' },
]

interface Props {
  customers: { id: string; full_name: string; company_name: string | null; email: string | null; phone: string | null }[]
  orders: { id: string; order_number: string; event_name: string | null; customer_id: string }[]
  defaultCustomerId?: string
}

export default function LogCommunicationForm({ customers, orders, defaultCustomerId }: Props) {
  const router = useRouter()
  const { success, error: toastError, warning } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [form, setForm] = useState({
    customer_id: defaultCustomerId ?? '',
    order_id: '',
    channel: 'email',
    direction: 'outbound',
    subject: '',
    body: '',
    contact_name: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const selectedCustomer = customers.find(c => c.id === form.customer_id)
  const customerOrders = orders.filter(o => o.customer_id === form.customer_id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customer_id) { setError('Select a customer'); return }
    setError('')
    setLoading(true)

    try {
      const payload: any = {
        customer_id: form.customer_id,
        channel: form.channel,
        direction: form.direction,
        subject: form.subject || null,
        body: form.body || null,
        contact_name: form.contact_name || null,
      }
      if (form.order_id) payload.order_id = form.order_id

      // If channel is email and direction is outbound, also send the email
      if (form.channel === 'email' && form.direction === 'outbound' && selectedCustomer?.email && form.body) {
        setSendingEmail(true)
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedCustomer.email,
            subject: form.subject || 'Message from Akoben Event Rentals',
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#1e40af">Akoben Event Rentals</h2>
              <p>Dear ${selectedCustomer.full_name},</p>
              <div style="white-space:pre-wrap">${form.body}</div>
              <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb"/>
              <p style="color:#6b7280;font-size:12px">Akoben Event Rentals · Cape Coast, Ghana</p>
            </div>`,
          }),
        })
        setSendingEmail(false)
        if (res.ok) {
          success(`Email sent to ${selectedCustomer.email}`)
        } else {
          warning('Email failed to send — communication logged without sending')
          setError('Email failed to send. Log saved without sending.')
        }
      }

      const { error: insertError } = await supabase.from('crm_communication_log').insert(payload)
      if (insertError) throw insertError

      if (form.channel !== 'email' || form.direction !== 'outbound') {
        success('Communication logged successfully')
      }
      router.push('/crm')
      router.refresh()
    } catch (err: any) {
      const msg = err.message ?? 'Failed to save'
      setError(msg)
      toastError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
        <select required value={form.customer_id} onChange={e => { set('customer_id', e.target.value); set('order_id', '') }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select customer...</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.full_name}{c.company_name ? ` (${c.company_name})` : ''}</option>
          ))}
        </select>
        {selectedCustomer && (
          <div className="mt-1.5 flex gap-3 text-xs text-gray-400">
            {selectedCustomer.email && <span>✉️ {selectedCustomer.email}</span>}
            {selectedCustomer.phone && <span>📞 {selectedCustomer.phone}</span>}
          </div>
        )}
      </div>

      {customerOrders.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Linked Order (optional)</label>
          <select value={form.order_id} onChange={e => set('order_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">No order linked</option>
            {customerOrders.map(o => (
              <option key={o.id} value={o.id}>{o.order_number}{o.event_name ? ` — ${o.event_name}` : ''}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Channel *</label>
          <select value={form.channel} onChange={e => set('channel', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Direction *</label>
          <select value={form.direction} onChange={e => set('direction', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="outbound">Outbound (we contacted)</option>
            <option value="inbound">Inbound (they contacted us)</option>
          </select>
        </div>
      </div>

      {form.direction === 'inbound' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
          <input type="text" value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
            placeholder="Who contacted us?"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {form.channel === 'phone_call' || form.channel === 'in_person' ? 'Summary Title' : 'Subject'}
        </label>
        <input type="text" value={form.subject} onChange={e => set('subject', e.target.value)}
          placeholder={form.channel === 'email' ? 'Email subject...' : 'Brief summary...'}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {form.channel === 'email' ? 'Email Body' : 'Notes'}
          {form.channel === 'email' && form.direction === 'outbound' && selectedCustomer?.email && (
            <span className="ml-2 text-xs text-green-600 font-normal">Will be sent to {selectedCustomer.email}</span>
          )}
        </label>
        <textarea value={form.body} onChange={e => set('body', e.target.value)}
          rows={6}
          placeholder={form.channel === 'email' ? 'Write your email message...' : 'Notes about the conversation...'}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm">
          {loading ? (sendingEmail ? 'Sending email...' : 'Saving...') : (
            form.channel === 'email' && form.direction === 'outbound' && selectedCustomer?.email
              ? '✉️ Send & Log'
              : 'Save Communication'
          )}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
          Cancel
        </button>
      </div>
    </form>
  )
}
