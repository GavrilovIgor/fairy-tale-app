import { NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID!
const API = `https://api.telegram.org/bot${BOT_TOKEN}`

// Расписание постинга
// Все группы проверены — существуют и открыты для постинга
const SCHEDULE: Record<string, { group: string; name: string; post: string }> = {
  '2026-05-13': { group: '@mamochki_chat_ru', name: 'Мамочки чат (11к)', post: 'А' },
  '2026-05-15': { group: '@futureforkidschat', name: 'Родители России (7.6к)', post: 'Б' },
  '2026-05-16': { group: '@mama72rus', name: 'Мамы (8.5к)', post: 'В' },
  '2026-05-18': { group: '@mamachatik', name: 'Чат Мамочек (5.5к)', post: 'Г' },
  '2026-05-19': { group: '@moscowmums', name: 'Мамы Москвы (6.3к)', post: 'Д' },
  '2026-05-20': { group: '@mami_zao', name: 'Мамы ЗАО (6к)', post: 'А' },
  '2026-05-22': { group: '@chat_mam_v_dekrete', name: 'Мамы в декрете (1.3к)', post: 'Б' },
  '2026-05-23': { group: '@mama_rashan', name: 'Онлайн мама (1.3к)', post: 'В' },
  '2026-05-25': { group: '@mothers_kazan', name: 'Мамы Казани (3.3к)', post: 'Г' },
  '2026-05-26': { group: '@pitermums', name: 'Мамы Питера (2.9к)', post: 'Д' },
}

export async function GET() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' }) // YYYY-MM-DD
  const task = SCHEDULE[today]

  if (!task) {
    return NextResponse.json({ ok: true, message: 'No posting today' })
  }

  const text =
    `📣 <b>Сегодня день постинга!</b>\n\n` +
    `Группа: <b>${task.name}</b>\n` +
    `Username: <code>${task.group}</code>\n` +
    `Текст: <b>Пост ${task.post}</b> (из инструкции в Obsidian)\n\n` +
    `⏰ Лучшее время: 20:00–21:00\n\n` +
    `<i>Сначала вступи в группу, подожди 30–60 мин, потом пиши</i>`

  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: OWNER_CHAT_ID, text, parse_mode: 'HTML' }),
  })

  return NextResponse.json({ ok: true, sent: task })
}
