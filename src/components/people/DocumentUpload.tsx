'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type PersonDocument } from '@/lib/types'

const ACCEPTED = '.pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.gif'
const MAX_BYTES = 10 * 1024 * 1024

interface Props {
  personId: string
  onSaved: (doc: PersonDocument) => void
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--n-border)',
  borderRadius: '4px',
  padding: '6px 10px',
  fontSize: '14px',
  color: 'var(--n-text)',
  outline: 'none',
}

export default function DocumentUpload({ personId, onSaved }: Props) {
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function processFile(f: File) {
    if (f.size > MAX_BYTES) {
      setError(`File too large (max 10 MB). This file is ${(f.size / 1024 / 1024).toFixed(1)} MB.`)
      return
    }

    setLoading(true)
    setSummary('')
    setError(null)
    abortRef.current = new AbortController()

    const formData = new FormData()
    formData.append('file', f)

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to read file.')
        setLoading(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
        setSummary(full)
      }

      // Save to person_documents
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not signed in.'); setLoading(false); return }

      const { data: doc, error: dbError } = await supabase
        .from('person_documents')
        .insert({
          person_id: personId,
          user_id: user.id,
          type: 'other',
          label: label.trim() || 'Uploaded file',
          summary: full,
        })
        .select('*')
        .single()

      if (dbError) {
        setError(dbError.message)
        setLoading(false)
        return
      }

      onSaved(doc as PersonDocument)
      setLabel('')
      setSummary('')
      if (inputRef.current) inputRef.current.value = ''
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        setError('Failed to read file. Check your API key and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Label (optional)..."
          aria-label="Document label"
          style={{ ...inputStyle, flex: 1, minWidth: 0, fontSize: '13px' }}
          onFocus={e => { e.target.style.borderColor = 'var(--n-blue)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--n-border)' }}
        />
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          aria-label="Upload file"
          className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="rounded text-xs transition-colors disabled:opacity-40"
          style={{
            background: 'var(--n-active)',
            color: 'var(--n-text2)',
            border: '1px solid var(--n-border)',
            padding: '5px 10px',
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--n-hover)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-active)' }}
        >
          {loading ? 'Reading...' : 'Upload file'}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs rounded px-3 py-2"
          style={{ color: '#c62828', background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.2)' }}>
          {error}
        </p>
      )}

      {loading && !summary && (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--n-text3)' }}>
          <span className="animate-pulse">●</span>
          <span>Reading file...</span>
        </div>
      )}

      {summary && loading && (
        <div className="rounded-lg p-3 text-xs leading-relaxed"
          style={{ background: 'var(--n-active)', border: '1px solid var(--n-border)', color: 'var(--n-text2)' }}>
          {summary.split('\n').map((line, i) => (
            <p key={i} className={line.startsWith('**') ? 'mt-2 first:mt-0' : ''}>
              {line.startsWith('**') && line.endsWith('**')
                ? <strong style={{ color: 'var(--n-text)', fontWeight: 600 }}>{line.slice(2, -2)}</strong>
                : line}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
