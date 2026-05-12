import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const API = `https://api.telegram.org/bot${BOT_TOKEN}`
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID // твой Telegram chat_id для уведомлений

async function sendMessage(chatId: number, text: string, keyboard?: object) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...(keyboard ? { reply_markup: keyboard } : {}),
    }),
  })
}

async function answerPreCheckout(queryId: string, ok: boolean, errorMessage?: string) {
  await fetch(`${API}/answerPreCheckoutQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pre_checkout_query_id: queryId, ok, error_message: errorMessage }),
  })
}

function getNextCode(): string | null {
  const raw = process.env.PROMO_CODES || ''
  const codes = raw.split(',').map(c => c.trim()).filter(Boolean)
  // Берём случайный код из пула (в MVP без отслеживания использования)
  if (!codes.length) return null
  return codes[Math.floor(Math.random() * codes.length)]
}

const OPEN_APP_KEYBOARD = {
  inline_keyboard: [[{
    text: '✨ Открыть приложение',
    web_app: { url: 'https://skazka-ai.vercel.app/' },
  }]],
}

const NTFY_TOPIC = process.env.NTFY_TOPIC // напр. "skazka-igor-tasks-2026"

async function sendAdminTask(taskText: string) {
  if (!NTFY_TOPIC) return
  await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
    method: 'POST',
    headers: {
      'Title': '🛠 Задача: Волшебная Сказка',
      'Priority': 'high',
      'Tags': 'fairy-tale-app',
    },
    body: taskText,
  })
}

export async function POST(req: NextRequest) {
  const update = await req.json()
  const msg = update.message
  const chatId = msg?.chat?.id
  const text = msg?.text?.toLowerCase().trim()
  const rawText = msg?.text?.trim()

  // Сообщение от владельца (не команда) — передать Claude Code как задачу
  if (chatId === parseInt(OWNER_CHAT_ID || '0') && rawText && !rawText.startsWith('/')) {
    await sendAdminTask(rawText)
    await sendMessage(chatId, `✅ Задача отправлена в Claude Code:\n\n<i>${rawText}</i>`)
    return NextResponse.json({ ok: true })
  }

  // /myid — узнать свой chat_id
  if (text === '/myid') {
    await sendMessage(chatId, `Ваш chat_id: <code>${chatId}</code>`)
    return NextResponse.json({ ok: true })
  }

  // /start
  if (text === '/start') {
    const name = msg.from?.first_name || 'друг'
    await sendMessage(chatId, `Привет, ${name}! 👋\n\nЯ создаю персональные сказки для детей за 1 минуту — с именем ребёнка, его страхами и любимым героем 🧸\n\nНажми кнопку ниже и попробуй бесплатно (3 сказки):`, OPEN_APP_KEYBOARD)
  }

  // Пользователь написал об оплате через СБП
  if (text && (text.includes('оплатил') || text.includes('оплатила') || text.includes('перевел') || text.includes('перевела'))) {
    const code = getNextCode()
    if (code) {
      await sendMessage(
        chatId,
        `✅ Спасибо за оплату!\n\nВаш код активации:\n\n<code>${code}</code>\n\nСкопируйте его и введите в приложении — нажмите на кнопку ниже 👇`,
        OPEN_APP_KEYBOARD,
      )
      // Уведомление владельцу
      if (OWNER_CHAT_ID) {
        await sendMessage(
          parseInt(OWNER_CHAT_ID),
          `💰 Новая оплата СБП!\nПользователь: @${msg.from?.username || msg.from?.first_name} (${chatId})\nВыдан код: <code>${code}</code>\n\n⚠️ Не забудь выдать чек в «Мой налог»!`,
        )
      }
    } else {
      await sendMessage(chatId, `Спасибо! Свяжитесь с нами для получения кода активации.`)
    }
  }

  // Подтверждение оплаты Stars
  if (update.pre_checkout_query) {
    await answerPreCheckout(update.pre_checkout_query.id, true)
  }

  // Успешная оплата Stars
  if (msg?.successful_payment) {
    const payload = msg.successful_payment.invoice_payload
    const stars = msg.successful_payment.total_amount
    const planText = payload === 'unlimited_30d' ? 'Безлимит на 30 дней' : '1 сказка'
    await sendMessage(
      chatId,
      `⭐ Оплата ${stars} Stars получена!\n\n<b>${planText}</b> активирован — возвращайся в приложение и создавай сказки ✨`,
      OPEN_APP_KEYBOARD,
    )
    if (OWNER_CHAT_ID) {
      await sendMessage(
        parseInt(OWNER_CHAT_ID),
        `⭐ Оплата Stars!\nПользователь: @${msg.from?.username || msg.from?.first_name}\nТариф: ${planText} (${stars} Stars)`,
      )
    }
  }

  return NextResponse.json({ ok: true })
}
