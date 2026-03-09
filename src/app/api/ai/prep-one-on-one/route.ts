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

  const { personName } = await req.json()
  if (!personName?.trim()) {
    return new Response(JSON.stringify({ error: 'Person name required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Find entries mentioning this person in relationship pulses
  const { data: pulses } = await supabase
    .from('relationship_pulses')
    .select('*, entries!inner(date, what_i_did, impact, is_quick_win, energy_level, whats_unresolved)')
    .eq('user_id', user.id)
    .ilike('person_name', `%${personName.trim()}%`)
    .order('created_at', { ascending: false })
    .limit(20)

  // Also scan entries where person is mentioned in free text (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: textMentions } = await supabase
    .from('entries')
    .select('date, what_i_did, impact, whats_unresolved')
    .eq('user_id', user.id)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .or(`what_i_did.ilike.%${personName}%,impact.ilike.%${personName}%,whats_unresolved.ilike.%${personName}%`)
    .order('date', { ascending: false })
    .limit(10)

  // Find person context (documents, relationship info)
  const { data: person } = await supabase
    .from('people')
    .select('*, person_documents(*)')
    .eq('user_id', user.id)
    .ilike('name', personName.trim())
    .single()

  const personContext = person ? [
    person.notes && `NOTES: ${person.notes}`,
    person.relationship && `RELATIONSHIP: ${person.relationship}`,
    ...(person.person_documents ?? []).map((doc: { label: string; summary: string }) =>
      `${doc.label || 'Context'}:\n${doc.summary}`
    ),
  ].filter(Boolean).join('\n\n') : ''

  if ((!pulses || pulses.length === 0) && (!textMentions || textMentions.length === 0) && !personContext) {
    return new Response(
      JSON.stringify({ error: `No entries found mentioning "${personName}".` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const pulseSummary = (pulses ?? []).map((p: {
    person_name: string;
    sentiment: string;
    entries: { date: string; what_i_did: string; impact: string; whats_unresolved: string }
  }) =>
    `${p.entries.date} — sentiment: ${p.sentiment}\n  Context: ${stripHtml(p.entries.what_i_did).slice(0, 200)}\n  Unresolved: ${stripHtml(p.entries.whats_unresolved) || 'none'}`
  ).join('\n\n')

  const textSummary = (textMentions ?? []).map((e: {
    date: string;
    what_i_did: string;
    impact: string;
    whats_unresolved: string
  }) =>
    `${e.date}: ${stripHtml(e.what_i_did).slice(0, 300)}`
  ).join('\n\n')

  const userContext = await getUserContext(supabase, user.id)

  const contextText = [
    pulseSummary && `RELATIONSHIP PULSE HISTORY:\n${pulseSummary}`,
    textSummary && `TEXT MENTIONS:\n${textSummary}`,
  ].filter(Boolean).join('\n\n')

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a leadership coach helping someone prepare for a 1:1 with ${personName}. Based on their journal entries${personContext ? ' and background context about this person' : ''}, generate sharp, useful talking points.
${personContext ? `\nYou have background context about ${personName} including their self-reflections, level descriptions, or manager observations. Use this to make your recommendations more specific — reference growth areas, level expectations, or themes from their reflections where relevant.\n` : ''}
Structure your response:
**What's gone well** — positive interactions, things to acknowledge
**What's open or unresolved** — pending items, tensions, conversations to have
**Talking points for this 1:1** — 3–5 specific, actionable prompts to bring up
**Watch for** — any pattern or dynamic worth being aware of in this relationship${personContext ? '\n**Growth & development** — observations tied to their level expectations or self-reflection themes' : ''}

Be specific and direct. Use the data provided. Do not make things up.
${userContext ? `\nABOUT THE AUTHOR:\n${userContext}\n` : ''}${personContext ? `\nBACKGROUND CONTEXT ABOUT ${personName.toUpperCase()}:\n${personContext}\n` : ''}
JOURNAL DATA ABOUT ${personName.toUpperCase()}:
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
