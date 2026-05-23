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

/** Сгенерировать одноразовую magic-link для входа и вернуть URL редиректа */
export async function generateAuthRedirect(email: string, finalRedirect: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: finalRedirect },
  })
  if (error || !data.properties?.action_link) {
    throw new Error(error?.message ?? 'Failed to generate magic link')
  }
  return data.properties.action_link
}
