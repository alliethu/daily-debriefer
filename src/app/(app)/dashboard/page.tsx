export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EntryCard from '@/components/dashboard/EntryCard'
import { type Entry } from '@/lib/types'

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d.setDate(diff))
  return mon.toISOString().split('T')[0]
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('entries')
    .select('*, relationship_pulses(*), entry_themes(*)')
    .order('date', { ascending: false })
    .limit(50)

  const all = (entries ?? []) as (Entry & {
    relationship_pulses?: { person_name: string; sentiment: string }[]
    entry_themes?: { theme: string }[]
  })[]

  const weekStart = getWeekStart()
  const thisWeek = all.filter(e => e.date >= weekStart)
  const quickWinsThisWeek = thisWeek.filter(e => e.is_quick_win).length
  const avgEnergy = thisWeek.length
    ? Math.round((thisWeek.reduce((s, e) => s + e.energy_level, 0) / thisWeek.length) * 10) / 10
    : null

  const hasEntryToday = all.some(e => e.date === today())

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Journal</h1>
          <p className="text-sm text-neutral-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {!hasEntryToday && (
          <Link
            href="/entry/new"
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors"
          >
            + Today's entry
          </Link>
        )}
      </div>

      {/* This week stats */}
      {thisWeek.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-neutral-800/60 bg-neutral-950 px-4 py-4 space-y-1">
            <p className="text-2xl font-semibold tabular-nums">{thisWeek.length}</p>
            <p className="text-xs text-neutral-500">entries this week</p>
          </div>
          <div className="rounded-xl border border-neutral-800/60 bg-neutral-950 px-4 py-4 space-y-1">
            <p className="text-2xl font-semibold tabular-nums">{quickWinsThisWeek}</p>
            <p className="text-xs text-neutral-500">quick wins</p>
          </div>
          <div className="rounded-xl border border-neutral-800/60 bg-neutral-950 px-4 py-4 space-y-1">
            <p className="text-2xl font-semibold tabular-nums">{avgEnergy ?? '—'}</p>
            <p className="text-xs text-neutral-500">avg energy</p>
          </div>
        </div>
      )}

      {/* Entry list */}
      <div className="space-y-3">
        {all.length === 0 ? (
          <div className="rounded-xl border border-neutral-800/40 border-dashed p-10 text-center space-y-3">
            <p className="text-neutral-500 text-sm">No entries yet.</p>
            <Link
              href="/entry/new"
              className="inline-block rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors"
            >
              Write your first debrief
            </Link>
          </div>
        ) : (
          all.map(entry => <EntryCard key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  )
}
