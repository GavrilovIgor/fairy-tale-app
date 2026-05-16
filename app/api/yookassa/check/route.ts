import { NextRequest, NextResponse } from 'next/server'
import { writePurchase } from '@/lib/supabase/admin'

const SHOP_ID = process.env.YOOKASSA_SHOP_ID!
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY!

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

  // Если оплата успешна и знаем userId — пишем в Supabase
  if (data.paid && userId) {
    const isUnlimited = plan === 'unlimited_30d'
    await writePurchase({
      user_id: userId,
      plan,
      payment_id: data.id,
      stories_remaining: isUnlimited ? null : 3,
      expires_at: isUnlimited
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null,
    })
  }

  return NextResponse.json({
    status: data.status,
    paid: data.paid,
    plan,
    userId,
    telegramId: data.metadata?.telegramId,
  })
}
