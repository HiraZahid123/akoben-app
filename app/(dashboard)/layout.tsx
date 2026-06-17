import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'

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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1a1a2e] text-white flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="font-bold text-lg leading-tight">Akoben</div>
          <div className="text-xs text-gray-400 mt-0.5">Event Rentals</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
