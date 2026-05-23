import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { supabaseAdmin, writeRegistrationBonus } from '@/lib/supabase/admin'

export interface SocialUser {
  email: string
  name?: string
  avatar_url?: string
  provider: 'yandex' | 'vk' | 'telegram'
}

/** Найти или создать пользователя, вернуть его userId */
export async function upsertSocialUser(user: SocialUser): Promise<string> {
  // Пробуем создать — если уже есть, ловим ошибку и ищем
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: user.email,
    email_confirm: true,
    user_metadata: {
      full_name: user.name ?? '',
      avatar_url: user.avatar_url ?? '',
      provider: user.provider,
    },
  })

  if (!error && created.user) {
    // Новый пользователь — даём бонус
    await writeRegistrationBonus(created.user.id)
    return created.user.id
  }

  // Пользователь уже существует — находим по email
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const existing = users.find(u => u.email === user.email)
  if (!existing) throw new Error(`User not found after create failed: ${error?.message}`)

  // Обновляем метаданные (имя, аватар)
  await supabaseAdmin.auth.admin.updateUserById(existing.id, {
    user_metadata: {
      ...existing.user_metadata,
      full_name: user.name ?? existing.user_metadata?.full_name,
      avatar_url: user.avatar_url ?? existing.user_metadata?.avatar_url,
    },
  })

  return existing.id
}

/**
 * Создать сессию на сервере и вернуть редирект с куками.
 * Пользователь придёт на главную уже авторизованным (без клиентской обработки хэша).
 *
 * Алгоритм:
 * 1. Admin генерирует magic-link → получаем email_otp (OTP-код)
 * 2. Верифицируем OTP через публичный клиент → получаем access_token + refresh_token
 * 3. Записываем токены в куки NextResponse через @supabase/ssr
 * 4. Возвращаем редирект на главную с уже установленными куками
 */
export async function generateAuthRedirect(email: string, finalRedirect: string): Promise<NextResponse> {
  // 1. Генерируем OTP через admin API
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (linkError || !linkData.properties?.email_otp) {
    throw new Error(linkError?.message ?? 'generateLink: no email_otp returned')
  }

  const otp = linkData.properties.email_otp

  // 2. Верифицируем OTP через публичный клиент (без persistSession — мы в server context)
  const supabasePublic = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { data: sessionData, error: sessionError } = await supabasePublic.auth.verifyOtp({
    email,
    token: otp,
    type: 'magiclink',
  })
  if (sessionError || !sessionData.session) {
    throw new Error(sessionError?.message ?? 'verifyOtp: no session returned')
  }

  const { access_token, refresh_token } = sessionData.session

  // 3. Создаём редирект и записываем куки
  const response = NextResponse.redirect(finalRedirect)

  const supabaseSSR = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  await supabaseSSR.auth.setSession({ access_token, refresh_token })

  return response
}
