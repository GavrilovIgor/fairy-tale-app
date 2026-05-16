import { NextRequest, NextResponse } from 'next/server'
import { cleanPrompt, seedForIndex, fetchAndCache } from '@/lib/imageCache'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get('prompt') ?? 'watercolor children illustration'
  const seedParam = req.nextUrl.searchParams.get('seed')
  const indexParam = req.nextUrl.searchParams.get('index')

  const cp = cleanPrompt(prompt)
  const seed = seedParam ?? (indexParam != null ? seedForIndex(Number(indexParam)) : '42')

  const entry = await fetchAndCache(cp, seed)
  if (!entry) return new NextResponse(null, { status: 502 })

  return new NextResponse(entry.buffer, {
    headers: {
      'Content-Type': entry.contentType,
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
