'use client'

import { useState } from 'react'
import { type Sentiment } from '@/lib/types'

interface Pulse { person_name: string; sentiment: Sentiment }
interface Props { pulses: Pulse[]; onChange: (pulses: Pulse[]) => void }

const sentimentConfig: Record<Sentiment, { label: string; dot: string }> = {
  positive: { label: 'Positive', dot: '#4caf50' },
  neutral:  { label: 'Neutral',  dot: '#9b9b9b' },
  tense:    { label: 'Tense',    dot: '#ff9800' },
}

export default function RelationshipPulse({ pulses, onChange }: Props) {
  const [name, setName] = useState('')
  const [sentiment, setSentiment] = useState<Sentiment>('positive')

  function add() {
    const trimmed = name.trim()
    if (!trimmed) return
    onChange([...pulses, { person_name: trimmed, sentiment }])
    setName('')
    setSentiment('positive')
  }

  function remove(index: number) { onChange(pulses.filter((_, i) => i !== index)) }
  function handleKey(e: React.KeyboardEvent) { if (e.key === 'Enter') { e.preventDefault(); add() } }

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--n-border)',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '14px',
    color: 'var(--n-text)',
    outline: 'none',
  }

  return (
    <div className="space-y-2">
      {pulses.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pulses.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs"
              style={{ background: 'var(--n-active)', color: 'var(--n-text2)', border: '1px solid var(--n-border)' }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sentimentConfig[p.sentiment].dot }} />
              <span>{p.person_name}</span>
              <span style={{ color: 'var(--n-text3)' }}>·</span>
              <span style={{ color: 'var(--n-text3)' }}>{sentimentConfig[p.sentiment].label}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${p.person_name}`}
                className="ml-0.5 transition-opacity opacity-50 hover:opacity-100"
              >×</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Name…"
          aria-label="Person's name"
          style={{ ...inputStyle, flex: 1, minWidth: 0 }}
          onFocus={e => { e.target.style.borderColor = 'var(--n-blue)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--n-border)' }}
        />
        <select
          value={sentiment}
          onChange={e => setSentiment(e.target.value as Sentiment)}
          aria-label="Sentiment"
          style={{ ...inputStyle }}
          onFocus={e => { e.target.style.borderColor = 'var(--n-blue)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--n-border)' }}
        >
          {(Object.keys(sentimentConfig) as Sentiment[]).map(s => (
            <option key={s} value={s}>{sentimentConfig[s].label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          disabled={!name.trim()}
          aria-label="Add person"
          className="rounded text-sm transition-colors disabled:opacity-30"
          style={{ background: 'var(--n-active)', color: 'var(--n-text2)', border: '1px solid var(--n-border)', padding: '6px 12px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--n-text)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-active)'; (e.currentTarget as HTMLElement).style.color = 'var(--n-text2)' }}
        >Add</button>
      </div>
    </div>
  )
}
