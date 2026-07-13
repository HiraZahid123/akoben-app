import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createAdminClient } from '@/lib/supabase-server'
import QuotePDF from '@/lib/pdf/QuotePDF'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: quote }, { data: business }] = await Promise.all([
    supabase.from('quotes')
      .select('*, customers(*), quote_items(*, inventory_items(name))')
      .eq('id', id).single(),
    supabase.from('business_settings').select('*').limit(1).single(),
  ])

  if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })

  const customer = (quote as any).customers
  const quoteItems = (quote as any).quote_items ?? []

  const buffer = await renderToBuffer(
    createElement(QuotePDF, { quote, quoteItems, customer, business }) as any
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="quote-${(quote as any).quote_number ?? id}.pdf"`,
    },
  })
}
