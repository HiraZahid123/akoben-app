import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createAdminClient()

  const { data: payments, error } = await supabase
    .from('payments')
    .select('*, orders(order_number, event_name), customers(full_name, company_name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (payments ?? []).map((p: any) => ({
    Date: p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : '',
    'Order Number': p.orders?.order_number ?? '',
    'Event': p.orders?.event_name ?? '',
    'Customer': p.customers?.company_name ?? p.customers?.full_name ?? '',
    'Payment Type': p.payment_type ?? '',
    'Method': p.method ?? '',
    'Amount (GHS)': p.amount ?? 0,
    'Reference': p.reference ?? '',
    'Notes': p.notes ?? '',
  }))

  const headers = Object.keys(rows[0] ?? {})
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = String((row as any)[h] ?? '').replace(/"/g, '""')
        return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val}"` : val
      }).join(',')
    ),
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="akoben-payments-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
