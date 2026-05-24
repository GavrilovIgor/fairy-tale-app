import { NextRequest, NextResponse } from 'next/server'
import { writePurchase, awardReferrer } from '@/lib/supabase/admin'

const SHOP_ID = process.env.YOOKASSA_SHOP_ID!
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY!

function planExpires(plan: string): string | null {
  if (plan === 'story_pack') return null
  if (plan === 'yearly_sub') return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get('payment_id')
  if (!paymentId) return NextResponse.json({ error: 'No payment_id' }, { status: 400 })

  const auth = Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString('base64')
  const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

  const plan = data.metadata?.plan as string
  const userId = data.metadata?.userId as string | undefined

  if (data.paid && userId) {
    await writePurchase({
      user_id: userId,
      plan,
      payment_id: data.id,
      stories_remaining: plan === 'story_pack' ? 3 : null,
      expires_at: planExpires(plan),
    })

    await awardReferrer(userId).catch(e => console.error('awardReferrer error:', e))
  }

  return NextResponse.json({
    status: data.status,
    paid: data.paid,
    plan,
    userId,
    telegramId: data.metadata?.telegramId,
  })
}
