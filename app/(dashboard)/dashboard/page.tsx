import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatGHS } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  // Fetch stats in parallel
  const [
    { count: totalOrders },
    { count: activeOrders },
    { count: overdueOrders },
    { count: totalCustomers },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }).not('status', 'in', '(draft,cancelled)'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Total Orders',    value: totalOrders ?? 0,    color: 'bg-blue-50 text-blue-700' },
    { label: 'Active Rentals',  value: activeOrders ?? 0,   color: 'bg-green-50 text-green-700' },
    { label: 'Overdue',         value: overdueOrders ?? 0,  color: 'bg-red-50 text-red-700' },
    { label: 'Total Customers', value: totalCustomers ?? 0, color: 'bg-orange-50 text-orange-700' },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Akoben Event Rentals — Cape Coast, Ghana</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className={`rounded-xl p-5 ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.value}{(stat as any).suffix}</div>
            <div className="text-sm mt-1 opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/orders/new',    label: 'New Order',    icon: '📋' },
          { href: '/quotes/new',    label: 'New Quote',    icon: '💬' },
          { href: '/customers/new', label: 'New Customer', icon: '👤' },
          { href: '/scanner',       label: 'Scan Item',    icon: '📷' },
        ].map(action => (
          <a
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
          >
            <span className="text-2xl">{action.icon}</span>
            <span className="font-medium text-gray-800">{action.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
