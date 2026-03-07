'use client'

import { useState, useRef } from 'react'

interface StreamConfig {
  url: string
  body: Record<string, unknown>
}

interface Props {
  title: string
  description: string
  icon: string
  streamConfig: StreamConfig
  children?: React.ReactNode
}

function renderMarkdown(text: string) {
  // Simple bold rendering for **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-neutral-100 font-semibold">{part.slice(2, -2)}</strong>
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
    if (loading) {
      abortRef.current?.abort()
      setLoading(false)
      return
    }

    setOutput('')
    setError(null)
    setLoading(true)

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
        setError(data.error ?? 'Something went wrong.')
        setLoading(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setOutput(prev => prev + decoder.decode(value, { stream: true }))
      }
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        setError('Request failed. Check your API key and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800/60 bg-neutral-950 overflow-hidden">
      <div className="px-5 py-5 border-b border-neutral-900 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <h2 className="text-sm font-medium text-neutral-200">{title}</h2>
        </div>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>

      {children && (
        <div className="px-5 py-4 border-b border-neutral-900">
          {children}
        </div>
      )}

      <div className="px-5 py-4 space-y-4">
        <button
          onClick={run}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            loading
              ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
        >
          {loading ? '⏹ Stop' : 'Generate'}
        </button>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {output && (
          <div className="prose-sm text-neutral-400 leading-relaxed whitespace-pre-wrap text-sm space-y-0.5">
            {output.split('\n').map((line, i) => (
              <p key={i} className={line.startsWith('**') ? 'mt-4 first:mt-0' : ''}>
                {renderMarkdown(line)}
              </p>
            ))}
          </div>
        )}

        {loading && !output && (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <span className="animate-pulse">●</span>
            <span>Thinking…</span>
          </div>
        )}
      </div>
    </div>
  )
}
