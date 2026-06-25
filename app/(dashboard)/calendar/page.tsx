import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import { formatDate } from '@/lib/utils'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; year?: string }> }) {
  const sp = await searchParams
  const now = new Date()
  const year = parseInt(sp.year ?? String(now.getFullYear()))
  const month = parseInt(sp.month ?? String(now.getMonth()))

  const supabase = await createServerSupabaseClient()

  // Fetch orders with events this month
  const startDate = new Date(year, month, 1).toISOString().slice(0, 10)
  const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10)

  const { data: orders } = await supabase
    .from('orders_with_customer')
    .select('id, order_number, event_name, event_date, pickup_date, return_date, customer_name, status, is_booked')
    .gte('pickup_date', `${startDate}T00:00:00`)
    .lte('pickup_date', `${endDate}T23:59:59`)
    .eq('is_booked', true)
    .not('status', 'in', '(cancelled)')
    .order('event_date')

  // Group events by day — show across full pickup-to-return range
  const eventsByDay: Record<number, any[]> = {}
  for (const order of orders ?? []) {
    const pickup = order.pickup_date ? new Date(order.pickup_date) : order.event_date ? new Date(order.event_date) : null
    const ret = order.return_date ? new Date(order.return_date) : pickup
    if (!pickup) continue
    const cursor = new Date(pickup)
    while (ret && cursor <= ret) {
      if (cursor.getFullYear() === year && cursor.getMonth() === month) {
        const day = cursor.getDate()
        if (!eventsByDay[day]) eventsByDay[day] = []
        eventsByDay[day].push(order)
      }
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const prevMonth = month === 0 ? { m: 11, y: year - 1 } : { m: month - 1, y: year }
  const nextMonth = month === 11 ? { m: 0, y: year + 1 } : { m: month + 1, y: year }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Calendar"
        subtitle="Event schedule"
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <a href={`/calendar?month=${prevMonth.m}&year=${prevMonth.y}`}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            ← Previous
          </a>
          <h2 className="text-xl font-bold text-gray-900">{MONTH_NAMES[month]} {year}</h2>
          <a href={`/calendar?month=${nextMonth.m}&year=${nextMonth.y}`}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Next →
          </a>
        </div>

        {/* Calendar grid */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAY_NAMES.map(d => (
              <div key={d} className="px-3 py-2 text-xs font-semibold text-gray-500 text-center bg-gray-50">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {/* Empty cells for first week */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-24 border-r border-b border-gray-50 bg-gray-50/50" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const isToday = year === now.getFullYear() && month === now.getMonth() && day === now.getDate()
              const events = eventsByDay[day] ?? []
              return (
                <div key={day} className={`min-h-24 border-r border-b border-gray-100 p-2 ${isToday ? 'bg-blue-50' : ''}`}>
                  <div className={`text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {events.map((order: any) => (
                      <a key={order.id} href={`/orders/${order.id}`}
                        className="block text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium truncate hover:bg-blue-200 transition-colors"
                        title={`${order.order_number} — ${order.customer_name} — ${order.event_name}`}>
                        {order.order_number}: {order.event_name}
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming events list */}
        {(orders ?? []).length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-800">
              Events this month ({orders?.length})
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-5 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Order</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Customer</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Event</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders?.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600 font-medium">{formatDate(order.event_date)}</td>
                    <td className="px-5 py-3">
                      <a href={`/orders/${order.id}`} className="text-blue-600 font-medium hover:text-blue-700">{order.order_number}</a>
                    </td>
                    <td className="px-5 py-3 text-gray-800">{order.customer_name}</td>
                    <td className="px-5 py-3 text-gray-700">{order.event_name}</td>
                    <td className="px-5 py-3 capitalize text-gray-600">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
