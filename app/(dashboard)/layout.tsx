import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Sidebar from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/ToastProvider'
import PageLoader from '@/components/ui/PageLoader'
import { getCurrentUserRole } from '@/lib/auth-role'
import type { UserRole } from '@/lib/auth-role'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role: UserRole = await getCurrentUserRole()

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
