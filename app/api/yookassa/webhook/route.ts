import { NextRequest, NextResponse } from 'next/server'
import { writePurchase, awardReferrer } from '@/lib/supabase/admin'
import { getPostHog } from '@/lib/posthog-server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID!
const API = `https://api.telegram.org/bot${BOT_TOKEN}`

const OPEN_APP_KB = {
  inline_keyboard: [[{ text: '✨ Открыть приложение', web_app: { url: 'https://magicfairytale.ru/' } }]],
}

async function sendMessage(chatId: string | number, text: string, keyboard?: object) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...(keyboard ? { reply_markup: keyboard } : {}) }),
  })
}

function planLabel(plan: string) {
  if (plan === 'story_pack') return '3 сказки'
  if (plan === 'monthly_sub') return 'Безлимит на 1 месяц'
  if (plan === 'yearly_sub') return 'Подписка на 1 год'
  return plan
}

function planExpires(plan: string): string | null {
  if (plan === 'story_pack') return null
  if (plan === 'yearly_sub') return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}

export async function POST(req: NextRequest) {
  const event = await req.json()

  if (event.event !== 'payment.succeeded') {
    return NextResponse.json({ ok: true })
  }

  const payment = event.object
  const plan = payment.metadata?.plan as string
  const telegramId = payment.metadata?.telegramId
  const userId = payment.metadata?.userId as string | undefined
  const amount = payment.amount?.value

  if (userId) {
    await writePurchase({
      user_id: userId,
      plan,
      payment_id: payment.id,
      stories_remaining: plan === 'story_pack' ? 3 : null,
      expires_at: planExpires(plan),
    }).catch(e => console.error('Supabase write error:', e))

    // Награда реферера если это первая оплата реферала
    await awardReferrer(userId).catch(e => console.error('awardReferrer error:', e))
  }

  if (telegramId) {
    await sendMessage(
      telegramId,
      `✅ Оплата <b>${amount} ₽</b> прошла успешно!\n\n<b>${planLabel(plan)}</b> активирован — возвращайся в приложение ✨\n\nЧек отправлен автоматически.`,
      OPEN_APP_KB,
    )
  }

  if (OWNER_CHAT_ID) {
    await sendMessage(
      OWNER_CHAT_ID,
      `💰 Новая оплата ЮКасса!\nТариф: ${planLabel(plan)}\nСумма: ${amount} ₽\nTelegram ID: ${telegramId || 'нет'}\nPayment ID: ${payment.id}\n\n✅ Чек выставлен автоматически`,
    )
  }

  const ph = getPostHog()
  ph.capture({
    distinctId: userId ?? telegramId ?? 'anonymous',
    event: 'payment_success',
    properties: { plan, amount: parseFloat(amount), payment_id: payment.id },
  })
  await ph.flush()

  return NextResponse.json({ ok: true })
}
