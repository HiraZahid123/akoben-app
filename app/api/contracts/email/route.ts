import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createAdminClient } from '@/lib/supabase-server'
import ContractPDF from '@/lib/pdf/ContractPDF'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { orderId, to } = await req.json()
    if (!orderId || !to) return NextResponse.json({ error: 'Missing orderId or to' }, { status: 400 })

    const supabase = createAdminClient()
    const [{ data: order }, { data: business }] = await Promise.all([
      supabase.from('orders').select('*, customers(*), order_items(*, inventory_items(name))').eq('id', orderId).single(),
      supabase.from('business_settings').select('*').limit(1).single(),
    ])
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const customer = (order as any).customers
    const orderItems = (order as any).order_items ?? []

    const buffer = await renderToBuffer(
      createElement(ContractPDF, { order, customer, orderItems, business }) as any
    )

    await sendEmail({
      to,
      subject: `Rental Agreement — ${(order as any).order_number} — Akoben Event Rentals`,
      html: `<p>Dear ${customer?.full_name ?? 'Customer'},</p><p>Please find attached the rental agreement for order <strong>${(order as any).order_number}</strong>.</p><p>Thank you for choosing Akoben Event Rentals!</p>`,
      attachments: [{ filename: `contract-${(order as any).order_number}.pdf`, content: buffer }],
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Contract email error:', error)
    return NextResponse.json({ error: error.message ?? 'Failed to send contract' }, { status: 500 })
  }
}
