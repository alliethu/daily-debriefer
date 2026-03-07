'use client'

import { useState } from 'react'
import AIOutput from './AIOutput'

export default function PrepOneOnOneForm() {
  const [personName, setPersonName] = useState('')
  const [submitted, setSubmitted] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (personName.trim()) setSubmitted(personName.trim())
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input type="text" value={personName} onChange={e => setPersonName(e.target.value)}
          placeholder="Person's name…"
          className="flex-1 min-w-0 rounded text-sm"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--n-border)', padding: '6px 10px', color: 'var(--n-text)', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = 'var(--n-blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--n-border)'}
        />
        <button type="submit" disabled={!personName.trim()}
          className="rounded text-sm transition-colors disabled:opacity-30"
          style={{ background: 'var(--n-active)', color: 'var(--n-text2)', border: '1px solid var(--n-border)', padding: '6px 12px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-hover)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-active)' }}
        >Look up</button>
      </form>
      {submitted && (
        <AIOutput key={submitted}
          title={`Prep 1:1 — ${submitted}`}
          description={`Talking points for your next conversation with ${submitted}.`}
          icon="🤝"
          streamConfig={{ url: '/api/ai/prep-one-on-one', body: { personName: submitted } }}
        />
      )}
    </div>
  )
}
