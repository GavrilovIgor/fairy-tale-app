import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const API = `https://api.telegram.org/bot${BOT_TOKEN}`

// Тарифы в Stars (1 Star ≈ $0.013 / ~1.2 руб)
const PLANS = {
  three_stories: { title: '3 сказки', description: '3 персональные сказки с иллюстрациями и PDF', amount: 49 },
  unlimited_30d: { title: 'Безлимит на 30 дней', description: 'Неограниченное количество сказок в течение 30 дней', amount: 249 },
}

export async function POST(req: NextRequest) {
  const { plan } = await req.json()

  const selected = PLANS[plan as keyof typeof PLANS]
  if (!selected) {
    return NextResponse.json({ error: 'Unknown plan' }, { status: 400 })
  }

  const res = await fetch(`${API}/createInvoiceLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: selected.title,
      description: selected.description,
      payload: plan,
      currency: 'XTR', // Telegram Stars
      prices: [{ label: selected.title, amount: selected.amount }],
    }),
  })

  const data = await res.json()
  if (!data.ok) {
    return NextResponse.json({ error: data.description }, { status: 500 })
  }

  return NextResponse.json({ invoiceLink: data.result })
}
