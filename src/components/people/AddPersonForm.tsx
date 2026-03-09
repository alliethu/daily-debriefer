'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Person, type PersonRelationship, RELATIONSHIP_OPTIONS } from '@/lib/types'

interface Props {
  onAdd: (person: Person) => void
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--n-border)',
  borderRadius: '4px',
  padding: '6px 10px',
  fontSize: '14px',
  color: 'var(--n-text)',
  outline: 'none',
}

export default function AddPersonForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState<PersonRelationship>('direct-report')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in.'); setSaving(false); return }

    const { data, error: dbError } = await supabase
      .from('people')
      .insert({ user_id: user.id, name: trimmed, relationship })
      .select('*')
      .single()

    if (dbError) {
      setError(dbError.message.includes('duplicate') ? `"${trimmed}" already exists.` : dbError.message)
      setSaving(false)
      return
    }

    onAdd({ ...data, person_documents: [] } as Person)
    setName('')
    setRelationship('direct-report')
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name..."
          aria-label="Person's name"
          style={{ ...inputStyle, flex: 1, minWidth: 0 }}
          onFocus={e => { e.target.style.borderColor = 'var(--n-blue)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--n-border)' }}
        />
        <select
          value={relationship}
          onChange={e => setRelationship(e.target.value as PersonRelationship)}
          aria-label="Relationship"
          style={{ ...inputStyle, paddingRight: '32px', appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6b6b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          onFocus={e => { e.target.style.borderColor = 'var(--n-blue)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--n-border)' }}
        >
          {RELATIONSHIP_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="rounded text-sm transition-colors disabled:opacity-30"
          style={{ background: 'var(--n-active)', color: 'var(--n-text2)', border: '1px solid var(--n-border)', padding: '6px 12px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-hover)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-active)' }}
        >
          {saving ? 'Adding...' : 'Add'}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs rounded px-3 py-2"
          style={{ color: '#c62828', background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.2)' }}>
          {error}
        </p>
      )}
    </form>
  )
}
