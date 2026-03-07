import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getWeekBounds(weekOffset: number = 0) {
  const d = new Date()
  d.setDate(d.getDate() - weekOffset * 7)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d)
  mon.setDate(diff)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return {
    start: mon.toISOString().split('T')[0],
    end: sun.toISOString().split('T')[0],
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { weekOffset = 0 } = await req.json().catch(() => ({}))
  const { start, end } = getWeekBounds(weekOffset)

  const { data: entries } = await supabase
    .from('entries')
    .select('*, relationship_pulses(*), entry_themes(*)')
    .eq('user_id', user.id)
    .gte('date', start)
    .lte('date', end)
    .order('date')

  if (!entries || entries.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No entries found for this week.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const entriesText = entries.map(e => {
    const pulses = (e.relationship_pulses ?? []).map((p: { person_name: string; sentiment: string }) => `${p.person_name} (${p.sentiment})`).join(', ')
    const themes = (e.entry_themes ?? []).map((t: { theme: string }) => t.theme).join(', ')
    return `
Date: ${e.date}
What I did: ${e.what_i_did}
Impact: ${e.impact}
Quick win: ${e.is_quick_win ? 'Yes' : 'No'}
Energy: ${e.energy_level}/5
People: ${pulses || 'none'}
Themes: ${themes || 'none'}
Unresolved: ${e.whats_unresolved || 'nothing noted'}`.trim()
  }).join('\n\n---\n\n')

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a thoughtful leadership coach reviewing someone's private journal. Analyze this week's entries (${start} to ${end}) and write a concise synthesis.

Structure your response with these sections:
**Wins this week** — what got done, what had impact
**Patterns & themes** — recurring topics, how energy and relationships trended
**Tensions & unresolved** — what's still open, what might need attention
**One thing to carry forward** — a single, direct observation or question

Be direct, specific, and grounded in the entries. Write as if you know this person well. Avoid generic advice.

ENTRIES:
${entriesText}`,
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
