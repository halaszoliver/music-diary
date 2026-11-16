import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/db'
import { user } from '@/db/schemas/auth'
import { auth } from '@/lib/auth'
import { getLastfmUsername } from '@/lib/lastfm'

// Last.fm redirects here after the user approves: ?token=<token>
export async function GET(request: NextRequest) {
  const fail = (error: string) =>
    NextResponse.redirect(new URL(`/connect-lastfm?error=${error}`, request.url))

  // /api is outside the proxy matcher, so check the session here.
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return fail('missing_token')
  }

  let username: string
  try {
    username = await getLastfmUsername(token)
  } catch (err) {
    console.error(err)
    return fail('lastfm')
  }

  try {
    await db
      .update(user)
      .set({ lastfmUsername: username })
      .where(eq(user.id, session.user.id))
  } catch (err) {
    // 23505 = unique_violation: Last.fm account already linked to another user
    const e = err as { code?: string; cause?: { code?: string } }
    if ((e.cause?.code ?? e.code) === '23505') {
      return fail('taken')
    }
    throw err
  }

  return NextResponse.redirect(new URL('/', request.url))
}
