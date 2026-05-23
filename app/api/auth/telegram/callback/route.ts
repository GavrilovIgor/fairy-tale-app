import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { upsertSocialUser, generateAuthRedirect } from '@/lib/auth/social'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://magicfairytale.ru'
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

function verifyTelegramHash(data: Record<string, string>): boolean {
  const { hash, ...rest } = data
  if (!hash) return false

  // Проверяем что данные не старше 24 часов
  const authDate = parseInt(rest.auth_date ?? '0', 10)
  if (Date.now() / 1000 - authDate > 86400) return false

  // Строка для проверки: key=value отсортированные по ключу через \n
  const checkString = Object.entries(rest)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest()
  const expectedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')

  return expectedHash === hash
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // Telegram передаёт данные как query-параметры
  const data: Record<string, string> = {}
  searchParams.forEach((v, k) => { data[k] = v })

  if (!verifyTelegramHash(data)) {
    return NextResponse.redirect(`${SITE_URL}?auth_error=telegram_invalid`)
  }

  try {
    const tgId = data.id
    const firstName = data.first_name ?? ''
    const lastName = data.last_name ?? ''
    const username = data.username
    const photoUrl = data.photo_url

    // Telegram не даёт email — используем синтетический
    const email = `telegram_${tgId}@users.magicfairytale.ru`
    const name = [firstName, lastName].filter(Boolean).join(' ') || username || `tg_${tgId}`

    await upsertSocialUser({
      email,
      name,
      avatar_url: photoUrl,
      provider: 'telegram',
    })

    const authUrl = await generateAuthRedirect(email, SITE_URL)
    return NextResponse.redirect(authUrl)
  } catch (err) {
    console.error('Telegram auth error:', err)
    return NextResponse.redirect(`${SITE_URL}?auth_error=telegram_failed`)
  }
}
