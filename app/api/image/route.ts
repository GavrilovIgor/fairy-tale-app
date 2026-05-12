import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get('prompt') ?? 'watercolor children illustration'
  const seed = req.nextUrl.searchParams.get('seed') ?? '42'

  const cleanPrompt = prompt.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120)
  const finalPrompt = `${cleanPrompt}, children's book watercolor illustration, soft pastel colors, no text, no words`

  // Два варианта URL — основной и с другим сидом как запасной
  const urls = [
    `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=768&height=512&nologo=true&seed=${seed}`,
    `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=640&height=427&nologo=true&seed=${Number(seed) + 1}`,
  ]

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 2000))
    try {
      const res = await fetch(urls[attempt], { signal: AbortSignal.timeout(25000) })
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
