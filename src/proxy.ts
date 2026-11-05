import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_ROUTES = ['/login', '/signup']

// Optimistic check: only verifies the session cookie exists.
// Pages that need a guaranteed valid session must still call auth.api.getSession.
// Logged-in users hitting /login or /signup are redirected by those pages, not here,
// so a stale cookie can't cause a redirect loop.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = getSessionCookie(request) !== null
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  if (!hasSession && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip API routes, Next internals and static files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
