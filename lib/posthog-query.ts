// Server-only — uses POSTHOG_PERSONAL_API_KEY (not the public key)

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'
const PROJECT_ID   = process.env.POSTHOG_PROJECT_ID!
const API_KEY      = process.env.POSTHOG_PERSONAL_API_KEY!

export async function hogql<T = unknown[][]>(query: string): Promise<T> {
  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${PROJECT_ID}/query/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
      next: { revalidate: 60 },
    }
  )
  if (!res.ok) throw new Error(`PostHog HogQL error: ${res.status} ${await res.text()}`)
  const json = await res.json()
  return json.results as T
}
