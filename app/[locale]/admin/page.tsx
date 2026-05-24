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
  if (plan === 'story_pack')         return '3 сказки'
  if (plan === 'monthly_sub')        return 'Месяц'
  if (plan === 'yearly_sub')         return 'Год'
  if (plan === 'registration_bonus') return 'Бонус'
  if (plan === 'referral_reward')    return 'Реферал'
  return plan
}

function planPrice(plan: string) {
  const p = PLAN_PRICE[plan]
  return p ? `${p} ₽` : '—'
}

export default async function AdminPage() {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/')
  }

  // ── Supabase: purchases ───────────────────────────────────────────────────
  const { data: purchases } = await supabaseAdmin
    .from('purchases')
    .select('*')
    .not('plan', 'in', '("registration_bonus","referral_reward")')
    .order('created_at', { ascending: false })
    .limit(50)

  const revenue = (purchases ?? []).reduce(
    (sum, p) => sum + (PLAN_PRICE[p.plan] ?? 0), 0
  )

  // ── PostHog: stats ────────────────────────────────────────────────────────
  let storiesTotal    = 0
  let storiesToday    = 0
  let pageviewsToday  = 0
  let usersToday      = 0

  try {
    const [totalRows, todayRows, pvRows, usersRows] = await Promise.all([
      hogql<[[number]]>(`SELECT count() FROM events WHERE event = 'story_generated'`),
      hogql<[[number]]>(`SELECT count() FROM events WHERE event = 'story_generated' AND toDate(timestamp) = today()`),
      hogql<[[number]]>(`SELECT count() FROM events WHERE event = '$pageview' AND toDate(timestamp) = today()`),
      hogql<[[number]]>(`SELECT count(DISTINCT distinct_id) FROM events WHERE event = '$pageview' AND toDate(timestamp) = today()`),
    ])
    storiesTotal   = Number(totalRows?.[0]?.[0]   ?? 0)
    storiesToday   = Number(todayRows?.[0]?.[0]   ?? 0)
    pageviewsToday = Number(pvRows?.[0]?.[0]      ?? 0)
    usersToday     = Number(usersRows?.[0]?.[0]   ?? 0)
  } catch (e) {
    console.error('PostHog query error:', e)
  }

  const today = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">MagicFairyTale.ru · {today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Сказок всего"      value={storiesTotal}    />
        <StatCard label="Сказок сегодня"    value={storiesToday}    />
        <StatCard label="Заходов сегодня"   value={pageviewsToday}  />
        <StatCard label="Уников сегодня"    value={usersToday}      />
      </div>

      {/* Revenue */}
      <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-5 mb-10 flex items-center gap-6">
        <div>
          <div className="text-4xl font-bold text-yellow-400">{revenue} ₽</div>
          <div className="text-gray-400 text-sm mt-1">Выручка всего · {purchases?.length ?? 0} покупок</div>
        </div>
      </div>

      {/* Purchases table */}
      <h2 className="text-lg font-semibold mb-4 text-gray-200">Последние покупки</h2>
      {!purchases?.length ? (
        <p className="text-gray-500">Покупок пока нет.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800 bg-gray-900">
                <th className="py-3 px-4">Дата</th>
                <th className="py-3 px-4">Тариф</th>
                <th className="py-3 px-4">Сумма</th>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p, i) => (
                <tr
                  key={p.id ?? p.payment_id ?? i}
                  className="border-b border-gray-900 hover:bg-gray-900 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString('ru-RU')
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-yellow-400">{planLabel(p.plan)}</td>
                  <td className="py-3 px-4 text-white font-medium">{planPrice(p.plan)}</td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-xs max-w-[140px] truncate">
                    {p.user_id}
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-xs max-w-[140px] truncate">
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="text-3xl font-bold text-yellow-400">{value}</div>
      <div className="text-gray-500 text-xs mt-1">{label}</div>
    </div>
  )
}
