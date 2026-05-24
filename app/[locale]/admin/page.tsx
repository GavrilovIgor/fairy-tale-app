import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Только реальные платные тарифы
const PAID_PLANS = ['story_pack', 'monthly_sub', 'yearly_sub'] as const
const PLAN_PRICE: Record<string, number> = {
  story_pack:  49,
  monthly_sub: 99,
  yearly_sub:  1490,
}
const PLAN_LABEL: Record<string, string> = {
  story_pack:  '3 сказки — 49 ₽',
  monthly_sub: 'Месяц — 99 ₽',
  yearly_sub:  'Год — 1490 ₽',
}

export default async function AdminPage() {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/')

  const now     = new Date()
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const weekMs  = now.getTime() - 7 * 24 * 60 * 60 * 1000

  // ── 1. Уникальные пользователи (auth.users) ───────────────────────────────
  // Источник: Supabase auth — единственный достоверный источник регистраций
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const allUsers    = authData?.users ?? []
  const totalUsers  = allUsers.length
  const newThisWeek = allUsers.filter(u => new Date(u.created_at).getTime() > weekMs).length
  const newToday    = allUsers.filter(u => new Date(u.created_at).getTime() >= todayMs).length

  // ── 2. Сказки (таблица story_generations) ────────────────────────────────
  // Источник: server-side запись на каждую генерацию, не зависит от клиента
  const { data: generations } = await supabaseAdmin
    .from('story_generations')
    .select('created_at')

  const totalStories  = generations?.length ?? 0
  const storiesToday  = generations?.filter(s =>
    new Date(s.created_at).getTime() >= todayMs
  ).length ?? 0

  // ── 3. Оплаты (таблица purchases, только платные планы) ───────────────────
  const { data: purchases } = await supabaseAdmin
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false })

  const allPurchases  = purchases ?? []
  const paidPurchases = allPurchases.filter(p => PAID_PLANS.includes(p.plan as typeof PAID_PLANS[number]))
  const totalPaid     = paidPurchases.length
  // Считаем из реальных сумм ЮКассы; fallback на прайс-лист если amount ещё не записан
  const totalRevenue  = paidPurchases.reduce(
    (sum, p) => sum + (p.amount ?? PLAN_PRICE[p.plan] ?? 0), 0
  )

  // Активные подписчики: monthly/yearly с активным expires_at
  const activeSubs = new Set(
    allPurchases
      .filter(p =>
        ['monthly_sub', 'yearly_sub', 'referral_reward'].includes(p.plan) &&
        p.expires_at &&
        new Date(p.expires_at) > now
      )
      .map(p => p.user_id)
  ).size

  const dateStr = now.toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">MagicFairyTale.ru · {dateStr} · данные из Supabase</p>
      </div>

      {/* 4 ключевые метрики */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Пользователей"
          value={totalUsers}
          hint="всего в системе"
          note={newToday > 0 ? `+${newToday} сегодня` : undefined}
        />
        <StatCard
          label="Регистраций"
          value={newThisWeek}
          hint="за 7 дней"
          note={newToday > 0 ? `+${newToday} сегодня` : undefined}
        />
        <StatCard
          label="Сказок"
          value={totalStories}
          hint="всего создано"
          note={storiesToday > 0 ? `+${storiesToday} сегодня` : undefined}
        />
        <StatCard
          label="Оплат"
          value={totalPaid}
          hint="платных заказов"
          accent
        />
      </div>

      {/* Выручка */}
      <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-6 mb-8 flex items-center justify-between">
        <div>
          <div className="text-4xl font-bold text-yellow-400">{totalRevenue.toLocaleString('ru-RU')} ₽</div>
          <div className="text-gray-500 text-sm mt-1">
            Выручка всего · {totalPaid} {totalPaid === 1 ? 'оплата' : 'оплат'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{activeSubs}</div>
          <div className="text-gray-500 text-sm mt-1">
            активн{activeSubs === 1 ? 'ый' : 'ых'} подписчик{activeSubs === 1 ? '' : activeSubs < 5 ? 'а' : 'ов'}
          </div>
        </div>
      </div>

      {/* Таблица оплат */}
      <h2 className="text-base font-semibold mb-3 text-gray-300">Последние оплаты</h2>
      {!paidPurchases.length ? (
        <p className="text-gray-600">Оплат пока нет.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800 bg-gray-900">
                <th className="py-3 px-4 font-medium">Дата</th>
                <th className="py-3 px-4 font-medium">Тариф</th>
                <th className="py-3 px-4 font-medium">Сумма</th>
                <th className="py-3 px-4 font-medium">User ID</th>
              </tr>
            </thead>
            <tbody>
              {paidPurchases.slice(0, 50).map((p, i) => (
                <tr
                  key={p.id ?? i}
                  className="border-b border-gray-900 hover:bg-gray-900/60 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString('ru-RU')
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-yellow-400">
                    {PLAN_LABEL[p.plan] ?? p.plan}
                  </td>
                  <td className="py-3 px-4 text-white font-medium">
                    {PLAN_PRICE[p.plan] ? `${PLAN_PRICE[p.plan]} ₽` : '—'}
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-xs truncate max-w-[160px]">
                    {p.user_id}
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

function StatCard({
  label, value, hint, note, accent,
}: {
  label: string
  value: number
  hint: string
  note?: string
  accent?: boolean
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex flex-col gap-1">
      <div className={`text-4xl font-bold tabular-nums ${accent ? 'text-yellow-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-gray-400 text-sm">{label}</div>
      <div className="text-gray-600 text-xs">{hint}</div>
      {note && <div className="text-emerald-500 text-xs mt-1">{note}</div>}
    </div>
  )
}
