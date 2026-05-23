import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {
  const state = crypto.randomBytes(16).toString('hex')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.YANDEX_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://magicfairytale.ru'}/api/auth/yandex/callback`,
    state,
    force_confirm: 'no',
  })

  const response = NextResponse.redirect(
    `https://oauth.yandex.ru/authorize?${params}`
  )

  // Сохраняем state в cookie для проверки CSRF
  response.cookies.set('yandex_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return response
}
