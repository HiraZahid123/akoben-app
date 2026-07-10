'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, Package, Users, ScanLine,
  MessageSquare, Receipt, Calendar, Truck, BarChart3,
  FileText, Phone, Archive, HelpCircle, Settings, LogOut, type LucideIcon,
} from 'lucide-react'
import type { UserRole } from '@/lib/auth-role'
import { ROLE_PERMISSIONS, ROLE_LABELS, type ModulePermissions } from '@/lib/permissions'

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon; module: keyof Omit<ModulePermissions, 'overridePrivilege'> }[] = [
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard, module: 'dashboard' },
  { href: '/orders',     label: 'Orders',      icon: ClipboardList,   module: 'orders' },
  { href: '/inventory',  label: 'Inventory',   icon: Package,         module: 'inventory' },
  { href: '/customers',  label: 'Customers',   icon: Users,           module: 'customers' },
  { href: '/scanner',    label: 'Scanner',     icon: ScanLine,        module: 'scanner' },
  { href: '/quotes',     label: 'Quotes',      icon: MessageSquare,   module: 'quotes' },
  { href: '/invoices',   label: 'Invoices',    icon: Receipt,         module: 'invoices' },
  { href: '/calendar',   label: 'Calendar',    icon: Calendar,        module: 'calendar' },
  { href: '/delivery',   label: 'Delivery',    icon: Truck,           module: 'delivery' },
  { href: '/reports',    label: 'Reports',     icon: BarChart3,       module: 'reports' },
  { href: '/contracts',  label: 'Contracts',   icon: FileText,        module: 'orders' },
  { href: '/crm',        label: 'CRM',         icon: Phone,           module: 'crm' },
  { href: '/backoffice', label: 'Back Office', icon: Archive,         module: 'backoffice' },
  { href: '/help',       label: 'Help & Guide', icon: HelpCircle,     module: 'dashboard' },
  { href: '/settings',   label: 'Settings',    icon: Settings,        module: 'settings' },
]

export default function Sidebar({ role = 'staff1' }: { role?: UserRole }) {
  const pathname = usePathname()
  const permissions = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.staff1
  const navItems = NAV_ITEMS.filter(item => permissions[item.module] !== 'none')

  return (
    <aside className="print:hidden w-60 bg-[#0f172a] text-white flex flex-col shrink-0">
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
      <nav className="sidebar-scroll flex-1 overflow-y-auto py-3">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const access = permissions[item.module]
          const Icon = item.icon
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
                <Icon size={17} strokeWidth={2} className="shrink-0" />
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
            <button type="submit" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
              <LogOut size={13} />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
