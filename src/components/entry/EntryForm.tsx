'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ThemeTags from './ThemeTags'
import RelationshipPulse from './RelationshipPulse'
import { type EntryFormData, type Sentiment } from '@/lib/types'

const energyLabels = ['', 'Drained', 'Low', 'Steady', 'Good', 'Energised']

interface Props {
  initialData?: Partial<EntryFormData>
  entryId?: string
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500">
        {label}
      </label>
      {children}
    </div>
  )
}

function Textarea({ value, onChange, placeholder, rows = 4 }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none leading-relaxed"
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
    is_quick_win: initialData?.is_quick_win ?? false,
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
      // Update
      const { error: err } = await supabase
        .from('entries')
        .update({
          what_i_did: form.what_i_did,
          impact: form.impact,
          is_quick_win: form.is_quick_win,
          energy_level: form.energy_level,
          whats_unresolved: form.whats_unresolved,
        })
        .eq('id', entryId)

      if (err) { setError(err.message); setSaving(false); return }
    } else {
      // Insert
      const { data, error: err } = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          date: form.date,
          what_i_did: form.what_i_did,
          impact: form.impact,
          is_quick_win: form.is_quick_win,
          energy_level: form.energy_level,
          whats_unresolved: form.whats_unresolved,
        })
        .select('id')
        .single()

      if (err) { setError(err.message); setSaving(false); return }
      entry_id = data.id
    }

    // Replace relationship pulses
    await supabase.from('relationship_pulses').delete().eq('entry_id', entry_id!)
    if (form.pulses.length > 0) {
      await supabase.from('relationship_pulses').insert(
        form.pulses.map(p => ({ ...p, entry_id: entry_id!, user_id: user.id }))
      )
    }

    // Replace themes
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Date */}
      <Section label="Date">
        <input
          type="date"
          value={form.date}
          onChange={e => set('date', e.target.value)}
          className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-neutral-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
      </Section>

      {/* What did I do */}
      <Section label="What did I do today?">
        <Textarea
          value={form.what_i_did}
          onChange={v => set('what_i_did', v)}
          placeholder="Ran the all-hands, unblocked the platform team, had a hard conversation with a direct report…"
          rows={5}
        />
      </Section>

      {/* Impact */}
      <Section label="What was the impact?">
        <Textarea
          value={form.impact}
          onChange={v => set('impact', v)}
          placeholder="Push yourself: name a number, a person, or a concrete outcome. 'Saved 3 hours of rework for the team', 'Unblocked Maya's launch', 'Closed the Q3 gap'…"
          rows={4}
        />
      </Section>

      {/* Quick win */}
      <Section label="Quick win?">
        <button
          type="button"
          onClick={() => set('is_quick_win', !form.is_quick_win)}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
            form.is_quick_win
              ? 'border-indigo-600 bg-indigo-950/60 text-indigo-300'
              : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700'
          }`}
        >
          <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
            form.is_quick_win ? 'border-indigo-500 bg-indigo-600' : 'border-neutral-700'
          }`}>
            {form.is_quick_win && <span className="text-white text-xs leading-none">✓</span>}
          </span>
          {form.is_quick_win ? 'Yes — mark this as a quick win' : 'No quick win to flag'}
        </button>
      </Section>

      {/* Energy level */}
      <Section label={`Energy level — ${energyLabels[form.energy_level]}`}>
        <div className="space-y-2">
          <input
            type="range"
            min={1}
            max={5}
            value={form.energy_level}
            onChange={e => set('energy_level', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-neutral-600">
            <span>1 Drained</span>
            <span>5 Energised</span>
          </div>
        </div>
      </Section>

      {/* Relationship pulse */}
      <Section label="Relationship pulse">
        <RelationshipPulse
          pulses={form.pulses}
          onChange={pulses => set('pulses', pulses)}
        />
      </Section>

      {/* Theme tags */}
      <Section label="Theme tags">
        <ThemeTags
          selected={form.themes}
          onChange={themes => set('themes', themes)}
        />
      </Section>

      {/* Unresolved */}
      <Section label="What's unresolved or on your mind?">
        <Textarea
          value={form.whats_unresolved}
          onChange={v => set('whats_unresolved', v)}
          placeholder="Anything lingering — a decision you're avoiding, a conversation you need to have, something you're unsure about…"
          rows={3}
        />
      </Section>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || !form.what_i_did.trim()}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 text-sm font-medium text-white transition-colors"
        >
          {saving ? 'Saving…' : entryId ? 'Update entry' : 'Save entry'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg bg-neutral-900 hover:bg-neutral-800 px-6 py-3 text-sm text-neutral-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
