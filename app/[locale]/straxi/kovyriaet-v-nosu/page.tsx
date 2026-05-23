import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Ребёнок ковыряет в носу — как отучить через сказку',
  description: 'Ребёнок постоянно ковыряет в носу? Персональная сказка поможет избавиться от привычки мягко и без стресса. ИИ создаёт историю за 1 минуту. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/kovyriaet-v-nosu` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Ребёнок ковыряет в носу — как отучить',
    description: 'Ребёнок постоянно ковыряет в носу? Персональная сказка поможет избавиться от привычки мягко и без стресса. ИИ создаёт историю за 1 минуту. Бесплатно.',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/kovyriaet-v-nosu`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Ребёнок ковыряет в носу — как отучить' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Ребёнок ковыряет в носу — как отучить</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Без одёргиваний и стыда — только через историю</p>

      <p>Делает это везде: за столом, в садике, на прогулке, в гостях. Замечания не помогают — через минуту опять. Это не вредность: ковыряние в носу у детей — это сенсорная потребность или привычка при скуке/стрессе. Наказания и стыд закрепляют привычку. <strong>Персональная сказка</strong> предлагает альтернативу через игровой образ.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему дети ковыряют в носу</h2>
      <p>Это аутостимуляция: мозг ищет ощущения. Дёргать ребёнка каждый раз — фиксировать внимание на привычке. Работает другое: дать герою сказки ту же привычку, показать как он сам от неё отказался — и предложить альтернативу (мять антистресс, носить браслет-напоминалку).</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li key={0} style={{ marginBottom: 8 }}>Вводите имя ребёнка: «ковыряет в носу», «не может остановиться»</li>
        <li key={1} style={{ marginBottom: 8 }}>ИИ создаёт историю где герой с такой же привычкой нашёл классную замену</li>
        <li key={2} style={{ marginBottom: 8 }}>В сказке есть конкретное действие-замена — можно внедрить в жизнь</li>
        <li key={3} style={{ marginBottom: 8 }}>Читайте 5–7 дней — без одновременных замечаний</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Папа Вани (5 лет): «Ваня ковырял в носу на автомате. Мы сделали сказку где зайчонок Ваня заменил это на "игру с ушками" — тёр мочку уха. Смешно звучит, но через неделю нос он трогал в три раза реже».</p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку для вашего ребёнка
        </a>
      </div>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Другие ситуации</h2>
      <ul>
        <li><Link href="/straxi/temnota">Боится темноты</Link></li>
        <li><Link href="/straxi/odinochestvo">Боится оставаться один</Link></li>
        <li><Link href="/straxi/sadik">Не хочет в садик</Link></li>
        <li><Link href="/straxi/vrach">Боится врачей</Link></li>
        <li><Link href="/straxi/sobaki">Боится собак</Link></li>
        <li><Link href="/straxi/shkola">Боится школы</Link></li>
        <li><Link href="/straxi/son">Не может заснуть</Link></li>
        <li><Link href="/straxi/brat-sestra">Ревнует к братику/сестрёнке</Link></li>
      </ul>
    </div>
  )
}
