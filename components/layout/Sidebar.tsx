'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/lib/auth-role'
import { ROLE_PERMISSIONS, ROLE_LABELS, type ModulePermissions } from '@/lib/permissions'

const NAV_ITEMS: { href: string; label: string; icon: string; module: keyof Omit<ModulePermissions, 'overridePrivilege'> }[] = [
  { href: '/dashboard',  label: 'Dashboard',   icon: '📊', module: 'dashboard' },
  { href: '/orders',     label: 'Orders',      icon: '📋', module: 'orders' },
  { href: '/inventory',  label: 'Inventory',   icon: '📦', module: 'inventory' },
  { href: '/customers',  label: 'Customers',   icon: '👥', module: 'customers' },
  { href: '/scanner',    label: 'Scanner',     icon: '📷', module: 'scanner' },
  { href: '/quotes',     label: 'Quotes',      icon: '💬', module: 'quotes' },
  { href: '/invoices',   label: 'Invoices',    icon: '🧾', module: 'invoices' },
  { href: '/calendar',   label: 'Calendar',    icon: '📅', module: 'calendar' },
  { href: '/delivery',   label: 'Delivery',    icon: '🚚', module: 'delivery' },
  { href: '/reports',    label: 'Reports',     icon: '📈', module: 'reports' },
  { href: '/contracts',  label: 'Contracts',   icon: '📝', module: 'orders' },
  { href: '/crm',        label: 'CRM',         icon: '📞', module: 'crm' },
  { href: '/backoffice', label: 'Back Office', icon: '🗄️', module: 'backoffice' },
  { href: '/help',       label: 'Help & Guide', icon: '❓', module: 'dashboard' },
  { href: '/settings',   label: 'Settings',    icon: '⚙️', module: 'settings' },
]

export default function Sidebar({ role = 'staff1' }: { role?: UserRole }) {
  const pathname = usePathname()
  const permissions = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.staff1
  const navItems = NAV_ITEMS.filter(item => permissions[item.module] !== 'none')

  return (
    <aside className="w-60 bg-[#0f172a] text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">A</div>
          <div>
            <div className="font-semibold text-sm leading-tight">Akoben Rentals</div>
            <div className="text-[10px] text-slate-400 leading-tight">Cape Coast, Ghana</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const access = permissions[item.module]
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </span>
              {(access === 'view' || access === 'limited') && (
                <span className="text-[9px] uppercase tracking-wide text-slate-500">{access}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">{ROLE_LABELS[role] ?? role}</span>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="text-xs text-slate-400 hover:text-white transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
