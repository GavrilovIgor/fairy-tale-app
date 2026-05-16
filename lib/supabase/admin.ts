import { createClient } from '@supabase/supabase-js'

// Service key bypasses RLS — only for server-side API routes
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export type PurchaseRow = {
  id?: string
  user_id: string
  plan: string
  payment_id?: string
  stories_remaining: number | null
  expires_at: string | null
  created_at?: string
}

export async function writePurchase(purchase: PurchaseRow) {
  return supabaseAdmin.from('purchases').upsert(purchase, { onConflict: 'payment_id' })
}

export async function writeRegistrationBonus(userId: string) {
  // Идемпотентно — один бонус на пользователя
  const { data: existing } = await supabaseAdmin
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('plan', 'registration_bonus')
    .single()
  if (existing) return

  await supabaseAdmin.from('purchases').insert({
    user_id: userId,
    plan: 'registration_bonus',
    stories_remaining: 3,
    expires_at: null,
  })
}

export async function awardReferrer(refereeId: string) {
  // Ищем незавершённый реферал
  const { data: ref } = await supabaseAdmin
    .from('referrals')
    .select('*')
    .eq('referee_id', refereeId)
    .eq('rewarded', false)
    .single()
  if (!ref) return

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  await Promise.all([
    supabaseAdmin.from('purchases').insert({
      user_id: ref.referrer_id,
      plan: 'referral_reward',
      stories_remaining: null,
      expires_at: expiresAt,
    }),
    supabaseAdmin
      .from('referrals')
      .update({ rewarded: true })
      .eq('id', ref.id),
  ])
}

export async function getUserPremiumStatus(userId: string): Promise<{
  isPremium: boolean
  paidUntil: number | null
  extraStories: number
}> {
  const { data } = await supabaseAdmin
    .from('purchases')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!data?.length) return { isPremium: false, paidUntil: null, extraStories: 0 }

  const now = new Date()

  // Активная подписка (месяц, год, реферальная награда)
  const activeSub = data.find(p =>
    ['monthly_sub', 'yearly_sub', 'referral_reward'].includes(p.plan) &&
    p.expires_at &&
    new Date(p.expires_at) > now
  )
  if (activeSub) {
    return {
      isPremium: true,
      paidUntil: new Date(activeSub.expires_at).getTime(),
      extraStories: 0,
    }
  }

  // Сумма оставшихся сказок (registration_bonus + старые three_stories)
  const extraStories = data
    .filter(p => ['registration_bonus', 'three_stories'].includes(p.plan) && (p.stories_remaining ?? 0) > 0)
    .reduce((sum, p) => sum + (p.stories_remaining ?? 0), 0)

  return { isPremium: false, paidUntil: null, extraStories }
}
