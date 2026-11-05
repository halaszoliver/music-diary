import { redirect } from 'next/navigation'

import { getOptionalUser } from '@/lib/session'

// Render inside <Suspense> so the rest of the page stays in the static shell.
export async function RedirectIfAuthenticated() {
  const user = await getOptionalUser()
  if (user) {
    redirect('/')
  }
  return null
}
