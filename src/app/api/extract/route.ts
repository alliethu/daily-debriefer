import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain', 'text/markdown', 'text/x-markdown',
])

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid form data.' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'No file provided.' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  if (file.size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: `File too large (max 10 MB). This file is ${(file.size / 1024 / 1024).toFixed(1)} MB.` }), { status: 413, headers: { 'Content-Type': 'application/json' } })
  }

  const mime = file.type || 'application/octet-stream'
  if (!ALLOWED_MIME.has(mime) && !mime.startsWith('text/') && !mime.startsWith('image/')) {
    return new Response(JSON.stringify({ error: `Unsupported file type: ${mime}` }), { status: 415, headers: { 'Content-Type': 'application/json' } })
  }

  // Build message content based on file type
  let content: Anthropic.MessageParam['content']

  if (mime.startsWith('image/')) {
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mediaType = mime as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
    content = [
      {
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      },
      {
        type: 'text',
        text: 'Summarize the key information, decisions, and action items shown in this image. Be concise and structured.',
      },
    ]
  } else if (mime === 'application/pdf') {
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    content = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      } as unknown as Anthropic.TextBlockParam,
      {
        type: 'text',
        text: 'Summarize the key information, decisions, and action items from this document. Be concise and structured.',
      },
    ]
  } else if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword'
  ) {
    const buffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
    const text = result.value.trim()
    if (!text) {
      return new Response(JSON.stringify({ error: 'Could not extract text from this Word document.' }), { status: 422, headers: { 'Content-Type': 'application/json' } })
    }
    content = `Summarize the key information, decisions, and action items from this document. Be concise and structured.\n\nDOCUMENT:\n${text}`
  } else {
    // text/* and markdown
    const text = await file.text()
    content = `Summarize the key information, decisions, and action items from this document. Be concise and structured.\n\nDOCUMENT:\n${text}`
  }

  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content }],
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
