import { NextResponse } from 'next/server'
import { getCurrentUserRole, getCurrentUserOverridePermission, getCurrentUser } from '@/lib/auth-role'

export async function GET() {
  const [role, canOverridePayment, user] = await Promise.all([
    getCurrentUserRole(),
    getCurrentUserOverridePermission(),
    getCurrentUser(),
  ])
  return NextResponse.json({
    role,
    canOverridePayment,
    // Booking-confirm and release-below-100% overrides are restricted to Manager/Admin only —
    // per client policy (2026-07), not a per-account grantable permission.
    canOverrideBookingRelease: role === 'admin' || role === 'manager',
    fullName: user?.profile?.full_name ?? user?.email ?? 'Unknown staff',
  })
}
