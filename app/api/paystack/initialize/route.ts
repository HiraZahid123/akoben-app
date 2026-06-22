import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const paystackKey = process.env.PAYSTACK_SECRET_KEY
  if (!paystackKey) {
    return NextResponse.json({ error: 'Paystack is not configured. Add PAYSTACK_SECRET_KEY to your environment variables.' }, { status: 503 })
  }

  const { invoiceId, orderId, customerId, email, amount, customerName, invoiceNumber } = await req.json()
  if (!email || !amount || !orderId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const amountKobo = Math.round(amount * 100) // Paystack uses kobo (GHS pesewas)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paystackKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      currency: 'GHS',
      reference: `AKB-${invoiceNumber ?? orderId}-${Date.now()}`,
      callback_url: `${appUrl}/api/paystack/verify`,
      metadata: {
        order_id: orderId,
        invoice_id: invoiceId ?? null,
        customer_name: customerName,
        invoice_number: invoiceNumber,
      },
    }),
  })

  const data = await res.json()
  if (!data.status) {
    return NextResponse.json({ error: data.message ?? 'Paystack error' }, { status: 400 })
  }

  // Store the reference in the DB so we can match it on callback
  const supabase = createAdminClient()
  await supabase.from('payments').insert({
    order_id: orderId,
    invoice_id: invoiceId ?? null,
    customer_id: customerId,
    amount,
    payment_type: 'final' as any,
    method: 'card' as any,
    reference: data.data.reference,
    notes: 'Paystack — awaiting confirmation',
  })

  return NextResponse.json({ authorization_url: data.data.authorization_url, reference: data.data.reference })
}
