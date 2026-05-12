import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const API = `https://api.telegram.org/bot${BOT_TOKEN}`

async function sendMessage(chatId: number, text: string) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

async function answerPreCheckout(queryId: string, ok: boolean, errorMessage?: string) {
  await fetch(`${API}/answerPreCheckoutQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pre_checkout_query_id: queryId, ok, error_message: errorMessage }),
  })
}

export async function POST(req: NextRequest) {
  const update = await req.json()

  // /start — приветствие
  if (update.message?.text === '/start') {
    const chatId = update.message.chat.id
    const name = update.message.from?.first_name || 'друг'
    await sendMessage(
      chatId,
      `Привет, ${name}! 👋\n\nЯ создаю персональные сказки для детей с иллюстрациями.\n\n` +
      `Нажми кнопку <b>✨ Создать сказку</b> внизу экрана, чтобы начать.`
    )
  }

  // Подтверждение оплаты Stars — всегда одобряем
  if (update.pre_checkout_query) {
    await answerPreCheckout(update.pre_checkout_query.id, true)
  }

  // Успешная оплата — благодарим
  if (update.message?.successful_payment) {
    const chatId = update.message.chat.id
    const payload = update.message.successful_payment.invoice_payload
    const stars = update.message.successful_payment.total_amount

    if (payload === 'unlimited_30d') {
      await sendMessage(
        chatId,
        `⭐ Спасибо! Оплата ${stars} Stars получена.\n\n` +
        `Безлимитный доступ на 30 дней активирован — возвращайся в приложение и создавай сколько угодно сказок! ✨`
      )
    } else if (payload === 'one_story') {
      await sendMessage(
        chatId,
        `⭐ Спасибо! Оплата ${stars} Stars получена.\n\n` +
        `Одна сказка разблокирована — возвращайся в приложение! ✨`
      )
    }
  }

  return NextResponse.json({ ok: true })
}
