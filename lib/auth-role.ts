import { createServerSupabaseClient, createAdminClient } from './supabase-server'
import { roleHasOverridePrivilege, type UserRole as PermissionRole } from './permissions'

export type UserRole = PermissionRole

// Legacy DB role values from before the staff permissions matrix — normalize to the new role set
const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  staff: 'staff1',
  pickup_crew: 'setup_crew',
}

function normalizeRole(raw: string | null | undefined): UserRole {
  if (!raw) return 'staff1'
  return (LEGACY_ROLE_MAP[raw] ?? raw) as UserRole
}

export async function getCurrentUserRole(): Promise<UserRole> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'staff1'

    const { data } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return normalizeRole(data?.role)
  } catch {
    return 'staff1'
  }
}

export async function getCurrentUserOverridePermission(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
      .from('user_profiles')
      .select('can_override_payment, role')
      .eq('id', user.id)
      .single()

    const role = normalizeRole(data?.role)
    return roleHasOverridePrivilege(role) || (data?.can_override_payment ?? false)
  } catch {
    return false
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
    .select('id, full_name, role, is_active, can_override_payment, created_at')
    .order('created_at')

  const { data: { users } } = await admin.auth.admin.listUsers()

  return (profiles ?? []).map(p => ({
    ...p,
    email: users.find(u => u.id === p.id)?.email ?? '',
  }))
}
