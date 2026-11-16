import { type NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'

// Revokes the session in the DB and clears the auth cookies, then sends the user to /login.
async function logout(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url), 303)

  try {
    const { headers } = await auth.api.signOut({
      headers: request.headers,
      returnHeaders: true,
    })
    for (const cookie of headers.getSetCookie()) {
      response.headers.append('set-cookie', cookie)
    }
  } catch {
    // No valid session (already logged out / expired): nothing to revoke.
  }

  return response
}

export { logout as GET, logout as POST }
