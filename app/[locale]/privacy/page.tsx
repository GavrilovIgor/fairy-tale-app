import type { Metadata } from 'next'

const META: Record<string, Metadata> = {
  ru: { title: 'Политика конфиденциальности — Волшебная Сказка' },
  en: { title: 'Privacy Policy — Magic Fairy Tales' },
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return META[locale] ?? META.ru
}

const CONTENT = {
  ru: {
    back: '← Назад',
    backHref: '/',
    title: 'Политика конфиденциальности',
    updated: 'Последнее обновление: 16 мая 2026 г.',
    sections: [
      { title: '1. Кто мы', text: '«Волшебная Сказка» — сервис для создания персональных терапевтических сказок для детей. Сайт: magicfairytale.ru. Вопросы: gigor92@gmail.com' },
      { title: '2. Какие данные мы собираем', text: `При регистрации через Google: имя, email, фото профиля.\nПри регистрации по email: только email.\nПри использовании: имя и возраст ребёнка, тема сказки, сохранённые истории.\nТехнические данные: сессионные cookies.` },
      { title: '3. Зачем мы используем данные', text: `— Для работы сервиса и синхронизации сказок между устройствами\n— Для персонализации историй\n— Для обработки платежей через ЮKassa (данные карт не хранятся)\n— Данные не продаются третьим лицам` },
      { title: '4. Хранение', text: 'Серверы Supabase (ЕС, Франкфурт). Удаление данных — по запросу на gigor92@gmail.com в течение 7 рабочих дней.' },
      { title: '5. Cookies', text: 'Только технические cookies для авторизации. Рекламных нет.' },
      { title: '6. Ваши права', text: `Вы вправе: получить доступ, исправить, удалить данные, экспортировать сказки.\nОбращайтесь: gigor92@gmail.com` },
      { title: '7. Дети', text: 'Сервис для родителей. Данные о детях (имя, возраст) вводит только родитель — для персонализации истории.' },
      { title: '8. Изменения', text: 'О существенных изменениях уведомим по email. Продолжение использования = согласие с обновлённой политикой.' },
    ],
    contact: 'Вопросы?',
    contactLink: 'gigor92@gmail.com',
  },
  en: {
    back: '← Back',
    backHref: '/en',
    title: 'Privacy Policy',
    updated: 'Last updated: 16 May 2026',
    sections: [
      { title: '1. Who we are', text: 'Magic Fairy Tales is a service for creating personalised therapeutic stories for children. Website: magicfairytale.ru. Contact: gigor92@gmail.com' },
      { title: '2. What we collect', text: `When signing in with Google: name, email address, profile photo.\nWhen signing in with email: email address only.\nWhen using the service: your child's name and age, story theme, saved stories.\nTechnical data: session cookies required for login.` },
      { title: '3. How we use your data', text: `— To provide the service and sync your stories across devices\n— To personalise the generated stories\n— To process payments (we do not store card details)\n— We never sell your data to third parties` },
      { title: '4. Data storage', text: 'Data is stored on Supabase servers (EU, Frankfurt). You can request deletion at any time by emailing gigor92@gmail.com — we will action this within 7 business days.' },
      { title: '5. Cookies', text: 'We use only essential session cookies required for authentication. No advertising cookies.' },
      { title: '6. Your rights', text: `You have the right to: access your data, correct inaccuracies, request deletion, and export your stories.\nContact us at: gigor92@gmail.com` },
      { title: '7. Children', text: 'This service is designed for parents. We do not collect data directly from children — only a name and age entered by the parent to personalise the story.' },
      { title: '8. Changes to this policy', text: 'We will notify you by email of any significant changes. Continued use of the service constitutes acceptance of the updated policy.' },
    ],
    contact: 'Questions?',
    contactLink: 'gigor92@gmail.com',
  },
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const c = CONTENT[locale as 'ru' | 'en'] ?? CONTENT.ru

  return (
    <div style={{ background: '#fef9f3', minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        <a href={c.backHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0d2b1e', fontSize: 14, marginBottom: 32, textDecoration: 'none', opacity: 0.7 }}>
          {c.back}
        </a>

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: '#0d2b1e', marginBottom: 8 }}>
          {c.title}
        </h1>
        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 40 }}>{c.updated}</p>

        {c.sections.map(({ title, text }) => (
          <section key={title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#0d2b1e', marginBottom: 12 }}>
              {title}
            </h2>
            <p style={{ color: '#374151', lineHeight: 1.7, fontSize: 15, whiteSpace: 'pre-line' }}>
              {text}
            </p>
          </section>
        ))}

        <div style={{ marginTop: 48, padding: '20px 24px', background: '#f0f5f0', borderRadius: 12 }}>
          <p style={{ color: '#466252', fontSize: 14, lineHeight: 1.6 }}>
            <strong>{c.contact}</strong>{' '}
            <a href={`mailto:${c.contactLink}`} style={{ color: '#0d2b1e' }}>{c.contactLink}</a>
          </p>
        </div>
      </div>
    </div>
  )
}
