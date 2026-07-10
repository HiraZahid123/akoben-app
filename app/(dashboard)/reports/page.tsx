import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import { formatGHS, formatDate, formatDateTime } from '@/lib/utils'
import { getCurrentUserRole } from '@/lib/auth-role'
import { getAllowedReportTypes, DAILY_ONLY_REVENUE_ROLES, type ReportType } from '@/lib/permissions'
import PrintButton from './PrintButton'
import EmailReportButton from './EmailReportButton'
import {
  DollarSign, Receipt, ClipboardList, Package, ClipboardCheck,
  CircleDot, CheckCircle2, AlertTriangle, FlagTriangleRight, type LucideIcon,
} from 'lucide-react'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

const REPORT_TAB_LABELS: Record<ReportType, string> = {
  revenue: 'Payment Report',
  invoices: 'Invoices',
  orders: 'Orders',
  inventory: 'Frequent Inventory',
  audit: 'Inventory Audit',
  partial: 'Partial Payments',
  full: 'Full Payments',
  override: 'Override Payments',
  completed: 'Completed Orders',
}

const REPORT_TAB_ICONS: Record<ReportType, LucideIcon> = {
  revenue: DollarSign,
  invoices: Receipt,
  orders: ClipboardList,
  inventory: Package,
  audit: ClipboardCheck,
  partial: CircleDot,
  full: CheckCircle2,
  override: AlertTriangle,
  completed: FlagTriangleRight,
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ type?: string; report?: string; date?: string; month?: string; year?: string; from?: string; to?: string }> }) {
  const sp = await searchParams
  const role = await getCurrentUserRole()
  const allowedReports = getAllowedReportTypes(role)
  const dailyOnly = DAILY_ONLY_REVENUE_ROLES.includes(role)
  const requestedReport = (sp.report ?? allowedReports[0]) as ReportType
  const reportType: ReportType = allowedReports.includes(requestedReport) ? requestedReport : allowedReports[0]
  const type = dailyOnly ? 'daily' : (sp.type ?? 'daily')
  const supabase = await createServerSupabaseClient()

  const now = new Date()
  const selectedDate = sp.date ?? now.toISOString().slice(0, 10)
  const selectedYear = parseInt(sp.year ?? String(now.getFullYear()))
  const selectedMonth = parseInt(sp.month ?? String(now.getMonth() + 1))
  const fromDate = sp.from ?? now.toISOString().slice(0, 10)
  const toDate = sp.to ?? now.toISOString().slice(0, 10)

  let startDate: string, endDate: string, periodLabel: string

  if (type === 'daily') {
    startDate = selectedDate
    endDate = selectedDate
    periodLabel = selectedDate
  } else if (type === 'range') {
    startDate = fromDate
    endDate = toDate
    periodLabel = `${formatDate(fromDate)} — ${formatDate(toDate)}`
  } else {
    const monthStr = String(selectedMonth).padStart(2, '0')
    startDate = `${selectedYear}-${monthStr}-01`
    endDate = new Date(selectedYear, selectedMonth, 0).toISOString().slice(0, 10)
    periodLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
  }

  let payments: any[] = []
  let orders: any[] = []
  let invoices: any[] = []
  let inventoryRows: { name: string; sku: string | null; totalQty: number; orderCount: number }[] = []
  let auditRows: { name: string; category: string | null; location: string | null; available: number }[] = []
  let partialPayments: any[] = []
  let fullPayments: any[] = []
  let overridePayments: any[] = []
  let completedOrders: any[] = []

  if (reportType === 'revenue') {
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
  } else if (reportType === 'invoices') {
    const { data } = await supabase
      .from('invoices')
      .select('*, customers(full_name), orders(order_number)')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at')
    invoices = data ?? []
  } else if (reportType === 'orders') {
    const { data } = await supabase
      .from('orders_with_customer')
      .select('*')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at')
    orders = data ?? []
  } else if (reportType === 'inventory') {
    const { data: rangeOrders } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
    const orderIds = (rangeOrders ?? []).map(o => o.id)
    if (orderIds.length > 0) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('quantity, order_id, inventory_items(name, sku)')
        .in('order_id', orderIds)
      const agg: Record<string, { name: string; sku: string | null; totalQty: number; orderIds: Set<string> }> = {}
      for (const oi of orderItems ?? []) {
        const name = (oi.inventory_items as any)?.name ?? 'Unknown'
        const sku = (oi.inventory_items as any)?.sku ?? null
        if (!agg[name]) agg[name] = { name, sku, totalQty: 0, orderIds: new Set() }
        agg[name].totalQty += oi.quantity ?? 0
        agg[name].orderIds.add(oi.order_id)
      }
      inventoryRows = Object.values(agg)
        .map(a => ({ name: a.name, sku: a.sku, totalQty: a.totalQty, orderCount: a.orderIds.size }))
        .sort((a, b) => b.totalQty - a.totalQty)
    }
  } else if (reportType === 'audit') {
    const [{ data: items }, { data: units }] = await Promise.all([
      supabase.from('inventory_items').select('id, name, quantity_total, location, inventory_categories(name)').order('name'),
      supabase.from('inventory_units').select('item_id, status'),
    ])
    const outCountByItem: Record<string, number> = {}
    const itemsWithUnits = new Set<string>()
    for (const u of units ?? []) {
      itemsWithUnits.add(u.item_id)
      if (u.status === 'out') outCountByItem[u.item_id] = (outCountByItem[u.item_id] ?? 0) + 1
    }
    auditRows = (items ?? []).map((item: any) => ({
      name: item.name,
      category: item.inventory_categories?.name ?? null,
      location: item.location ?? null,
      available: itemsWithUnits.has(item.id)
        ? item.quantity_total - (outCountByItem[item.id] ?? 0)
        : item.quantity_total,
    }))
  } else if (reportType === 'partial') {
    const { data } = await supabase
      .from('invoices')
      .select('*, customers(full_name), orders(order_number)')
      .eq('status', 'partial')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at')
    invoices = data ?? []
  } else if (reportType === 'full') {
    const { data } = await supabase
      .from('invoices')
      .select('*, customers(full_name), orders(order_number)')
      .eq('status', 'paid')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at')
    invoices = data ?? []
  } else if (reportType === 'override') {
    const { data } = await supabase
      .from('payments')
      .select('*, orders(order_number, event_name), customers(full_name)')
      .eq('method', 'override_50')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at')
    overridePayments = data ?? []
  } else if (reportType === 'completed') {
    const { data } = await supabase
      .from('orders_with_customer')
      .select('*')
      .eq('status', 'complete')
      .gte('updated_at', `${startDate}T00:00:00`)
      .lte('updated_at', `${endDate}T23:59:59`)
      .order('updated_at')
    completedOrders = data ?? []
  }

  const totalRevenue = payments.reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalOrders = orders.length
  const totalInvoiced = invoices.reduce((s, i) => s + (i.total ?? 0), 0)

  const periodQuery = type === 'daily' ? `type=daily&date=${selectedDate}`
    : type === 'range' ? `type=range&from=${fromDate}&to=${toDate}`
    : `type=monthly&month=${selectedMonth}&year=${selectedYear}`

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Reports" subtitle="Sales, invoice, order, and inventory reports" />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Period type selector */}
        <div className="print:hidden flex gap-3 items-end flex-wrap">
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
            <a href={`/reports?report=${reportType}&type=daily&date=${selectedDate}`}
              className={`px-4 py-2 text-sm font-medium transition-colors ${type === 'daily' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              Daily
            </a>
            {!dailyOnly && (
              <>
                <a href={`/reports?report=${reportType}&type=range&from=${fromDate}&to=${toDate}`}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${type === 'range' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  Custom Range
                </a>
                <a href={`/reports?report=${reportType}&type=monthly&month=${selectedMonth}&year=${selectedYear}`}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${type === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  Monthly
                </a>
              </>
            )}
          </div>
          {dailyOnly && <p className="text-xs text-gray-400 self-center">Your role has daily-only report access.</p>}

          {type === 'daily' && (
            <form method="get">
              <input type="hidden" name="report" value={reportType} />
              <input type="hidden" name="type" value="daily" />
              <div className="flex gap-2 items-center">
                <input type="date" name="date" defaultValue={selectedDate}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">View</button>
              </div>
            </form>
          )}
          {type === 'range' && (
            <form method="get">
              <input type="hidden" name="report" value={reportType} />
              <input type="hidden" name="type" value="range" />
              <div className="flex gap-2 items-center">
                <input type="date" name="from" defaultValue={fromDate}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-gray-400 text-sm">to</span>
                <input type="date" name="to" defaultValue={toDate}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">View</button>
              </div>
            </form>
          )}
          {type === 'monthly' && (
            <form method="get">
              <input type="hidden" name="report" value={reportType} />
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

        {/* Report type selector — tabs filtered to what this role is allowed to see */}
        {allowedReports.length > 1 && (
          <div className="print:hidden flex bg-white border border-gray-200 rounded-lg overflow-hidden w-fit flex-wrap">
            {allowedReports.map(key => {
              const TabIcon = REPORT_TAB_ICONS[key]
              return (
                <a key={key} href={`/reports?${periodQuery}&report=${key}`}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${reportType === key ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <TabIcon size={14} /> {REPORT_TAB_LABELS[key]}
                </a>
              )
            })}
          </div>
        )}

        {/* Revenue report */}
        {reportType === 'revenue' && (
          <>
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

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-800">Payment Report — {periodLabel}</div>
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
          </>
        )}

        {/* Invoice report */}
        {reportType === 'invoices' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-800">Invoice Report — {periodLabel}</span>
              <span className="text-sm text-gray-500">{invoices.length} invoice(s) — {formatGHS(totalInvoiced)} total</span>
            </div>
            {invoices.length === 0 ? (
              <p className="px-5 py-10 text-center text-gray-400 text-sm">No invoices created in this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-5 py-3 font-medium text-gray-600">Invoice #</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Customer</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Order</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-5 py-3 font-medium text-gray-600 text-right">Total</th>
                    <th className="px-5 py-3 font-medium text-gray-600 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id}>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        <a href={`/invoices/${inv.id}`} className="text-blue-600 hover:text-blue-700">{inv.invoice_number}</a>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{inv.customers?.full_name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{inv.orders?.order_number ?? '—'}</td>
                      <td className="px-5 py-3 capitalize text-gray-600">{inv.status}</td>
                      <td className="px-5 py-3 text-right font-medium">{formatGHS(inv.total)}</td>
                      <td className={`px-5 py-3 text-right font-medium ${inv.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatGHS(inv.balance_due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Order report */}
        {reportType === 'orders' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-800">Order Report — {periodLabel}</span>
              <span className="text-sm text-gray-500">{orders.length} order(s)</span>
            </div>
            {orders.length === 0 ? (
              <p className="px-5 py-10 text-center text-gray-400 text-sm">No orders created in this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-5 py-3 font-medium text-gray-600">Order #</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Customer</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Event</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-5 py-3 font-medium text-gray-600 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((o: any) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        <a href={`/orders/${o.id}`} className="text-blue-600 hover:text-blue-700">{o.order_number}</a>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{o.customer_name}</td>
                      <td className="px-5 py-3 text-gray-600">{o.event_name}</td>
                      <td className="px-5 py-3 capitalize text-gray-600">{o.status}</td>
                      <td className="px-5 py-3 text-right font-medium">{formatGHS(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Frequent inventory report */}
        {reportType === 'inventory' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-800">
              Frequent Inventory Order Report — {periodLabel}
            </div>
            {inventoryRows.length === 0 ? (
              <p className="px-5 py-10 text-center text-gray-400 text-sm">No items ordered in this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-5 py-3 font-medium text-gray-600">Rank</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Item</th>
                    <th className="px-5 py-3 font-medium text-gray-600">SKU</th>
                    <th className="px-5 py-3 font-medium text-gray-600 text-center"># Orders</th>
                    <th className="px-5 py-3 font-medium text-gray-600 text-right">Total Qty Ordered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inventoryRows.map((row, i) => (
                    <tr key={row.name}>
                      <td className="px-5 py-3 text-gray-400">#{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{row.name}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{row.sku ?? '—'}</td>
                      <td className="px-5 py-3 text-center text-gray-700">{row.orderCount}</td>
                      <td className="px-5 py-3 text-right font-semibold text-indigo-600">{row.totalQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {/* Inventory Audit report — printable count sheet */}
        {reportType === 'audit' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between print:border-b-2 print:border-gray-900">
              <span className="font-semibold text-gray-800">Inventory Audit Report — {new Date().toLocaleDateString()}</span>
              <PrintButton />
            </div>
            {auditRows.length === 0 ? (
              <p className="px-5 py-10 text-center text-gray-400 text-sm">No inventory items found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left print:bg-white">
                    <th className="px-5 py-3 font-medium text-gray-600">Item</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Category</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Location</th>
                    <th className="px-5 py-3 font-medium text-gray-600 text-center">Available</th>
                    <th className="px-5 py-3 font-medium text-gray-600 text-center">Actual Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {auditRows.map(row => (
                    <tr key={row.name}>
                      <td className="px-5 py-3 font-medium text-gray-900">{row.name}</td>
                      <td className="px-5 py-3 text-gray-600">{row.category ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{row.location ?? '—'}</td>
                      <td className="px-5 py-3 text-center text-gray-700">{row.available}</td>
                      <td className="px-5 py-3 text-center">
                        <div className="w-20 h-6 border-b border-gray-300 mx-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Partial Payments report */}
        {reportType === 'partial' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between print:border-b-2 print:border-gray-900">
              <span className="font-semibold text-gray-800">Partial Payments Report — {periodLabel}</span>
              <div className="flex items-center gap-2">
                <EmailReportButton
                  title="Partial Payments Report" subtitle={periodLabel}
                  columns={['Invoice #', 'Customer', 'Order', 'Total', 'Balance']}
                  rows={invoices.map((inv: any) => [inv.invoice_number, inv.customers?.full_name ?? '—', inv.orders?.order_number ?? '—', formatGHS(inv.total), formatGHS(inv.balance_due)])}
                />
                <PrintButton />
              </div>
            </div>
            {invoices.length === 0 ? (
              <p className="px-5 py-10 text-center text-gray-400 text-sm">No partially paid invoices in this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left print:bg-white">
                    <th className="px-5 py-3 font-medium text-gray-600">Invoice #</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Customer</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Order</th>
                    <th className="px-5 py-3 font-medium text-gray-600 text-right">Total</th>
                    <th className="px-5 py-3 font-medium text-gray-600 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id}>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        <a href={`/invoices/${inv.id}`} className="text-blue-600 hover:text-blue-700">{inv.invoice_number}</a>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{inv.customers?.full_name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{inv.orders?.order_number ?? '—'}</td>
                      <td className="px-5 py-3 text-right font-medium">{formatGHS(inv.total)}</td>
                      <td className="px-5 py-3 text-right font-medium text-amber-600">{formatGHS(inv.balance_due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Full Payment report */}
        {reportType === 'full' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between print:border-b-2 print:border-gray-900">
              <span className="font-semibold text-gray-800">Full Payment Report — {periodLabel}</span>
              <div className="flex items-center gap-2">
                <EmailReportButton
                  title="Full Payment Report" subtitle={periodLabel}
                  columns={['Invoice #', 'Customer', 'Order', 'Total', 'Paid At']}
                  rows={invoices.map((inv: any) => [inv.invoice_number, inv.customers?.full_name ?? '—', inv.orders?.order_number ?? '—', formatGHS(inv.total), inv.paid_at ? formatDateTime(inv.paid_at) : '—'])}
                />
                <PrintButton />
              </div>
            </div>
            {invoices.length === 0 ? (
              <p className="px-5 py-10 text-center text-gray-400 text-sm">No fully paid invoices in this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left print:bg-white">
                    <th className="px-5 py-3 font-medium text-gray-600">Invoice #</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Customer</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Order</th>
                    <th className="px-5 py-3 font-medium text-gray-600 text-right">Total</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Paid At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id}>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        <a href={`/invoices/${inv.id}`} className="text-blue-600 hover:text-blue-700">{inv.invoice_number}</a>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{inv.customers?.full_name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{inv.orders?.order_number ?? '—'}</td>
                      <td className="px-5 py-3 text-right font-medium text-green-600">{formatGHS(inv.total)}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{inv.paid_at ? formatDateTime(inv.paid_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Override Payments report */}
        {reportType === 'override' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between print:border-b-2 print:border-gray-900">
              <span className="font-semibold text-gray-800">Override Payments Report — {periodLabel}</span>
              <div className="flex items-center gap-2">
                <EmailReportButton
                  title="Override Payments Report" subtitle={periodLabel}
                  columns={['Date', 'Customer', 'Order', 'Amount', 'Reference']}
                  rows={overridePayments.map((p: any) => [formatDateTime(p.created_at), p.customers?.full_name ?? '—', p.orders?.order_number ?? '—', formatGHS(p.amount), p.reference ?? '—'])}
                />
                <PrintButton />
              </div>
            </div>
            {overridePayments.length === 0 ? (
              <p className="px-5 py-10 text-center text-gray-400 text-sm">No override payments in this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left print:bg-white">
                    <th className="px-5 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Customer</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Order</th>
                    <th className="px-5 py-3 font-medium text-gray-600 text-right">Amount</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {overridePayments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3 text-gray-600">{formatDateTime(p.created_at)}</td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{p.customers?.full_name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{p.orders?.order_number ?? '—'}</td>
                      <td className="px-5 py-3 text-right font-semibold text-amber-600">{formatGHS(p.amount)}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{p.reference ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Completed Order report */}
        {reportType === 'completed' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between print:border-b-2 print:border-gray-900">
              <span className="font-semibold text-gray-800">Completed Order Report — {periodLabel}</span>
              <div className="flex items-center gap-2">
                <EmailReportButton
                  title="Completed Order Report" subtitle={periodLabel}
                  columns={['Order #', 'Customer', 'Event', 'Total', 'Completed']}
                  rows={completedOrders.map((o: any) => [o.order_number, o.customer_name, o.event_name, formatGHS(o.total), formatDateTime(o.updated_at)])}
                />
                <PrintButton />
              </div>
            </div>
            {completedOrders.length === 0 ? (
              <p className="px-5 py-10 text-center text-gray-400 text-sm">No completed orders in this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left print:bg-white">
                    <th className="px-5 py-3 font-medium text-gray-600">Order #</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Customer</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Event</th>
                    <th className="px-5 py-3 font-medium text-gray-600 text-right">Total</th>
                    <th className="px-5 py-3 font-medium text-gray-600">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {completedOrders.map((o: any) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        <a href={`/orders/${o.id}`} className="text-blue-600 hover:text-blue-700">{o.order_number}</a>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{o.customer_name}</td>
                      <td className="px-5 py-3 text-gray-600">{o.event_name}</td>
                      <td className="px-5 py-3 text-right font-medium">{formatGHS(o.total)}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{formatDateTime(o.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
