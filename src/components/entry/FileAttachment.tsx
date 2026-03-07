'use client'

import { useState, useRef } from 'react'

const ACCEPTED = '.pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.gif'
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

interface Props {
  onSummary: (summary: string) => void
}

export default function FileAttachment({ onSummary }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function processFile(f: File) {
    if (f.size > MAX_BYTES) {
      setError(`File is too large (max 10 MB). This file is ${(f.size / 1024 / 1024).toFixed(1)} MB.`)
      return
    }

    setFile(f)
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

      onSummary(full)
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        setError('Failed to read file. Check your API key and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    abortRef.current?.abort()
    setFile(null)
    setSummary('')
    setError(null)
    setLoading(false)
    onSummary('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      {/* Upload row */}
      <div className="flex items-center gap-2">
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
          {loading ? '⏳ Reading…' : '📎 Upload file'}
        </button>

        {file && (
          <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--n-text3)' }}>
            <span className="truncate max-w-[180px]">{file.name}</span>
            <button
              type="button"
              onClick={clear}
              aria-label="Remove attachment"
              className="opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
            >×</button>
          </span>
        )}
      </div>

      {/* Hint when nothing uploaded */}
      {!file && !error && (
        <p className="text-xs" style={{ color: 'var(--n-text3)' }}>
          PDF, image, Word doc, or text file — Claude will summarize it.
        </p>
      )}

      {/* Error */}
      {error && (
        <p role="alert" className="text-xs rounded px-3 py-2"
          style={{ color: '#c62828', background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.2)' }}>
          {error}
        </p>
      )}

      {/* Loading shimmer */}
      {loading && !summary && (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--n-text3)' }}>
          <span className="animate-pulse">●</span>
          <span>Reading file…</span>
        </div>
      )}

      {/* Streaming summary */}
      {summary && (
        <div className="rounded-lg p-3 text-xs leading-relaxed space-y-0"
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
