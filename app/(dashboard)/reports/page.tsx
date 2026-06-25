import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import { formatGHS, formatDate, formatDateTime } from '@/lib/utils'

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ type?: string; date?: string; month?: string; year?: string }> }) {
  const sp = await searchParams
  const type = sp.type ?? 'daily'
  const supabase = await createServerSupabaseClient()

  const now = new Date()
  const selectedDate = sp.date ?? now.toISOString().slice(0, 10)
  const selectedYear = parseInt(sp.year ?? String(now.getFullYear()))
  const selectedMonth = parseInt(sp.month ?? String(now.getMonth() + 1))

  let payments: any[] = []
  let orders: any[] = []
  let periodLabel = ''

  if (type === 'daily') {
    periodLabel = `Daily Report — ${selectedDate}`
    const [p, o] = await Promise.all([
      supabase.from('payments')
        .select('*, orders(order_number, event_name), customers(full_name)')
        .gte('created_at', `${selectedDate}T00:00:00`)
        .lte('created_at', `${selectedDate}T23:59:59`)
        .order('created_at'),
      supabase.from('orders_with_customer')
        .select('*')
        .gte('created_at', `${selectedDate}T00:00:00`)
        .lte('created_at', `${selectedDate}T23:59:59`)
        .order('created_at'),
    ])
    payments = p.data ?? []
    orders = o.data ?? []
  } else {
    const monthStr = String(selectedMonth).padStart(2, '0')
    const startDate = `${selectedYear}-${monthStr}-01`
    const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().slice(0, 10)
    periodLabel = `Monthly Report — ${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`
    const [p, o] = await Promise.all([
      supabase.from('payments')
        .select('*, orders(order_number, event_name), customers(full_name)')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at'),
      supabase.from('orders_with_customer')
        .select('*')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at'),
    ])
    payments = p.data ?? []
    orders = o.data ?? []
  }

  const totalRevenue = payments.reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalOrders = orders.length

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Reports" subtitle="Sales and revenue reports" />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Report type selector */}
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
            <a href={`/reports?type=daily&date=${selectedDate}`}
              className={`px-4 py-2 text-sm font-medium transition-colors ${type === 'daily' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              Daily Sales
            </a>
            <a href={`/reports?type=monthly&month=${selectedMonth}&year=${selectedYear}`}
              className={`px-4 py-2 text-sm font-medium transition-colors ${type === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              Monthly Revenue
            </a>
          </div>

          {type === 'daily' ? (
            <form method="get">
              <input type="hidden" name="type" value="daily" />
              <div className="flex gap-2 items-center">
                <input type="date" name="date" defaultValue={selectedDate}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">View</button>
              </div>
            </form>
          ) : (
            <form method="get">
              <input type="hidden" name="type" value="monthly" />
              <div className="flex gap-2 items-center">
                <select name="month" defaultValue={selectedMonth}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {MONTH_NAMES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
                <select name="year" defaultValue={selectedYear}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">View</button>
              </div>
            </form>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">{formatGHS(totalRevenue)}</p>
            <p className="text-xs text-gray-400 mt-1">{payments.length} payment(s)</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">New Orders</p>
            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Avg. Payment</p>
            <p className="text-2xl font-bold text-gray-900">
              {payments.length > 0 ? formatGHS(totalRevenue / payments.length) : formatGHS(0)}
            </p>
          </div>
        </div>

        {/* Payments table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-800">{periodLabel}</div>
          {payments.length === 0 ? (
            <p className="px-5 py-10 text-center text-gray-400 text-sm">No payments recorded for this period.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-5 py-3 font-medium text-gray-600">Date/Time</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Customer</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Order</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Method</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Reference</th>
                  <th className="px-5 py-3 font-medium text-gray-600 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 text-gray-600">{formatDateTime(p.created_at)}</td>
                    <td className="px-5 py-3 text-gray-800 font-medium">{p.customers?.full_name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{p.orders?.order_number ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize">{p.method?.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{p.reference ?? '—'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-green-600">{formatGHS(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={5} className="px-5 py-3 font-semibold text-gray-800">Total</td>
                  <td className="px-5 py-3 text-right font-bold text-green-700 text-base">{formatGHS(totalRevenue)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
