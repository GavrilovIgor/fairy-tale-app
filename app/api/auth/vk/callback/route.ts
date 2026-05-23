import { NextRequest, NextResponse } from 'next/server'
import { upsertSocialUser, generateAuthRedirect } from '@/lib/auth/social'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://magicfairytale.ru'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const savedState = request.cookies.get('vk_oauth_state')?.value
  const codeVerifier = request.cookies.get('vk_code_verifier')?.value

  if (!state || state !== savedState || !codeVerifier) {
    return NextResponse.redirect(`${SITE_URL}?auth_error=invalid_state`)
  }
  if (!code) {
    return NextResponse.redirect(`${SITE_URL}?auth_error=no_code`)
  }

  try {
    // 1. Обмениваем code на access_token (VK ID OAuth 2.1)
    const tokenRes = await fetch('https://id.vk.com/oauth2/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.VK_CLIENT_ID!,
        client_secret: process.env.VK_CLIENT_SECRET!,
        code,
        redirect_uri: `${SITE_URL}/api/auth/vk/callback`,
        code_verifier: codeVerifier,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error(`No token: ${JSON.stringify(tokenData)}`)

    // 2. Получаем данные пользователя
    const userRes = await fetch('https://id.vk.com/oauth2/user_info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: new URLSearchParams({ client_id: process.env.VK_CLIENT_ID! }),
    })
    const { user: vkUser } = await userRes.json()
    if (!vkUser) throw new Error('No user info from VK')

    // VK может не дать email — используем синтетический
    const email = vkUser.email || `vk_${vkUser.user_id}@users.magicfairytale.ru`
    const name = [vkUser.first_name, vkUser.last_name].filter(Boolean).join(' ')

    // 3. Создаём/находим пользователя в Supabase
    await upsertSocialUser({
      email,
      name: name || undefined,
      avatar_url: vkUser.avatar || undefined,
      provider: 'vk',
    })

    // 4. Редирект через magic-link
    const authUrl = await generateAuthRedirect(email, SITE_URL)
    const response = NextResponse.redirect(authUrl)
    response.cookies.delete('vk_oauth_state')
    response.cookies.delete('vk_code_verifier')
    return response
  } catch (err) {
    console.error('VK auth error:', err)
    return NextResponse.redirect(`${SITE_URL}?auth_error=vk_failed`)
  }
}
