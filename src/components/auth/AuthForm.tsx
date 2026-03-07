'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup'

export default function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message) } else { router.push('/dashboard'); router.refresh() }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message) } else { setMessage('Check your email for a confirmation link.') }
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--n-border)',
    borderRadius: '4px',
    padding: '7px 10px',
    fontSize: '14px',
    color: 'var(--n-text)',
    outline: 'none',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="email" className="block text-xs" style={{ color: 'var(--n-text3)' }}>Email</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
          required autoComplete="email" placeholder="you@example.com" style={inputStyle}
          onFocus={e => { e.target.style.borderColor = 'var(--n-blue)'; e.target.style.boxShadow = '0 0 0 2px rgba(26,111,196,0.15)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--n-border)'; e.target.style.boxShadow = 'none' }}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="block text-xs" style={{ color: 'var(--n-text3)' }}>Password</label>
        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
          required autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'} style={inputStyle}
          onFocus={e => { e.target.style.borderColor = 'var(--n-blue)'; e.target.style.boxShadow = '0 0 0 2px rgba(26,111,196,0.15)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--n-border)'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {error && <p role="alert" className="text-xs rounded px-3 py-2" style={{ color: '#c62828', background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.2)' }}>{error}</p>}
      {message && <p role="status" className="text-xs rounded px-3 py-2" style={{ color: '#2e7d32', background: 'rgba(46,125,50,0.08)', border: '1px solid rgba(46,125,50,0.2)' }}>{message}</p>}

      <button type="submit" disabled={loading}
        className="w-full rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'var(--n-blue)', color: '#fff', padding: '8px 12px' }}
        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--n-blue-h)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-blue)' }}
      >
        {loading ? 'Please wait…' : mode === 'login' ? 'Continue' : 'Create account'}
      </button>
    </form>
  )
}
