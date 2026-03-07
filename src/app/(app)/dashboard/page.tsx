export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EntryCard from '@/components/dashboard/EntryCard'
import GettingStartedChecklist from '@/components/dashboard/GettingStartedChecklist'
import { type Entry } from '@/lib/types'

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d.setDate(diff))
  return mon.toISOString().split('T')[0]
}

function today() { return new Date().toISOString().split('T')[0] }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: entries } = await supabase
    .from('entries').select('*, relationship_pulses(*), entry_themes(*)')
    .order('date', { ascending: false }).limit(50)

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

  const hasEntry      = all.length > 0
  const hasTheme      = all.some(e => (e.entry_themes ?? []).length > 0)
  const hasPulse      = all.some(e => (e.relationship_pulses ?? []).length > 0)
  const hasAttachment = all.some(e => !!e.attachment_summary)

  return (
    <div className="space-y-8">
      <GettingStartedChecklist
        hasEntry={hasEntry}
        hasTheme={hasTheme}
        hasPulse={hasPulse}
        hasAttachment={hasAttachment}
      />
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--n-text)' }}>
              📋 Journal
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--n-text3)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {!hasEntryToday && (
            <Link href="/entry/new"
              className="rounded text-sm font-medium flex-shrink-0"
              style={{ background: 'var(--n-blue)', color: '#fff', padding: '6px 12px' }}>
              + New entry
            </Link>
          )}
        </div>
        {thisWeek.length > 0 && (
          <div className="mt-4 flex items-center gap-4 text-sm" style={{ color: 'var(--n-text3)' }}>
            <span><span style={{ color: 'var(--n-text2)' }}>{thisWeek.length}</span> this week</span>
            <span>·</span>
            <span><span style={{ color: 'var(--n-text2)' }}>{quickWinsThisWeek}</span> wins</span>
            <span>·</span>
            <span>energy <span style={{ color: 'var(--n-text2)' }}>{avgEnergy ?? '—'}</span>/5</span>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--n-border)' }} />

      <div>
        {all.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <p className="text-sm" style={{ color: 'var(--n-text3)' }}>No entries yet. Start your first debrief.</p>
            <Link href="/entry/new" className="inline-block rounded text-sm font-medium"
              style={{ background: 'var(--n-blue)', color: '#fff', padding: '7px 14px' }}>
              Write today's entry
            </Link>
          </div>
        ) : (
          <div>{all.map(entry => <EntryCard key={entry.id} entry={entry} />)}</div>
        )}
      </div>
    </div>
  )
}
