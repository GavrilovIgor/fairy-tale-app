import { NextRequest, NextResponse } from 'next/server'

const USED_KEY_PREFIX = 'used_'

// Коды хранятся в PROMO_CODES env через запятую
function getAvailableCodes(): Set<string> {
  const raw = process.env.PROMO_CODES || ''
  return new Set(raw.split(',').map(c => c.trim()).filter(Boolean))
}

// Использованные коды — в отдельных env переменных (простейшее хранилище для MVP)
// В продакшне заменить на Redis/KV
function isUsed(code: string): boolean {
  return process.env[`${USED_KEY_PREFIX}${code}`] === '1'
}

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Код не указан' }, { status: 400 })
  }

  const normalized = code.trim().toUpperCase()
  const valid = getAvailableCodes()

  if (!valid.has(normalized)) {
    return NextResponse.json({ error: 'Неверный код активации' }, { status: 400 })
  }

  // MVP: без персистентной БД код валидируем, но повторное использование на стороне клиента
  // Клиент сам сохраняет что код применён — для MVP достаточно
  return NextResponse.json({ ok: true, plan: 'unlimited_30d' })
}
