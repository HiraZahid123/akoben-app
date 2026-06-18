import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createAdminClient()

  const { data: orders, error } = await supabase
    .from('orders_with_customer')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (orders ?? []).map((o: any) => ({
    Date: o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : '',
    'Order Number': o.order_number ?? '',
    'Customer': o.customer_name ?? '',
    'Event': o.event_name ?? '',
    'Event Date': o.event_date ?? '',
    'Status': o.status ?? '',
    'Subtotal (GHS)': o.subtotal ?? 0,
    'Discount (GHS)': o.discount_amount ?? 0,
    'Tax (GHS)': o.tax_amount ?? 0,
    'Total (GHS)': o.total_amount ?? 0,
    'Amount Paid (GHS)': o.amount_paid ?? 0,
    'Balance Due (GHS)': o.balance_due ?? 0,
    'Delivery Method': o.delivery_method ?? '',
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
      'Content-Disposition': `attachment; filename="akoben-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
