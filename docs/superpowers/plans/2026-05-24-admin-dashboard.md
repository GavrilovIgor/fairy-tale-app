# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/admin` page showing story generations, purchases/revenue, and pageviews — protected by Supabase auth + ADMIN_EMAIL env check.

**Architecture:** Static route `app/admin/page.tsx` (Server Component) checks Supabase session + ADMIN_EMAIL env var, fetches purchases from Supabase directly (service key), fetches story/pageview counts from PostHog HogQL API. No new DB tables needed.

**Tech Stack:** Next.js 16 App Router, Supabase (supabase-js admin), PostHog HogQL REST API, TypeScript, Tailwind CSS

---

### Task 0: Add env vars (manual — user does this)

No code to write. User must add these to `.env.local` AND to Vercel dashboard.

**`.env.local` additions:**
```
ADMIN_EMAIL=gigor92@gmail.com
POSTHOG_PERSONAL_API_KEY=phx_...
```

**How to get `POSTHOG_PERSONAL_API_KEY`:**
1. Open https://us.posthog.com/settings/user-api-keys
2. Create key with scope: "Query read" (for HogQL queries)
3. Copy the `phx_...` value

**In Vercel:** Project → Settings → Environment Variables → add both.

PostHog project ID: `phc_ndCxZyyfwva2Z758c28Nr79zbtWgDBcXGssuLPpD8dCN` — this is the public key. For HogQL API, we also need the numeric project ID (visible in PostHog URL: `https://us.posthog.com/project/XXXXX`). User will need to add:
```
POSTHOG_PROJECT_ID=XXXXX
```

---

### Task 1: PostHog HogQL query helper

**Files:**
- Create: `lib/posthog-query.ts`

- [ ] **Step 1: Create the query helper**

```typescript
// lib/posthog-query.ts
// Server-only — uses POSTHOG_PERSONAL_API_KEY (not the public key)

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'
const PROJECT_ID   = process.env.POSTHOG_PROJECT_ID!
const API_KEY      = process.env.POSTHOG_PERSONAL_API_KEY!

export async function hogql<T = unknown[][]>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${PROJECT_ID}/query/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query }, ...(variables ?? {}) }),
      next: { revalidate: 60 }, // cache 60 seconds
    }
  )
  if (!res.ok) throw new Error(`PostHog HogQL error: ${res.status} ${await res.text()}`)
  const json = await res.json()
  return json.results as T
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /Users/igor/Projects/fairy-tale-app && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to `lib/posthog-query.ts`

---

### Task 2: Admin page — server component

**Files:**
- Create: `app/admin/page.tsx`

The static `app/admin/` route takes precedence over `app/[locale]/` in Next.js App Router — no middleware changes needed.

- [ ] **Step 1: Create the admin page**

```typescript
// app/admin/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { hogql } from '@/lib/posthog-query'

const PLAN_PRICE: Record<string, number> = {
  story_pack:  49,
  monthly_sub: 99,
  yearly_sub:  1490,
}

function planLabel(plan: string) {
  if (plan === 'story_pack')  return '3 сказки (49 ₽)'
  if (plan === 'monthly_sub') return 'Месяц (99 ₽)'
  if (plan === 'yearly_sub')  return 'Год (1490 ₽)'
  if (plan === 'registration_bonus') return 'Бонус регистрации'
  if (plan === 'referral_reward')    return 'Реферальная награда'
  return plan
}

export default async function AdminPage() {
  // ── Auth guard ───────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || user.email !== adminEmail) {
    redirect('/')
  }

  // ── Supabase: purchases ──────────────────────────────────────────────────
  const { data: purchases } = await supabaseAdmin
    .from('purchases')
    .select('*')
    .not('plan', 'in', '("registration_bonus","referral_reward")')
    .order('created_at', { ascending: false })
    .limit(50)

  const revenue = (purchases ?? []).reduce(
    (sum, p) => sum + (PLAN_PRICE[p.plan] ?? 0), 0
  )

  // ── PostHog: story generations & pageviews ───────────────────────────────
  let storiesTotal = 0
  let storiesToday = 0
  let pageviewsToday = 0

  try {
    // Total story_generated events
    const totalRows = await hogql<[[number]]>(
      `SELECT count() FROM events WHERE event = 'story_generated'`
    )
    storiesTotal = totalRows?.[0]?.[0] ?? 0

    // Today's story_generated
    const todayRows = await hogql<[[number]]>(
      `SELECT count() FROM events WHERE event = 'story_generated' AND toDate(timestamp) = today()`
    )
    storiesToday = todayRows?.[0]?.[0] ?? 0

    // Today's pageviews
    const pvRows = await hogql<[[number]]>(
      `SELECT count() FROM events WHERE event = '$pageview' AND toDate(timestamp) = today()`
    )
    pageviewsToday = pvRows?.[0]?.[0] ?? 0
  } catch (e) {
    console.error('PostHog query error:', e)
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-gray-400 text-sm mb-8">MagicFairyTale.ru · {new Date().toLocaleDateString('ru-RU')}</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Сказок всего" value={storiesTotal} />
        <StatCard label="Сказок сегодня" value={storiesToday} />
        <StatCard label="Заходов сегодня" value={pageviewsToday} />
        <StatCard label="Выручка (всего)" value={`${revenue} ₽`} />
      </div>

      {/* Purchases table */}
      <h2 className="text-xl font-semibold mb-4">Последние покупки</h2>
      {!purchases?.length ? (
        <p className="text-gray-500">Покупок пока нет.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-800">
                <th className="py-2 pr-4">Дата</th>
                <th className="py-2 pr-4">Тариф</th>
                <th className="py-2 pr-4">User ID</th>
                <th className="py-2">Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id ?? p.payment_id} className="border-b border-gray-900 hover:bg-gray-900">
                  <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td className="py-2 pr-4 text-yellow-400">{planLabel(p.plan)}</td>
                  <td className="py-2 pr-4 text-gray-500 font-mono text-xs truncate max-w-[120px]">
                    {p.user_id}
                  </td>
                  <td className="py-2 text-gray-500 font-mono text-xs truncate max-w-[120px]">
                    {p.payment_id ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="text-2xl font-bold text-yellow-400">{value}</div>
      <div className="text-gray-400 text-xs mt-1">{label}</div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/igor/Projects/fairy-tale-app && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 3: Dev server smoke test**

```bash
cd /Users/igor/Projects/fairy-tale-app && npm run dev
```

Open http://localhost:3000/admin in browser.
- Not logged in → should redirect to `/`
- Logged in as admin → should show dashboard

- [ ] **Step 4: Commit**

```bash
cd /Users/igor/Projects/fairy-tale-app
git add app/admin/page.tsx lib/posthog-query.ts
git commit -m "feat: add /admin dashboard with Supabase + PostHog stats"
```

---

### Task 3: Deploy to Vercel

- [ ] **Step 1: Add env vars in Vercel dashboard**

Go to https://vercel.com/igor/fairy-tale-app (or similar) → Settings → Environment Variables.

Add:
- `ADMIN_EMAIL` = your email
- `POSTHOG_PERSONAL_API_KEY` = `phx_...`
- `POSTHOG_PROJECT_ID` = numeric ID from PostHog URL

- [ ] **Step 2: Push and deploy**

```bash
cd /Users/igor/Projects/fairy-tale-app && git push
```

Wait for Vercel auto-deploy (1-2 min). Check https://magicfairytale.ru/admin — should redirect if not logged in, show dashboard if logged in.

---

### Security notes

- `/admin` redirects to `/` for anyone not logged in as ADMIN_EMAIL — no URL token, no leaking in Vercel logs
- `supabaseAdmin` uses service key — bypasses RLS, safe because it's server-only
- PostHog personal API key is server-only env var — never sent to client
- No `export const dynamic = 'force-dynamic'` needed — Server Component with `fetch` revalidate=60 is fine
