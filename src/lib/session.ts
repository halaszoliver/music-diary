import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'

export type User = {
  id: string
  name: string
  email: string
}

// Private cache: reads request headers, result stays per-user in the browser,
// never stored in a shared server cache.
export async function getOptionalUser(): Promise<User | null> {
  'use cache: private'

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return null
  }

  const { id, name, email } = session.user
  return { id, name, email }
}

export async function getCurrentUser(): Promise<User> {
  const user = await getOptionalUser()
  if (!user) {
    redirect('/login')
  }
  return user
}
