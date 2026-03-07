import Link from 'next/link'
import AuthForm from '@/components/auth/AuthForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <div className="text-3xl mb-1">◆</div>
          <h1 className="text-2xl font-semibold tracking-tight">Daily Debriefer</h1>
          <p className="text-sm text-neutral-500">Your private leadership journal.</p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 space-y-6">
          <h2 className="text-sm font-medium text-neutral-300">Sign in</h2>
          <AuthForm mode="login" />
        </div>

        <p className="text-center text-sm text-neutral-500">
          No account?{' '}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
