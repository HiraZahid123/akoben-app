import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import QuotesTable from './QuotesTable'
export default async function QuotesPage() {
  const supabase = await createServerSupabaseClient()

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, customers(full_name, company_name, email)')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Quotes"
        subtitle={`${quotes?.length ?? 0} quotes`}
        action={
          <a href="/quotes/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + New Quote
          </a>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <QuotesTable quotes={quotes ?? []} />
      </div>
    </div>
  )
}
