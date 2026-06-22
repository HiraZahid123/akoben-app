import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { getCurrentUserRole } from '@/lib/auth-role'

export async function GET() {
  const role = await getCurrentUserRole()
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data: profiles } = await admin.from('user_profiles').select('*').order('created_at')
  const { data: { users } } = await admin.auth.admin.listUsers()

  const staff = (profiles ?? []).map(p => ({
    ...p,
    email: users.find((u: any) => u.id === p.id)?.email ?? '',
  }))

  return NextResponse.json(staff)
}

export async function POST(req: NextRequest) {
  const role = await getCurrentUserRole()
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, full_name, staffRole, password } = await req.json()
  if (!email || !full_name || !password) {
    return NextResponse.json({ error: 'Email, name, and password are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: newUser, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: staffRole ?? 'staff' },
  })

  if (userErr || !newUser.user) {
    return NextResponse.json({ error: userErr?.message ?? 'Failed to create user' }, { status: 400 })
  }

  await admin.from('user_profiles').upsert({
    id: newUser.user.id,
    full_name,
    role: staffRole ?? 'staff',
    is_active: true,
  })

  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const role = await getCurrentUserRole()
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, is_active, staffRole } = await req.json()
  const admin = createAdminClient()

  const update: any = {}
  if (is_active !== undefined) update.is_active = is_active
  if (staffRole !== undefined) update.role = staffRole

  await admin.from('user_profiles').update(update).eq('id', id)
  return NextResponse.json({ success: true })
}
