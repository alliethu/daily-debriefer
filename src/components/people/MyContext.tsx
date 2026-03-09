'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  initialContext: string
}

export default function MyContext({ initialContext }: Props) {
  const [context, setContext] = useState(initialContext)
  const [saved, setSaved] = useState(initialContext)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const hasChanges = context !== saved

  async function handleSave() {
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in.'); setSaving(false); return }

    const { error: dbError } = await supabase
      .from('user_context')
      .upsert({ user_id: user.id, context: context.trim() }, { onConflict: 'user_id' })

    if (dbError) { setError(dbError.message); setSaving(false); return }

    setSaved(context.trim())
    setContext(context.trim())
    setSaving(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--n-border)',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '14px',
    color: 'var(--n-text)',
    outline: 'none',
    lineHeight: '1.6',
    width: '100%',
    resize: 'vertical' as const,
  }

  return (
    <div className="rounded-lg p-4 space-y-3" style={{ border: '1px solid var(--n-border)' }}>
      <div>
        <h2 className="text-sm font-medium" style={{ color: 'var(--n-text)' }}>About me</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--n-text3)' }}>
          Context about you, your role, goals, and working style. The AI uses this to personalize all insights.
        </p>
      </div>

      <textarea
        value={context}
        onChange={e => setContext(e.target.value)}
        placeholder="e.g. I'm an Engineering Director managing 4 teams. My focus areas this quarter are improving cross-team collaboration and developing my skip-level relationships. I tend to over-index on execution and need to spend more time on strategy..."
        rows={5}
        style={inputStyle}
        onFocus={e => { e.target.style.borderColor = 'var(--n-blue)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--n-border)' }}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="rounded text-xs transition-colors disabled:opacity-30"
          style={{ background: 'var(--n-active)', color: 'var(--n-text2)', border: '1px solid var(--n-border)', padding: '5px 10px' }}
          onMouseEnter={e => { if (hasChanges) (e.currentTarget as HTMLElement).style.background = 'var(--n-hover)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-active)' }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {showSuccess && (
          <span className="text-xs" style={{ color: '#4caf50' }}>Saved</span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs rounded px-3 py-2"
          style={{ color: '#c62828', background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.2)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
