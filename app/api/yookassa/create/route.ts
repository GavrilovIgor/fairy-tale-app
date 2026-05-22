import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const SHOP_ID = process.env.YOOKASSA_SHOP_ID!
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY!
const BASE_URL = 'https://magicfairytale.ru'

const PLANS = {
  monthly_sub: { amount: '299.00', description: 'Волшебная Сказка — подписка на 1 месяц' },
  yearly_sub:  { amount: '1490.00', description: 'Волшебная Сказка — подписка на 1 год' },
}

export async function POST(req: NextRequest) {
  const { plan, telegramId, userId } = await req.json()
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
    metadata: { plan, telegramId: telegramId?.toString() ?? '', userId: userId ?? '' },
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
