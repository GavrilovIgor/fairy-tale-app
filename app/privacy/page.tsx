export const metadata = { title: 'Политика конфиденциальности — Волшебная Сказка' }

export default function PrivacyPage() {
  return (
    <div style={{ background: '#fef9f3', minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0d2b1e', fontSize: 14, marginBottom: 32, textDecoration: 'none', opacity: 0.7 }}>
          ← Назад
        </a>

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: '#0d2b1e', marginBottom: 8 }}>
          Политика конфиденциальности
        </h1>
        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 40 }}>Последнее обновление: 16 мая 2026 г.</p>

        {[
          {
            title: '1. Кто мы',
            text: '«Волшебная Сказка» — сервис для создания персональных терапевтических сказок для детей. Сайт доступен по адресу skazka-ai.vercel.app. По всем вопросам: gigor92@gmail.com'
          },
          {
            title: '2. Какие данные мы собираем',
            text: `При регистрации через Google: имя, адрес электронной почты, фотография профиля из вашего аккаунта Google.
При регистрации по email: только адрес электронной почты.
При использовании сервиса: данные из формы (имя ребёнка, возраст, тема сказки), созданные и сохранённые сказки.
Технические данные: файлы cookie для поддержания сессии.`
          },
          {
            title: '3. Зачем мы используем эти данные',
            text: `— Для обеспечения работы сервиса и сохранения ваших сказок между устройствами
— Для персонализации создаваемых историй
— Для обработки платежей через ЮKassa (мы не храним данные банковских карт)
— Мы не продаём и не передаём ваши данные третьим лицам в маркетинговых целях`
          },
          {
            title: '4. Хранение данных',
            text: 'Данные хранятся на серверах Supabase (ЕС, Франкфурт). Вы можете запросить удаление своих данных в любое время, написав на gigor92@gmail.com — данные будут удалены в течение 7 рабочих дней.'
          },
          {
            title: '5. Cookies',
            text: 'Мы используем только технические cookies, необходимые для авторизации (сессионный токен). Рекламных cookies нет.'
          },
          {
            title: '6. Ваши права',
            text: `Вы вправе:
— Получить доступ к своим данным
— Исправить неточные данные
— Удалить свои данные
— Экспортировать свои сказки

Для реализации прав обратитесь по адресу: gigor92@gmail.com`
          },
          {
            title: '7. Дети',
            text: 'Сервис предназначен для родителей. Мы не собираем данные о детях напрямую — только имя и возраст, которые вводит родитель для персонализации сказки.'
          },
          {
            title: '8. Изменения политики',
            text: 'При существенных изменениях мы уведомим вас по email. Продолжение использования сервиса означает согласие с обновлённой политикой.'
          },
        ].map(({ title, text }) => (
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
            <strong>Вопросы?</strong> Пишите на{' '}
            <a href="mailto:gigor92@gmail.com" style={{ color: '#0d2b1e' }}>gigor92@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}
