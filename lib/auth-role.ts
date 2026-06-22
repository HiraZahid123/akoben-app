import { createServerSupabaseClient, createAdminClient } from './supabase-server'

export type UserRole = 'admin' | 'staff'

export async function getCurrentUserRole(): Promise<UserRole> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'staff'

    const { data } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return (data?.role as UserRole) ?? 'staff'
  } catch {
    return 'staff'
  }
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, role, is_active')
    .eq('id', user.id)
    .single()

  return { ...user, profile }
}

export async function requireAdmin() {
  const role = await getCurrentUserRole()
  return role === 'admin'
}

export async function getAllStaff() {
  const admin = createAdminClient()
  const { data: profiles } = await admin
    .from('user_profiles')
    .select('id, full_name, role, is_active, created_at')
    .order('created_at')

  const { data: { users } } = await admin.auth.admin.listUsers()

  return (profiles ?? []).map(p => ({
    ...p,
    email: users.find(u => u.id === p.id)?.email ?? '',
  }))
}
