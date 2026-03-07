'use client'

import { useState, useRef } from 'react'

interface StreamConfig { url: string; body: Record<string, unknown> }
interface SavedItem { id: string; label: string; created_at: string; content: string }
interface Props {
  title: string; description: string; icon: string
  streamConfig: StreamConfig; children?: React.ReactNode
  saveConfig?: { type: string; label: string }
  savedList?: SavedItem[]
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

function SavedEntry({ item }: { item: SavedItem }) {
  const [open, setOpen] = useState(false)
  const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <div style={{ borderTop: '1px solid var(--n-border)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors"
        style={{ color: 'var(--n-text3)', background: 'transparent', textAlign: 'left' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--n-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span>{item.label || date}</span>
        <span style={{ opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm leading-relaxed space-y-0" style={{ color: 'var(--n-text2)' }}>
          {item.content.split('\n').map((line, i) => (
            <p key={i} className={line.startsWith('**') ? 'mt-3 first:mt-0' : ''}>
              {renderMarkdown(line)}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AIOutput({ title, description, icon, streamConfig, children, saveConfig, savedList }: Props) {
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [localSaved, setLocalSaved] = useState<SavedItem[]>([])
  const abortRef = useRef<AbortController | null>(null)

  async function run() {
    if (loading) { abortRef.current?.abort(); setLoading(false); return }
    setOutput(''); setError(null); setLoading(true); setSaveState('idle')
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

  async function save() {
    if (!output || !saveConfig || saveState === 'saving') return
    setSaveState('saving')
    try {
      const res = await fetch('/api/insights/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: saveConfig.type, label: saveConfig.label, content: output }),
      })
      if (res.ok) {
        const data = await res.json()
        setLocalSaved(prev => [{ id: data.id, label: saveConfig.label, created_at: data.created_at, content: output }, ...prev])
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 2000)
      } else {
        setSaveState('idle')
      }
    } catch {
      setSaveState('idle')
    }
  }

  const allSaved = [...localSaved, ...(savedList ?? []).filter(s => !localSaved.find(l => l.id === s.id))]

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--n-border)' }}>
      <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--n-border)' }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>{icon}</span>
            <h2 className="text-sm font-medium" style={{ color: 'var(--n-text)' }}>{title}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {saveConfig && output && !loading && (
              <button
                onClick={save}
                disabled={saveState === 'saving' || saveState === 'saved'}
                className="rounded text-xs transition-colors"
                style={{
                  background: saveState === 'saved' ? 'rgba(46,125,50,0.1)' : 'var(--n-active)',
                  color: saveState === 'saved' ? '#2e7d32' : 'var(--n-text2)',
                  border: '1px solid var(--n-border)',
                  padding: '5px 10px',
                }}
                onMouseEnter={e => { if (saveState === 'idle') (e.currentTarget as HTMLElement).style.background = 'var(--n-hover)' }}
                onMouseLeave={e => { if (saveState === 'idle') (e.currentTarget as HTMLElement).style.background = 'var(--n-active)' }}
              >
                {saveState === 'saved' ? '✓ Saved' : saveState === 'saving' ? 'Saving…' : 'Save'}
              </button>
            )}
            <button onClick={run}
              className="rounded text-xs font-medium transition-colors"
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

      {allSaved.length > 0 && (
        <div>
          <p className="px-4 py-2 text-xs" style={{ color: 'var(--n-text3)', borderTop: '1px solid var(--n-border)' }}>
            {allSaved.length} saved {allSaved.length === 1 ? 'entry' : 'entries'}
          </p>
          {allSaved.map(item => <SavedEntry key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}
