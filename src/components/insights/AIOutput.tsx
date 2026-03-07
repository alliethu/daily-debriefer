'use client'

import { useState, useRef } from 'react'

interface StreamConfig { url: string; body: Record<string, unknown> }
interface Props {
  title: string; description: string; icon: string
  streamConfig: StreamConfig; children?: React.ReactNode
}

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--n-text)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

export default function AIOutput({ title, description, icon, streamConfig, children }: Props) {
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function run() {
    if (loading) { abortRef.current?.abort(); setLoading(false); return }
    setOutput(''); setError(null); setLoading(true)
    abortRef.current = new AbortController()
    try {
      const res = await fetch(streamConfig.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamConfig.body),
        signal: abortRef.current.signal,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Something went wrong.'); setLoading(false); return
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setOutput(prev => prev + decoder.decode(value, { stream: true }))
      }
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') setError('Request failed. Check your API key and try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--n-border)' }}>
      <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--n-border)' }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>{icon}</span>
            <h2 className="text-sm font-medium" style={{ color: 'var(--n-text)' }}>{title}</h2>
          </div>
          <button onClick={run}
            className="rounded text-xs font-medium transition-colors flex-shrink-0"
            style={{
              background: loading ? 'var(--n-active)' : 'var(--n-blue)',
              color: loading ? 'var(--n-text2)' : '#fff',
              border: loading ? '1px solid var(--n-border)' : 'none',
              padding: '5px 10px',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--n-blue-h)' }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--n-blue)' }}
          >
            {loading ? '⏹ Stop' : 'Generate'}
          </button>
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--n-text3)' }}>{description}</p>
      </div>

      {children && <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--n-border)' }}>{children}</div>}

      {(output || error || loading) && (
        <div className="px-4 py-4">
          {error && (
            <p role="alert" className="text-xs rounded px-3 py-2" style={{ color: '#c62828', background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.2)' }}>{error}</p>
          )}
          {loading && !output && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--n-text3)' }}>
              <span className="animate-pulse">●</span>
              <span>Thinking…</span>
            </div>
          )}
          {output && (
            <div className="text-sm leading-relaxed space-y-0" style={{ color: 'var(--n-text2)' }}>
              {output.split('\n').map((line, i) => (
                <p key={i} className={line.startsWith('**') ? 'mt-3 first:mt-0' : ''}>
                  {renderMarkdown(line)}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
