import { NextResponse } from 'next/server'
import { getCurrentUserRole, getCurrentUserOverridePermission } from '@/lib/auth-role'

export async function GET() {
  const [role, canOverridePayment] = await Promise.all([
    getCurrentUserRole(),
    getCurrentUserOverridePermission(),
  ])
  return NextResponse.json({ role, canOverridePayment })
}
