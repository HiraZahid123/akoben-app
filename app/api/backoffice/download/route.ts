import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path')
  const name = req.nextUrl.searchParams.get('name') ?? 'document'
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.storage.from('backoffice-docs').download(path)
  if (error || !data) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  return new NextResponse(data, {
    headers: {
      'Content-Disposition': `attachment; filename="${name}"`,
      'Content-Type': data.type || 'application/octet-stream',
    },
  })
}
