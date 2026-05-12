import { NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID!
const API = `https://api.telegram.org/bot${BOT_TOKEN}`

// Расписание постинга
const SCHEDULE: Record<string, { group: string; name: string; post: string }> = {
  '2026-05-12': { group: '@mamachatik', name: 'Чат Мамочек', post: 'А' },
  '2026-05-13': { group: '@mamochki_chat_ru', name: 'Мамочки чат', post: 'Б' },
  '2026-05-15': { group: '@futureforkidschat', name: 'Родители России Чат', post: 'В' },
  '2026-05-16': { group: '@chat_mam_v_dekrete', name: 'Мамы в декрете', post: 'Г' },
  '2026-05-18': { group: '@opdor_chat', name: 'Чат Объединение Родителей', post: 'Д' },
  '2026-05-19': { group: '@sentyabryata_2025_Chat', name: 'Сентябрята 2025', post: 'А' },
  '2026-05-20': { group: '@oktyabryata_2025_chat', name: 'Октябрята 2025', post: 'Б' },
  '2026-05-22': { group: '@noyabryata_2025_chat', name: 'Ноябрята 2025', post: 'В' },
  '2026-05-23': { group: '@rod_chat_CO', name: 'Чат для Родителей', post: 'Г' },
  '2026-05-25': { group: 'Мамы [твой город]', name: 'Локальная группа', post: 'Д' },
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
