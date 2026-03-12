'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  entryId: string
  autoTrigger?: boolean
}

export default function DailyInsight({ entryId, autoTrigger = false }: Props) {
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasTriggered = useRef(false)

  useEffect(() => {
    if (autoTrigger && !hasTriggered.current) {
      hasTriggered.current = true
      generate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTrigger])

  async function generate() {
    setLoading(true)
    setError(null)
    setOutput('')
    try {
      const res = await fetch('/api/ai/daily-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Could not generate insight.')
        setLoading(false)
        return
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let received = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        received += chunk
        setOutput(prev => prev + chunk)
      }
      if (received) {
        localStorage.setItem('dd:onboarding:insight', '1')
      }
    } catch {
      setError('Request failed.')
    } finally {
      setLoading(false)
    }
  }

  const idle = !output && !loading && !error

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        border: '1px solid var(--n-border)',
        animation: idle ? 'none' : 'fadeIn 0.3s ease-in',
      }}
    >
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: idle ? 'none' : '1px solid var(--n-border)' }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '13px' }}>💡</span>
          <span className="text-xs font-medium" style={{ color: 'var(--n-text3)' }}>Daily insight</span>
        </div>
        {idle && (
          <button
            type="button"
            onClick={generate}
            className="rounded text-xs font-medium transition-colors"
            style={{
              background: 'var(--n-blue)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 10px',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--n-blue-h)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--n-blue)')}
          >
            Generate
          </button>
        )}
        {output && !loading && (
          <button
            type="button"
            onClick={generate}
            className="text-xs transition-colors"
            style={{
              color: 'var(--n-text3)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 6px',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--n-text2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--n-text3)')}
          >
            Regenerate
          </button>
        )}
      </div>

      <div className="px-4 py-3">
        {error && (
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: '#c62828' }}>{error}</p>
            <button
              type="button"
              onClick={generate}
              className="text-xs transition-colors"
              style={{ color: 'var(--n-text3)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        )}
        {loading && !output && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--n-text3)' }}>
            <span className="animate-pulse">●</span>
            <span>Thinking&hellip;</span>
          </div>
        )}
        {output && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--n-text2)' }}>
            {output}
          </p>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
