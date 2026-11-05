import { SignupForm } from '@/components/signup-form'
import { RedirectIfAuthenticated } from '@/components/redirect-if-authenticated'
import { ListMusic } from 'lucide-react'
import { Suspense } from 'react'

export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <Suspense>
        <RedirectIfAuthenticated />
      </Suspense>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <ListMusic className="size-4" />
          </div>
          Music Diary
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
