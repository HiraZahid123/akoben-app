import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const path = req.nextUrl.searchParams.get('path')
  if (!id || !path) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  await supabase.storage.from('backoffice-docs').remove([path])
  await supabase.from('backoffice_documents').delete().eq('id', id)

  return NextResponse.redirect(new URL('/backoffice', req.url))
}
