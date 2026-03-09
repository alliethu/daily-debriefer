import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { stripHtml } from '@/lib/html'
import { getUserContext } from '@/lib/user-context'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: entries } = await supabase
    .from('entries')
    .select('*, relationship_pulses(*), entry_themes(*)')
    .eq('user_id', user.id)
    .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
    .order('date')

  if (!entries || entries.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Not enough entries for a quarterly reflection (need at least some entries from the last 90 days).' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Summarize to avoid huge prompts
  const quickWins = entries.filter(e => e.is_quick_win)
  const energyAvg = (entries.reduce((s, e) => s + e.energy_level, 0) / entries.length).toFixed(1)

  const themeCount: Record<string, number> = {}
  entries.forEach(e => {
    ;(e.entry_themes ?? []).forEach((t: { theme: string }) => {
      themeCount[t.theme] = (themeCount[t.theme] ?? 0) + 1
    })
  })
  const topThemes = Object.entries(themeCount).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const peopleCount: Record<string, { positive: number; neutral: number; tense: number }> = {}
  entries.forEach(e => {
    ;(e.relationship_pulses ?? []).forEach((p: { person_name: string; sentiment: string }) => {
      if (!peopleCount[p.person_name]) peopleCount[p.person_name] = { positive: 0, neutral: 0, tense: 0 }
      const s = p.sentiment as 'positive' | 'neutral' | 'tense'
      if (s in peopleCount[p.person_name]) peopleCount[p.person_name][s]++
    })
  })

  const entriesText = entries.slice(-30).map(e =>
    `${e.date}: ${stripHtml(e.what_i_did).slice(0, 200)} | Impact: ${stripHtml(e.impact).slice(0, 100)} | Unresolved: ${stripHtml(e.whats_unresolved).slice(0, 100)}`
  ).join('\n')

  const winsText = quickWins.slice(-15).map(e => `${e.date}: ${stripHtml(e.impact) || stripHtml(e.what_i_did).slice(0, 150)}`).join('\n')

  // Check which people have uploaded documents
  const { data: peopleWithDocs } = await supabase
    .from('people')
    .select('name, person_documents(id)')
    .eq('user_id', user.id)
  const docCountMap: Record<string, number> = {}
  ;(peopleWithDocs ?? []).forEach((p: { name: string; person_documents: { id: string }[] }) => {
    if (p.person_documents?.length) {
      docCountMap[p.name] = p.person_documents.length
    }
  })

  const peopleText = Object.entries(peopleCount).slice(0, 10).map(([name, s]) =>
    `- ${name}: ${s.positive} positive, ${s.neutral} neutral, ${s.tense} tense interactions${docCountMap[name] ? ` (has ${docCountMap[name]} context doc${docCountMap[name] !== 1 ? 's' : ''})` : ''}`
  ).join('\n')

  const contextText = `
PERIOD: ${ninetyDaysAgo.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}
TOTAL ENTRIES: ${entries.length}
QUICK WINS: ${quickWins.length}
AVERAGE ENERGY: ${energyAvg}/5

TOP THEMES (by frequency):
${topThemes.map(([t, c]) => `- ${t}: ${c} times`).join('\n')}

KEY PEOPLE:
${peopleText}

NOTABLE WINS:
${winsText || 'None flagged'}

SAMPLE ENTRIES (most recent 30):
${entriesText}`.trim()

  const userContext = await getUserContext(supabase, user.id)

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `You are a thoughtful executive coach writing a structured quarterly reflection for a leader, based on 90 days of private journal entries.

Write a narrative reflection with these sections:

**The quarter in brief** — 2–3 sentences capturing the arc of this quarter
**Where you had impact** — specific, grounded wins with context
**How you led** — patterns in how they worked, what themes dominated, how energy held up
**Relationships** — key relationship dynamics, who they invested in, any tensions
**What's unfinished** — recurring unresolved threads, persistent tensions
**What this quarter is asking of you** — one honest, forward-looking observation

Write in second person ("you"). Be specific, direct, and honest. Avoid generic leadership advice. Ground everything in the journal data.
${userContext ? `\nABOUT THE AUTHOR:\n${userContext}\n` : ''}
JOURNAL DATA:
${contextText}`,
      },
    ],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
  })
}
