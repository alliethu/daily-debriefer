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
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={personName}
          onChange={e => setPersonName(e.target.value)}
          placeholder="Person's name…"
          className="flex-1 min-w-0 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!personName.trim()}
          className="rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 px-3 py-2.5 text-sm text-neutral-300 transition-colors"
        >
          Set
        </button>
      </form>

      {submitted && (
        <AIOutput
          key={submitted}
          title={`Prep 1:1 — ${submitted}`}
          description={`Pulling entries and generating talking points for your next conversation with ${submitted}.`}
          icon="◈"
          streamConfig={{
            url: '/api/ai/prep-one-on-one',
            body: { personName: submitted },
          }}
        />
      )}
    </div>
  )
}
