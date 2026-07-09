import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const WORKFLOW = [
  { n: '01', title: 'Quote', body: 'Draft a rental quote for the client and send it for approval.' },
  { n: '02', title: 'Order', body: 'Accepted quotes convert straight into a confirmed order.' },
  { n: '03', title: 'Invoice', body: 'An invoice is generated automatically, deposits and balances tracked.' },
  { n: '04', title: 'Book', body: 'Once 50% is paid, the event locks onto the calendar.' },
  { n: '05', title: 'Pull', body: 'Crew scans items out on pickup day — inventory updates live.' },
  { n: '06', title: 'Return', body: 'Items are checked back in and the order closes out.' },
]

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const { count: itemCount } = await supabase
    .from('inventory_items')
    .select('id', { count: 'exact', head: true })

  return (
    <div className="min-h-screen bg-[#f6f1e7] text-[#161311]">
      {/* Top bar */}
      <header className="border-b border-[#161311]/15">
        <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <span className="font-display text-lg tracking-tight">Akoben</span>
          <a
            href="/login"
            className="text-xs uppercase tracking-[0.18em] font-medium border border-[#161311] px-4 py-2 hover:bg-[#161311] hover:text-[#f6f1e7] transition-colors"
          >
            Staff Login →
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-14">
        <p className="text-xs uppercase tracking-[0.25em] text-[#8a5a34] font-medium mb-6">
          Event Rental Operations — Cape Coast, Ghana
        </p>
        <h1 className="font-display text-[13vw] leading-[0.95] md:text-[6.5rem] md:leading-[0.92] tracking-tight max-w-4xl">
          Rentals, run
          <br />
          <span className="italic text-[#8a5a34]">properly.</span>
        </h1>
        <p className="mt-8 max-w-md text-[#161311]/70 text-base leading-relaxed">
          From first quote to final check-in — Akoben Event Rentals runs the
          whole job: inventory, invoicing, delivery, and the paperwork nobody
          wants to chase down twice.
        </p>
      </section>

      {/* Stat strip */}
      <section className="border-y border-[#161311]/15">
        <div className="max-w-6xl mx-auto grid grid-cols-3 divide-x divide-[#161311]/15">
          {[
            { value: itemCount ?? '—', label: 'Inventory Items Tracked' },
            { value: '50%', label: 'Deposit To Lock A Booking' },
            { value: '1', label: 'System, Start To Return' },
          ].map(stat => (
            <div key={stat.label} className="px-6 md:px-10 py-10">
              <div className="font-display text-4xl md:text-5xl">{stat.value}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.14em] text-[#161311]/55">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow index */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20">
        <p className="text-xs uppercase tracking-[0.25em] text-[#8a5a34] font-medium mb-10">
          How a booking moves
        </p>
        <div className="divide-y divide-[#161311]/15 border-t border-b border-[#161311]/15">
          {WORKFLOW.map(step => (
            <div
              key={step.n}
              className="grid grid-cols-[3.5rem_1fr] md:grid-cols-[6rem_10rem_1fr] items-baseline gap-4 md:gap-8 py-6"
            >
              <span className="font-display text-2xl text-[#8a5a34]">{step.n}</span>
              <span className="font-display text-xl md:text-2xl">{step.title}</span>
              <span className="text-sm text-[#161311]/65 leading-relaxed md:max-w-md">
                {step.body}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#161311]/15">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="font-display text-xl">Akoben Event Rentals</p>
            <p className="text-sm text-[#161311]/55 mt-1">Cape Coast, Central Region, Ghana</p>
          </div>
          <a
            href="/login"
            className="text-xs uppercase tracking-[0.18em] font-medium border border-[#161311] px-4 py-2 hover:bg-[#161311] hover:text-[#f6f1e7] transition-colors self-start md:self-auto"
          >
            Staff Login →
          </a>
        </div>
      </footer>
    </div>
  )
}
