import { headers } from 'next/headers'

// Server-only — derives the app's own origin from the incoming request instead of
// window.location.origin, which is undefined during server rendering and would bake an
// empty/relative URL into links shared with customers (WhatsApp, email) before hydration.
export async function getBaseUrl() {
  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
