'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ThemeTags from './ThemeTags'
import RelationshipPulse from './RelationshipPulse'
import { type EntryFormData, type Sentiment } from '@/lib/types'

const energyLabels = ['', 'Drained', 'Low', 'Steady', 'Good', 'Energised']

interface Props { initialData?: Partial<EntryFormData>; entryId?: string }

function today() { return new Date().toISOString().split('T')[0] }

function Prop({ label, children, last = false }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className="flex items-start gap-6 px-4 py-3"
      style={last ? {} : { borderBottom: '1px solid var(--n-border)' }}>
      <div className="w-32 flex-shrink-0 pt-0.5">
        <span className="text-xs font-medium" style={{ color: 'var(--n-text3)' }}>{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function NTextarea({ value, onChange, placeholder, rows = 4 }: {
  value: string; onChange: (v: string) => void; placeholder: string; rows?: number
}) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full resize-none text-sm leading-relaxed"
      style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--n-text)' }}
      onFocus={e => (e.target.style.color = 'var(--n-text)')}
      placeholder-style={{ color: 'var(--n-text3)' }}
    />
  )
}

export default function EntryForm({ initialData, entryId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState<EntryFormData>({
    date: initialData?.date ?? today(),
    what_i_did: initialData?.what_i_did ?? '',
    impact: initialData?.impact ?? '',
    energy_level: initialData?.energy_level ?? 3,
    whats_unresolved: initialData?.whats_unresolved ?? '',
    pulses: initialData?.pulses ?? [],
    themes: initialData?.themes ?? [],
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof EntryFormData>(key: K, value: EntryFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setSaving(false); return }

    let entry_id = entryId

    if (entryId) {
      const { error: err } = await supabase.from('entries').update({
        what_i_did: form.what_i_did, impact: form.impact,
        energy_level: form.energy_level, whats_unresolved: form.whats_unresolved,
      }).eq('id', entryId)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { data, error: err } = await supabase.from('entries').insert({
        user_id: user.id, date: form.date, what_i_did: form.what_i_did,
        impact: form.impact, energy_level: form.energy_level,
        whats_unresolved: form.whats_unresolved,
      }).select('id').single()
      if (err) { setError(err.message); setSaving(false); return }
      entry_id = data.id
    }

    await supabase.from('relationship_pulses').delete().eq('entry_id', entry_id!)
    if (form.pulses.length > 0) {
      await supabase.from('relationship_pulses').insert(
        form.pulses.map(p => ({ ...p, entry_id: entry_id!, user_id: user.id }))
      )
    }

    await supabase.from('entry_themes').delete().eq('entry_id', entry_id!)
    if (form.themes.length > 0) {
      await supabase.from('entry_themes').insert(
        form.themes.map(theme => ({ theme, entry_id: entry_id!, user_id: user.id }))
      )
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Page title area */}
      <div className="mb-8">
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
          className="text-sm mb-2"
          style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--n-text3)', cursor: 'pointer' }}
        />
        <h2 className="text-2xl font-bold" style={{ color: 'var(--n-text)' }}>Today's debrief</h2>
      </div>

      {/* Properties */}
      <div className="rounded-lg mb-8" style={{ border: '1px solid var(--n-border)' }}>
        <Prop label={`Energy — ${energyLabels[form.energy_level]}`}>
          <div className="flex items-center gap-3 pt-1">
            <input type="range" min={1} max={5} value={form.energy_level}
              onChange={e => set('energy_level', parseInt(e.target.value))}
              className="flex-1" style={{ maxWidth: '160px' }}
              aria-label="Energy level"
              aria-valuetext={energyLabels[form.energy_level]}
            />
            <span className="text-sm tabular-nums" style={{ color: 'var(--n-text2)' }}>{form.energy_level}/5</span>
          </div>
        </Prop>

        <Prop label="Themes">
          <div className="py-0.5">
            <ThemeTags selected={form.themes} onChange={themes => set('themes', themes)} />
          </div>
        </Prop>

        <Prop label="People" last>
          <div className="py-0.5">
            <RelationshipPulse pulses={form.pulses} onChange={pulses => set('pulses', pulses)} />
          </div>
        </Prop>
      </div>

      {/* Content blocks */}
      <div className="space-y-6">
        {[
          { label: 'What did I do today?', key: 'what_i_did' as const, placeholder: 'Ran the all-hands, unblocked the platform team, had a hard conversation with a direct report…', rows: 5 },
          { label: 'What was the impact?', key: 'impact' as const, placeholder: "Push yourself — name a number, a person, or a concrete outcome. 'Saved 3 hours of rework', 'Unblocked Maya's launch'…", rows: 4 },
          { label: "What's unresolved or on your mind?", key: 'whats_unresolved' as const, placeholder: 'Anything lingering — a decision you\'re avoiding, a conversation you need to have…', rows: 3 },
        ].map(({ label, key, placeholder, rows }) => (
          <div key={key}>
            <label htmlFor={key} className="block text-xs font-medium mb-2" style={{ color: 'var(--n-text3)' }}>{label}</label>
            <textarea id={key} value={form[key] as string} onChange={e => set(key, e.target.value)}
              placeholder={placeholder} rows={rows}
              className="w-full resize-none text-sm leading-relaxed rounded-lg p-3"
              style={{ background: 'var(--n-active)', border: '1px solid var(--n-border)', outline: 'none', color: 'var(--n-text)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(26,111,196,0.5)'}
              onBlur={e => e.target.style.borderColor = 'var(--n-border)'}
            />
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-xs rounded px-3 py-2"
          style={{ color: '#c62828', background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.2)' }}>
          {error}
        </p>
      )}

      <div className="flex gap-2 mt-6 pt-6" style={{ borderTop: '1px solid var(--n-border)' }}>
        <button type="submit" disabled={saving || !form.what_i_did.trim()}
          className="rounded text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--n-blue)', color: '#fff', padding: '7px 14px' }}
          onMouseEnter={e => { if (!saving && form.what_i_did.trim()) (e.currentTarget as HTMLElement).style.background = 'var(--n-blue-h)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-blue)' }}
        >
          {saving ? 'Saving…' : entryId ? 'Update entry' : 'Save entry'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded text-sm transition-colors"
          style={{ background: 'transparent', color: 'var(--n-text2)', border: '1px solid var(--n-border)', padding: '7px 14px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-hover)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
