'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',  icon: '📊' },
  { href: '/orders',     label: 'Orders',      icon: '📋' },
  { href: '/inventory',  label: 'Inventory',   icon: '📦' },
  { href: '/customers',  label: 'Customers',   icon: '👥' },
  { href: '/quotes',     label: 'Quotes',      icon: '💬' },
  { href: '/invoices',   label: 'Invoices',    icon: '🧾' },
  { href: '/contracts',  label: 'Contracts',   icon: '📝' },
  { href: '/scanner',    label: 'Scanner',     icon: '📷' },
  { href: '/crm',        label: 'CRM',         icon: '📞' },
  { href: '/settings',   label: 'Settings',    icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()

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
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="text-xs text-slate-400 hover:text-white transition-colors">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
