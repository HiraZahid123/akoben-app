import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')
  const itemId = searchParams.get('itemId')

  if (!orderId || !itemId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('order_items').delete().eq('id', itemId).eq('order_id', orderId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.redirect(new URL(`/orders/${orderId}`, req.url))
}
