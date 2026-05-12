import { NextRequest, NextResponse } from 'next/server'

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

  return NextResponse.json({
    status: data.status,           // pending | waiting_for_capture | succeeded | canceled
    paid: data.paid,
    plan: data.metadata?.plan,
    telegramId: data.metadata?.telegramId,
  })
}
