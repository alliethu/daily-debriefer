'use client'

import { useState } from 'react'
import { type Sentiment } from '@/lib/types'

interface Pulse {
  person_name: string
  sentiment: Sentiment
}

interface Props {
  pulses: Pulse[]
  onChange: (pulses: Pulse[]) => void
}

const sentimentConfig: Record<Sentiment, { label: string; color: string }> = {
  positive: { label: 'Positive', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-900' },
  neutral:  { label: 'Neutral',  color: 'text-neutral-400 bg-neutral-900 border-neutral-800' },
  tense:    { label: 'Tense',    color: 'text-amber-400 bg-amber-950/60 border-amber-900' },
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

  function remove(index: number) {
    onChange(pulses.filter((_, i) => i !== index))
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
    }
  }

  return (
    <div className="space-y-3">
      {pulses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pulses.map((p, i) => {
            const cfg = sentimentConfig[p.sentiment]
            return (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${cfg.color}`}
              >
                <span className="font-medium">{p.person_name}</span>
                <span className="opacity-60">·</span>
                <span>{cfg.label}</span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Name…"
          className="flex-1 min-w-0 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
        <select
          value={sentiment}
          onChange={e => setSentiment(e.target.value as Sentiment)}
          className="rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-300 focus:border-indigo-500 transition-colors"
        >
          {(Object.keys(sentimentConfig) as Sentiment[]).map(s => (
            <option key={s} value={s}>{sentimentConfig[s].label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          disabled={!name.trim()}
          className="rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 px-3 py-2 text-sm text-neutral-300 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}
