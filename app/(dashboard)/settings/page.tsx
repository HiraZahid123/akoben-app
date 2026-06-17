import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: settings } = await supabase
    .from('business_settings')
    .select('*')
    .limit(1)
    .single()

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Settings" subtitle="Business configuration" />
      <div className="flex-1 overflow-auto p-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  )
}
