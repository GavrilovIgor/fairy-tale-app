import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const SHOP_ID = process.env.YOOKASSA_SHOP_ID!
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY!
const BASE_URL = 'https://skazka-ai.vercel.app'

const PLANS = {
  one_story: { amount: '149.00', description: 'Волшебная Сказка — 1 сказка' },
  unlimited_30d: { amount: '349.00', description: 'Волшебная Сказка — безлимит 30 дней' },
}

export async function POST(req: NextRequest) {
  const { plan, telegramId } = await req.json()
  const selected = PLANS[plan as keyof typeof PLANS]
  if (!selected) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 })

  const paymentId = randomUUID()

  const body = {
    amount: { value: selected.amount, currency: 'RUB' },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: `${BASE_URL}/?payment_id=${paymentId}&plan=${plan}`,
    },
    description: selected.description,
    receipt: {
      // Для самозанятых — клиент обязателен для чека
      customer: { phone: '79164100025' },
      tax_system_code: 6, // НПД (самозанятые)
      items: [{
        description: selected.description,
        quantity: '1.00',
        amount: { value: selected.amount, currency: 'RUB' },
        vat_code: 1, // без НДС
        payment_mode: 'full_payment',
        payment_subject: 'service',
      }],
    },
    metadata: { plan, telegramId: telegramId?.toString() ?? '' },
  }

  const auth = Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString('base64')
  const res = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Idempotence-Key': paymentId,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('YooKassa error:', data)
    return NextResponse.json({ error: data.description ?? 'Ошибка создания платежа' }, { status: 500 })
  }

  return NextResponse.json({
    confirmationUrl: data.confirmation.confirmation_url,
    paymentId: data.id,
  })
}
