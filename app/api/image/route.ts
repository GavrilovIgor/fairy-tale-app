import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get('prompt') ?? 'watercolor children illustration'
  const seed = req.nextUrl.searchParams.get('seed') ?? '42'

  // Strip Cyrillic and non-ASCII characters — Pollinations handles only English prompts well
  const cleanPrompt = prompt.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120)
  const finalPrompt = `${cleanPrompt}, children's book watercolor illustration, soft pastel colors, no text, no words`

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=768&height=512&nologo=true&seed=${seed}`

  const delays = [0, 3000, 7000]

  for (let attempt = 0; attempt < 3; attempt++) {
    if (delays[attempt] > 0) {
      await new Promise(r => setTimeout(r, delays[attempt]))
    }
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(35000) })
      if (!res.ok) throw new Error(`Status ${res.status}`)

      const buffer = await res.arrayBuffer()
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (err) {
      console.error(`Image attempt ${attempt + 1} failed:`, err)
    }
  }

  return new NextResponse(null, { status: 502 })
}
