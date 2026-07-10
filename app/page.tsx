import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  MessageSquare, ClipboardList, Receipt, CalendarCheck, Truck, PackageCheck,
  Package, Percent, Layers, ArrowRight, type LucideIcon,
} from 'lucide-react'

const WORKFLOW: { n: string; title: string; body: string; icon: LucideIcon }[] = [
  { n: '01', title: 'Quote', body: 'Draft a rental quote for the client and send it for approval.', icon: MessageSquare },
  { n: '02', title: 'Order', body: 'Accepted quotes convert straight into a confirmed order.', icon: ClipboardList },
  { n: '03', title: 'Invoice', body: 'An invoice is generated automatically, deposits and balances tracked.', icon: Receipt },
  { n: '04', title: 'Book', body: 'Once 50% is paid, the event locks onto the calendar.', icon: CalendarCheck },
  { n: '05', title: 'Pull', body: 'Crew scans items out on pickup day — inventory updates live.', icon: Truck },
  { n: '06', title: 'Return', body: 'Items are checked back in and the order closes out.', icon: PackageCheck },
]

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const { count: itemCount } = await supabase
    .from('inventory_items')
    .select('id', { count: 'exact', head: true })

  const stats: { value: string | number; label: string; icon: LucideIcon }[] = [
    { value: itemCount ?? 0, label: 'Inventory Items Tracked', icon: Package },
    { value: '50%', label: 'Deposit To Lock A Booking', icon: Percent },
    { value: '1', label: 'System, Start To Return', icon: Layers },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">A</div>
            <div>
              <div className="font-semibold text-sm leading-tight text-gray-900">Akoben Rentals</div>
              <div className="text-[10px] text-gray-400 leading-tight">Cape Coast, Ghana</div>
            </div>
          </div>
          <a
            href="/login"
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Staff Login <ArrowRight size={14} />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-14">
        <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-4">
          Event Rental Operations — Cape Coast, Ghana
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-2xl text-gray-900">
          Rentals, run properly.
        </h1>
        <p className="mt-5 max-w-lg text-gray-500 text-base leading-relaxed">
          From first quote to final check-in — Akoben Event Rentals runs the
          whole job: inventory, invoicing, delivery, and the paperwork nobody
          wants to chase down twice.
        </p>
        <a
          href="/login"
          className="mt-7 inline-flex items-center gap-1.5 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Go to Staff Login <ArrowRight size={15} />
        </a>
      </section>

      {/* Stat cards */}
      <section className="max-w-6xl mx-auto px-6 pb-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-blue-600" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 leading-none">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-1.5">{stat.label}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Workflow */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">How a booking moves</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {WORKFLOW.map(step => {
            const Icon = step.icon
            return (
              <div key={step.n} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-gray-600" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">{step.n}</div>
                    <div className="font-semibold text-gray-900">{step.title}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center font-bold text-xs text-white">A</div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Akoben Event Rentals</p>
              <p className="text-xs text-gray-400">Cape Coast, Central Region, Ghana</p>
            </div>
          </div>
          <a
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Staff Login <ArrowRight size={14} />
          </a>
        </div>
      </footer>
    </div>
  )
}
