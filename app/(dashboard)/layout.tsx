import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Sidebar from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/ToastProvider'
import PageLoader from '@/components/ui/PageLoader'
import { getCurrentUserRole } from '@/lib/auth-role'
import type { UserRole } from '@/lib/auth-role'
import { ROLE_PERMISSIONS, type ModulePermissions } from '@/lib/permissions'

const ROUTE_MODULE: { prefix: string; module: keyof Omit<ModulePermissions, 'overridePrivilege'> }[] = [
  { prefix: '/orders', module: 'orders' },
  { prefix: '/inventory', module: 'inventory' },
  { prefix: '/customers', module: 'customers' },
  { prefix: '/scanner', module: 'scanner' },
  { prefix: '/quotes', module: 'quotes' },
  { prefix: '/invoices', module: 'invoices' },
  { prefix: '/calendar', module: 'calendar' },
  { prefix: '/delivery', module: 'delivery' },
  { prefix: '/reports', module: 'reports' },
  { prefix: '/crm', module: 'crm' },
  { prefix: '/backoffice', module: 'backoffice' },
  { prefix: '/settings', module: 'settings' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role: UserRole = await getCurrentUserRole()
  const permissions = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.staff1

  // Redirect away from any module the current role has no access to
  const pathname = (await headers()).get('x-pathname') ?? ''
  const matchedRoute = ROUTE_MODULE.find(r => pathname.startsWith(r.prefix))
  if (matchedRoute && permissions[matchedRoute.module] === 'none') {
    redirect('/dashboard')
  }

  return (
    <ToastProvider>
      <PageLoader />
      <div className="flex h-screen overflow-hidden">
        <Sidebar role={role} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
