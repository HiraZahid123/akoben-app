import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import SettingsForm from './SettingsForm'
import IntegrationsPanel from './IntegrationsPanel'
import StaffManagement from './StaffManagement'
import { getCurrentUserRole } from '@/lib/auth-role'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const role = await getCurrentUserRole()
  if (role !== 'admin' && role !== 'manager') redirect('/dashboard')

  const supabase = await createServerSupabaseClient()

  const { data: settings } = await supabase
    .from('business_settings')
    .select('*')
    .limit(1)
    .single()

  const paystackConfigured = !!process.env.PAYSTACK_SECRET_KEY

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Settings" subtitle="Business configuration" />
      <div className="flex-1 overflow-auto p-6 space-y-8">
        {role === 'admin' && <SettingsForm settings={settings} />}
        <StaffManagement currentUserRole={role} />
        {role === 'admin' && <IntegrationsPanel paystackConfigured={paystackConfigured} />}
      </div>
    </div>
  )
}
