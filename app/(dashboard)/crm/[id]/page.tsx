import { createServerSupabaseClient } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils'
import { notFound } from 'next/navigation'

const CHANNEL_ICONS: Record<string, string> = {
  email: '✉️', sms: '💬', whatsapp: '📱',
  phone_call: '📞', in_person: '🤝', other: '📌',
}
const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp',
  phone_call: 'Phone Call', in_person: 'In Person', other: 'Other',
}

export default async function CRMDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: log } = await supabase
    .from('crm_communication_log')
    .select('*, customers(id, full_name, company_name, email, phone), orders(id, order_number, event_name)')
    .eq('id', id)
    .single()

  if (!log) notFound()
  const customer = log.customers as any
  const order = log.orders as any

  return (
    <div>
      <PageHeader
        title={log.subject ?? `${CHANNEL_LABELS[log.channel] ?? log.channel} — ${customer?.full_name}`}
        subtitle={formatDateTime(log.created_at)}
        action={
          <a href="/crm" className="text-sm text-gray-500 hover:text-gray-700">← Back to CRM</a>
        }
      />

      <div className="p-6 grid grid-cols-3 gap-6 max-w-5xl">
        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{CHANNEL_ICONS[log.channel] ?? '📌'}</span>
              <div>
                <p className="font-semibold text-gray-900">{CHANNEL_LABELS[log.channel] ?? log.channel}</p>
                <Badge variant={log.direction === 'outbound' ? 'info' : 'default'} className="capitalize text-xs mt-0.5">
                  {log.direction}
                </Badge>
              </div>
            </div>

            {log.subject && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Subject</p>
                <p className="font-medium text-gray-900">{log.subject}</p>
              </div>
            )}

            {log.body && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                  {log.channel === 'email' ? 'Message' : 'Notes'}
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {log.body}
                </div>
              </div>
            )}

            {!log.subject && !log.body && (
              <p className="text-gray-400 text-sm">No content recorded.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Customer</h3>
            <div className="text-sm space-y-1.5">
              <a href={`/customers/${customer?.id}`} className="font-medium text-blue-600 hover:text-blue-700 block">
                {customer?.full_name}
              </a>
              {customer?.company_name && <p className="text-gray-500">{customer.company_name}</p>}
              {customer?.email && <p className="text-gray-600">✉️ {customer.email}</p>}
              {customer?.phone && <p className="text-gray-600">📞 {customer.phone}</p>}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <a href={`/crm/new?customer_id=${customer?.id}`}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                + Log another communication
              </a>
            </div>
          </div>

          {order && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Linked Order</h3>
              <a href={`/orders/${order.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700 block">
                {order.order_number}
              </a>
              {order.event_name && <p className="text-sm text-gray-500 mt-0.5">{order.event_name}</p>}
            </div>
          )}

          {log.contact_name && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-2">Contact</h3>
              <p className="text-sm text-gray-600">{log.contact_name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
