import { NextResponse } from 'next/server'
import crypto from 'crypto'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://magicfairytale.ru'

export async function GET() {
  const state = crypto.randomBytes(16).toString('hex')

  // VK ID OAuth 2.1 — PKCE обязателен
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  const params = new URLSearchParams({
    client_id: process.env.VK_CLIENT_ID!,
    redirect_uri: `${SITE_URL}/api/auth/vk/callback`,
    response_type: 'code',
    scope: 'email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const response = NextResponse.redirect(`https://id.vk.com/authorize?${params}`)

  response.cookies.set('vk_oauth_state', state, {
    httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/',
  })
  response.cookies.set('vk_code_verifier', codeVerifier, {
    httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/',
  })

  return response
}
