import Link from 'next/link'
import AuthForm from '@/components/auth/AuthForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <div className="text-2xl mb-2">📓</div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--n-text)' }}>Daily Debriefer</h1>
          <p className="text-sm" style={{ color: 'var(--n-text3)' }}>Your private leadership journal.</p>
        </div>
        <div className="rounded-lg p-6 space-y-5" style={{ border: '1px solid var(--n-border)', background: 'var(--n-sidebar)' }}>
          <h2 className="text-sm font-medium" style={{ color: 'var(--n-text2)' }}>Sign in to continue</h2>
          <AuthForm mode="login" />
        </div>
        <p className="text-center text-sm" style={{ color: 'var(--n-text3)' }}>
          No account?{' '}
          <Link href="/signup" className="hover:underline" style={{ color: 'var(--n-blue)' }}>Create one</Link>
        </p>
      </div>
    </div>
  )
}
