import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference')
  const paystackKey = process.env.PAYSTACK_SECRET_KEY

  if (!reference || !paystackKey) {
    return NextResponse.redirect(new URL('/orders?paystack=error', req.url))
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${paystackKey}` },
  })
  const data = await res.json()

  if (!data.status || data.data.status !== 'success') {
    return NextResponse.redirect(new URL('/orders?paystack=failed', req.url))
  }

  const supabase = createAdminClient()
  const meta = data.data.metadata ?? {}
  const orderId = meta.order_id
  const invoiceId = meta.invoice_id

  // Update the pending payment record to confirmed
  await supabase.from('payments')
    .update({ notes: 'Paystack — confirmed', payment_type: 'final' })
    .eq('reference', reference)

  // Update invoice status to paid if applicable
  if (invoiceId) {
    await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoiceId)
  }

  return NextResponse.redirect(new URL(`/orders/${orderId}?paystack=success`, req.url))
}
