'use client'

import { useState } from 'react'
import AIOutput from './AIOutput'
import PersonNameInput from '@/components/shared/PersonNameInput'

export default function PrepOneOnOneForm() {
  const [personName, setPersonName] = useState('')
  const [submitted, setSubmitted] = useState('')

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (personName.trim()) setSubmitted(personName.trim())
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <PersonNameInput
          value={personName}
          onChange={setPersonName}
          onSubmit={() => handleSubmit()}
          placeholder="Person's name..."
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
