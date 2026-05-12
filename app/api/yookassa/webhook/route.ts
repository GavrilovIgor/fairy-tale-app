import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID!
const API = `https://api.telegram.org/bot${BOT_TOKEN}`

const OPEN_APP_KB = {
  inline_keyboard: [[{ text: '✨ Открыть приложение', web_app: { url: 'https://skazka-ai.vercel.app/' } }]],
}

async function sendMessage(chatId: string | number, text: string, keyboard?: object) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...(keyboard ? { reply_markup: keyboard } : {}) }),
  })
}

export async function POST(req: NextRequest) {
  const event = await req.json()

  // ЮКасса шлёт разные типы уведомлений
  if (event.event !== 'payment.succeeded') {
    return NextResponse.json({ ok: true })
  }

  const payment = event.object
  const plan = payment.metadata?.plan
  const telegramId = payment.metadata?.telegramId
  const amount = payment.amount?.value
  const planLabel = plan === 'unlimited_30d' ? 'Безлимит на 30 дней' : '3 сказки'

  // Уведомление пользователю в Telegram (если пришёл из бота)
  if (telegramId) {
    await sendMessage(
      telegramId,
      `✅ Оплата <b>${amount} ₽</b> прошла успешно!\n\n<b>${planLabel}</b> активирован — возвращайся в приложение ✨\n\nЧек отправлен автоматически.`,
      OPEN_APP_KB,
    )
  }

  // Уведомление владельцу
  if (OWNER_CHAT_ID) {
    await sendMessage(
      OWNER_CHAT_ID,
      `💰 Новая оплата ЮКасса!\nТариф: ${planLabel}\nСумма: ${amount} ₽\nTelegram ID: ${telegramId || 'нет'}\nPayment ID: ${payment.id}\n\n✅ Чек выставлен автоматически`,
    )
  }

  return NextResponse.json({ ok: true })
}
