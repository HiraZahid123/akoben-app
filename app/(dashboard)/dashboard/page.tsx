import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  ClipboardList, PackageCheck, AlertTriangle, Users,
  FilePlus2, MessageSquarePlus, UserPlus, ScanLine, type LucideIcon,
} from 'lucide-react'

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

  const stats: { label: string; value: number; icon: LucideIcon; iconBg: string; iconColor: string }[] = [
    { label: 'Total Orders',    value: totalOrders ?? 0,    icon: ClipboardList, iconBg: 'bg-blue-50',   iconColor: 'text-blue-600' },
    { label: 'Active Rentals',  value: activeOrders ?? 0,   icon: PackageCheck,  iconBg: 'bg-green-50',  iconColor: 'text-green-600' },
    { label: 'Overdue',         value: overdueOrders ?? 0,  icon: AlertTriangle, iconBg: 'bg-red-50',    iconColor: 'text-red-600' },
    { label: 'Total Customers', value: totalCustomers ?? 0, icon: Users,         iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
  ]

  const quickActions: { href: string; label: string; icon: LucideIcon; iconBg: string; iconColor: string }[] = [
    { href: '/orders/new',    label: 'New Order',    icon: FilePlus2,        iconBg: 'bg-blue-50',   iconColor: 'text-blue-600' },
    { href: '/quotes/new',    label: 'New Quote',    icon: MessageSquarePlus, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
    { href: '/customers/new', label: 'New Customer', icon: UserPlus,         iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
    { href: '/scanner',       label: 'Scan Item',    icon: ScanLine,         iconBg: 'bg-green-50',  iconColor: 'text-green-600' },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Akoben Event Rentals — Cape Coast, Ghana</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                <Icon size={20} className={stat.iconColor} strokeWidth={2} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 leading-none">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1.5">{stat.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map(action => {
            const Icon = action.icon
            return (
              <a
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${action.iconBg}`}>
                  <Icon size={18} className={action.iconColor} strokeWidth={2} />
                </div>
                <span className="font-medium text-gray-800 text-sm">{action.label}</span>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
