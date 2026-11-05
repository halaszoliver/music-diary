import { Suspense } from 'react'

import { getCurrentUser } from '@/lib/session'

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Greeting />
      </Suspense>
    </main>
  )
}

async function Greeting() {
  const user = await getCurrentUser()
  return <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
}
