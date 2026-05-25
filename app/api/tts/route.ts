import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 60

// Valid OpenAI TTS voices
const ALLOWED_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const
type AllowedVoice = typeof ALLOWED_VOICES[number]

function isAllowedVoice(v: string): v is AllowedVoice {
  return ALLOWED_VOICES.includes(v as AllowedVoice)
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
  }

  let text: string
  let voiceName: string

  try {
    const body = await req.json()
    text = body.text
    voiceName = body.voice
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }
  if (!voiceName || !isAllowedVoice(voiceName)) {
    return NextResponse.json({ error: 'Invalid voice' }, { status: 400 })
  }

  // Truncate to ~4000 chars to avoid huge bills on abuse
  const truncatedText = text.slice(0, 4000)

  const client = new OpenAI({ apiKey })

  try {
    const mp3 = await client.audio.speech.create({
      model: 'tts-1',
      voice: voiceName,
      input: truncatedText,
      response_format: 'mp3',
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(buffer.length),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'TTS error'
    console.error('OpenAI TTS error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
