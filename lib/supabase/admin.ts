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

  // Активная безлимитная подписка
  const activeUnlimited = data.find(p =>
    p.plan === 'unlimited_30d' && p.expires_at && new Date(p.expires_at) > now
  )
  if (activeUnlimited) {
    return {
      isPremium: true,
      paidUntil: new Date(activeUnlimited.expires_at).getTime(),
      extraStories: 0,
    }
  }

  // Сумма оставшихся сказок
  const extraStories = data
    .filter(p => p.plan === 'three_stories' && (p.stories_remaining ?? 0) > 0)
    .reduce((sum, p) => sum + (p.stories_remaining ?? 0), 0)

  return { isPremium: false, paidUntil: null, extraStories }
}
