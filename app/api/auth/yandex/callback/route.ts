import { NextRequest, NextResponse } from 'next/server'
import { upsertSocialUser, generateAuthRedirect } from '@/lib/auth/social'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://magicfairytale.ru'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const savedState = request.cookies.get('yandex_oauth_state')?.value

  // CSRF-проверка
  if (!state || state !== savedState) {
    return NextResponse.redirect(`${SITE_URL}?auth_error=invalid_state`)
  }

  if (!code) {
    return NextResponse.redirect(`${SITE_URL}?auth_error=no_code`)
  }

  try {
    // 1. Обмениваем code на access_token
    const tokenRes = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.YANDEX_CLIENT_ID!,
        client_secret: process.env.YANDEX_CLIENT_SECRET!,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('No access token from Yandex')

    // 2. Получаем данные пользователя
    const userRes = await fetch('https://login.yandex.ru/info?format=json', {
      headers: { Authorization: `OAuth ${tokenData.access_token}` },
    })
    const yUser = await userRes.json()
    if (!yUser.default_email) throw new Error('No email from Yandex')

    // 3. Создаём/находим пользователя в Supabase
    await upsertSocialUser({
      email: yUser.default_email,
      name: yUser.display_name || yUser.real_name || yUser.login,
      avatar_url: yUser.default_avatar_id
        ? `https://avatars.yandex.net/get-yapic/${yUser.default_avatar_id}/islands-200`
        : undefined,
      provider: 'yandex',
    })

    // 4. Создаём сессию на сервере → редирект с куками
    const response = await generateAuthRedirect(yUser.default_email, SITE_URL)
    response.cookies.delete('yandex_oauth_state')
    return response
  } catch (err) {
    console.error('Yandex auth error:', err)
    return NextResponse.redirect(`${SITE_URL}?auth_error=yandex_failed`)
  }
}
