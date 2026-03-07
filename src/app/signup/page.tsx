import Link from 'next/link'
import AuthForm from '@/components/auth/AuthForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <div className="text-2xl mb-2">📓</div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--n-text)' }}>Daily Debriefer</h1>
          <p className="text-sm" style={{ color: 'var(--n-text3)' }}>Your private leadership journal.</p>
        </div>
        <div className="rounded-lg p-6 space-y-5" style={{ border: '1px solid var(--n-border)', background: 'var(--n-sidebar)' }}>
          <h2 className="text-sm font-medium" style={{ color: 'var(--n-text2)' }}>Create your account</h2>
          <AuthForm mode="signup" />
        </div>
        <p className="text-center text-sm" style={{ color: 'var(--n-text3)' }}>
          Already have an account?{' '}
          <Link href="/login" className="hover:underline" style={{ color: 'var(--n-blue)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
