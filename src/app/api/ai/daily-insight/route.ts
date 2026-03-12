import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { stripHtml } from '@/lib/html'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { entryId } = await req.json()
  if (!entryId) {
    return Response.json({ error: 'Missing entryId' }, { status: 400 })
  }

  // Fetch the just-saved entry
  const { data: entry, error: entryErr } = await supabase
    .from('entries')
    .select('*, relationship_pulses(*), entry_themes(*)')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .single()

  if (entryErr || !entry) {
    return Response.json({ error: 'Entry not found' }, { status: 404 })
  }

  // Fetch recent entries (last 14 days, excluding current)
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const { data: recent } = await supabase
    .from('entries')
    .select('*, relationship_pulses(*), entry_themes(*)')
    .eq('user_id', user.id)
    .neq('id', entryId)
    .gte('date', fourteenDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })
    .limit(10)

  const recentEntries = recent ?? []

  // Format today's entry
  const pulses = (entry.relationship_pulses ?? [])
    .map((p: { person_name: string; sentiment: string }) => `${p.person_name} (${p.sentiment})`)
    .join(', ')
  const themes = (entry.entry_themes ?? [])
    .map((t: { theme: string }) => t.theme)
    .join(', ')

  const currentEntryText = `
What I did: ${stripHtml(entry.what_i_did)}
Impact: ${stripHtml(entry.impact)}
Quick win: ${entry.is_quick_win ? 'Yes' : 'No'}
Energy: ${entry.energy_level}/5
People: ${pulses || 'none'}
Themes: ${themes || 'none'}
Unresolved: ${stripHtml(entry.whats_unresolved) || 'nothing noted'}`.trim()

  // Format recent entries (compact)
  const recentText = recentEntries.map(e => {
    const rThemes = (e.entry_themes ?? []).map((t: { theme: string }) => t.theme).join(', ')
    return `${e.date}: ${stripHtml(e.what_i_did).slice(0, 150)} | Energy: ${e.energy_level}/5 | Themes: ${rThemes || 'none'} | Unresolved: ${stripHtml(e.whats_unresolved).slice(0, 100) || 'none'}`
  }).join('\n')

  // Compute energy trend
  const allEnergies = [...recentEntries.map(e => e.energy_level).reverse(), entry.energy_level]
  const energyTrend = allEnergies.length > 1
    ? allEnergies.slice(-5).join(' → ')
    : `${entry.energy_level} (first entry)`

  // Find recurring themes
  const themeCount: Record<string, number> = {}
  ;[entry, ...recentEntries].forEach(e => {
    ;(e.entry_themes ?? []).forEach((t: { theme: string }) => {
      themeCount[t.theme] = (themeCount[t.theme] ?? 0) + 1
    })
  })
  const recurringThemes = Object.entries(themeCount)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([t, c]) => `${t} (${c}x)`)
    .join(', ') || 'none yet'

  // Find repeated unresolved items (appear in multiple entries)
  const unresolvedSnippets = [entry, ...recentEntries]
    .map(e => stripHtml(e.whats_unresolved).slice(0, 80))
    .filter(Boolean)
  const repeatedUnresolved = unresolvedSnippets.length > 1
    ? unresolvedSnippets.slice(0, 3).join('; ')
    : 'none yet'

  const entryCount = recentEntries.filter(e => {
    const d = new Date(e.date + 'T12:00:00')
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
    startOfWeek.setHours(0, 0, 0, 0)
    return d >= startOfWeek
  }).length + 1 // +1 for current entry

  const prompt = `You are a sharp, direct leadership coach. A leader just finished their daily journal entry. Give them ONE short insight (2-4 sentences max) that makes their journaling feel immediately valuable.

Choose the single most useful lens from these options:
- A PATTERN you spot across recent entries (repeated theme, person, or tension)
- A REFRAME or coaching nudge on today's entry (e.g., they listed actions but no impact — push them)
- A CONNECTION to a previous entry (an unresolved item that's still open, a thread developing)
- An ENERGY observation (trending direction, correlation with certain work types)
- A MICRO-WIN acknowledgment (momentum, streak, concrete impact)

Rules:
- Pick ONE angle, not multiple. Be punchy, not comprehensive.
- Reference specific details from the entries (dates, names, themes, actual words they used).
- Write in second person. Be warm but direct, like a coach who knows them well.
- Do NOT give generic advice. Do NOT use bullet points. Do NOT use headers or bold text.
- If this is their very first entry and there is no prior context, acknowledge the start and ask one thought-provoking question about what they wrote today.

TODAY'S ENTRY (${entry.date}):
${currentEntryText}

RECENT CONTEXT (last 14 days):
${recentText || 'No previous entries yet.'}

PATTERNS:
- Entries this week: ${entryCount}
- Energy trend: ${energyTrend}
- Recurring themes: ${recurringThemes}
- Recent unresolved items: ${repeatedUnresolved}`

  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
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
