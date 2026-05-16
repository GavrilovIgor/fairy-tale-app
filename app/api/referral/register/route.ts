import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { referrerCode } = await req.json()
  if (!referrerCode || referrerCode.length < 6) return NextResponse.json({ ok: true })

  // Нельзя пригласить самого себя
  if (user.id.startsWith(referrerCode)) return NextResponse.json({ ok: true })

  // Ищем referrer по префиксу UUID
  const { data: users } = await supabaseAdmin.rpc('find_user_by_id_prefix', { prefix: referrerCode })
  const referrerId = users?.[0]?.id
  if (!referrerId) return NextResponse.json({ ok: true })

  // Идемпотентно — один реферал на пользователя
  await supabaseAdmin
    .from('referrals')
    .upsert({ referrer_id: referrerId, referee_id: user.id, rewarded: false }, { onConflict: 'referee_id' })

  return NextResponse.json({ ok: true })
}
