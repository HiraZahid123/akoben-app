import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createAdminClient } from '@/lib/supabase-server'
import ContractPDF from '@/lib/pdf/ContractPDF'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: order }, { data: business }] = await Promise.all([
    supabase.from('orders')
      .select('*, customers(*), order_items(*, inventory_items(name))')
      .eq('id', id).single(),
    supabase.from('business_settings').select('*').limit(1).single(),
  ])

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const customer = (order as any).customers
  const orderItems = (order as any).order_items ?? []

  const buffer = await renderToBuffer(
    createElement(ContractPDF, { order, orderItems, customer, business }) as any
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contract-${(order as any).order_number ?? id}.pdf"`,
    },
  })
}
