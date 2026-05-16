type CacheEntry = {
  buffer: ArrayBuffer
  contentType: string
  cachedAt: number
}

const CACHE_TTL = 60 * 60 * 1000 // 1 hour

// Persist across hot-reloads in dev
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any
if (!g.__storyImageCache) g.__storyImageCache = new Map<string, CacheEntry>()
if (!g.__storyImagePending) g.__storyImagePending = new Map<string, Promise<void>>()

const cache: Map<string, CacheEntry> = g.__storyImageCache
const pending: Map<string, Promise<void>> = g.__storyImagePending

export function cleanPrompt(prompt: string): string {
  return prompt.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120)
}

export function seedForIndex(index: number): string {
  return String(index * 137 + 42)
}

function buildUrl(cp: string, seed: string, w: number, h: number): string {
  const style = "Pixar 3D animation style, cinematic magical lighting, vibrant rich colors, highly detailed, children's fairy tale art, dreamlike atmosphere, 8K quality, no text, no letters, no watermarks"
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(`${cp}, ${style}`)}?width=${w}&height=${h}&nologo=true&seed=${seed}&enhance=true`
}

function cacheKey(cp: string, seed: string): string {
  return `${cp}:${seed}`
}

function getEntry(key: string): CacheEntry | null {
  const e = cache.get(key)
  if (!e) return null
  if (Date.now() - e.cachedAt > CACHE_TTL) { cache.delete(key); return null }
  return e
}

export async function fetchAndCache(cp: string, seed: string): Promise<CacheEntry | null> {
  const key = cacheKey(cp, seed)
  const hit = getEntry(key)
  if (hit) return hit

  // Deduplicate concurrent requests for the same image
  if (pending.has(key)) {
    await pending.get(key)
    return getEntry(key)
  }

  const promise = (async () => {
    const tries = [
      { w: 768, h: 512, s: seed },
      { w: 640, h: 427, s: String(Number(seed) + 1) },
    ]
    for (let i = 0; i < tries.length; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 2000))
      try {
        const res = await fetch(buildUrl(cp, tries[i].s, tries[i].w, tries[i].h), {
          signal: AbortSignal.timeout(25000),
        })
        if (!res.ok) continue
        const buffer = await res.arrayBuffer()
        cache.set(key, {
          buffer,
          contentType: res.headers.get('Content-Type') ?? 'image/jpeg',
          cachedAt: Date.now(),
        })
        return
      } catch { /* try next */ }
    }
  })()

  pending.set(key, promise)
  try { await promise } finally { pending.delete(key) }

  return getEntry(key)
}

// Fire-and-forget: start fetching images while story is being shown
export function prefetchImages(scenes: { imagePrompt: string }[]): void {
  scenes.forEach((scene, i) => {
    void fetchAndCache(cleanPrompt(scene.imagePrompt), seedForIndex(i))
  })
}
