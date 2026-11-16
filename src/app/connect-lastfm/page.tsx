import { ListMusic } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { lastfmAuthUrl } from '@/lib/lastfm'
import { getCurrentUser } from '@/lib/session'

const ERRORS: Record<string, string> = {
  missing_token: 'Last.fm did not return a token. Please try again.',
  lastfm: 'Could not verify your Last.fm account. Please try again.',
  taken: 'This Last.fm account is already linked to another user.',
}

export default function ConnectLastfmPage({
  searchParams,
}: PageProps<'/connect-lastfm'>) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <ListMusic className="size-4" />
          </div>
          Music Diary
        </div>
        <Suspense>
          <ConnectPrompt searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}

// Reads the session, so it streams in behind the boundary.
// Already-connected users skip straight to the app.
async function ConnectPrompt({
  searchParams,
}: Pick<PageProps<'/connect-lastfm'>, 'searchParams'>) {
  const user = await getCurrentUser()
  if (user.lastfmUsername) {
    redirect('/')
  }

  const { error } = await searchParams
  const errorMessage =
    typeof error === 'string' ? (ERRORS[error] ?? ERRORS.lastfm) : null

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Connect your Last.fm account</CardTitle>
        <CardDescription>
          Link Last.fm to import your listening history into your charts.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {errorMessage && (
          <p role="alert" className="text-destructive text-center text-sm">
            {errorMessage}
          </p>
        )}
        <Button nativeButton={false} render={<a href={lastfmAuthUrl()} />}>
          Connect
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/" />}
        >
          Later
        </Button>
      </CardContent>
    </Card>
  )
}
