export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EntryForm from '@/components/entry/EntryForm'
import { type Sentiment } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EntryPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: entry, error } = await supabase
    .from('entries')
    .select('*, relationship_pulses(*), entry_themes(*)')
    .eq('id', id)
    .single()

  if (error || !entry) notFound()

  const initialData = {
    date: entry.date,
    what_i_did: entry.what_i_did,
    impact: entry.impact,
    energy_level: entry.energy_level,
    whats_unresolved: entry.whats_unresolved,
    attachment_summary: entry.attachment_summary ?? '',
    pulses: (entry.relationship_pulses ?? []).map((p: { person_name: string; sentiment: Sentiment }) => ({
      person_name: p.person_name,
      sentiment: p.sentiment,
    })),
    themes: (entry.entry_themes ?? []).map((t: { theme: string }) => t.theme),
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Edit entry</h1>
          <p className="text-sm text-neutral-500">{new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
          ← Back
        </Link>
      </div>
      <EntryForm initialData={initialData} entryId={id} />
    </div>
  )
}
