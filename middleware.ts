import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  // Contract, Quote, and Invoice PDF links are shared directly with customers via WhatsApp/email —
  // they must not require a portal login. IDs are UUIDs, so these aren't guessable/enumerable.
  '/api/pdf/contract',
  '/api/pdf/quote',
  '/api/pdf/invoice',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public landing page — exact match only (not a prefix, or every route would be public)
  if (pathname === '/') {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Fast cookie check — no Supabase client, no network call
  // Supabase SSR sets a cookie starting with "sb-" containing the session
  const hasSbCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

  if (!hasSbCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
