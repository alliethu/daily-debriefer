import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { type, label, content } = await req.json().catch(() => ({}))
  if (!type || !content) {
    return new Response(JSON.stringify({ error: 'Missing type or content.' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const { data, error } = await supabase
    .from('saved_insights')
    .insert({ user_id: user.id, type, label: label ?? '', content })
    .select('id, created_at')
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } })
}
