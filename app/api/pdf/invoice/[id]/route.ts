import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createAdminClient } from '@/lib/supabase-server'
import InvoicePDF from '@/lib/pdf/InvoicePDF'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: invoice }, { data: business }] = await Promise.all([
    supabase.from('invoices')
      .select('*, customers(*), orders(*, order_items(*, inventory_items(name)))')
      .eq('id', id).single(),
    supabase.from('business_settings').select('*').limit(1).single(),
  ])

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const { data: payments } = await supabase.from('payments').select('amount').eq('invoice_id', id)

  const order = (invoice as any).orders
  const orderItems = order?.order_items ?? []
  const customer = (invoice as any).customers

  const buffer = await renderToBuffer(
    createElement(InvoicePDF, { invoice, order, orderItems, customer, business, payments: payments ?? [] }) as any
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${(invoice as any).invoice_number ?? id}.pdf"`,
    },
  })
}
