import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://skazka-ai.vercel.app'

export const metadata: Metadata = {
  title: 'Ребёнок боится врача — персональная сказка для помощи',
  description: 'Если ребёнок боится врачей и больниц — сказкотерапия помогает. Создайте персональную историю с именем ребёнка за 1 минуту. Герой преодолевает страх доктора. 3 сказки бесплатно.',
  alternates: { canonical: `${BASE}/straxi/vrach` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Ребёнок боится врача: как подготовить через сказку',
    description: 'Страх медицинских процедур у детей и метод сказкотерапии для подготовки к врачу',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/vrach`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Страх врачей' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Ребёнок боится врача: как подготовить через сказку</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Страх медицинских процедур у детей — и как сказка помогает</p>

      <p>Страх врачей — второй по распространённости детский страх после боязни темноты. Он абсолютно логичен: незнакомый человек в белом халате делает что-то неприятное. Но его можно значительно снизить с помощью правильной подготовки.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему сказка работает перед визитом к врачу</h2>
      <p>Когда ребёнок слышит историю про героя, который тоже боялся врача — но оказалось что доктор добрый и хочет помочь — это формирует новый образ. Не «враг в белом халате», а «добрый помощник».</p>
      <p>Читайте сказку за 2–3 дня до визита, несколько вечеров подряд. К моменту похода в клинику ребёнок уже «бывал там» в своём воображении.</p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку про доктора</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · 1 минута · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку
        </a>
      </div>

      <ul>
        <li><Link href="/straxi/temnota">Боится темноты</Link></li>
        <li><Link href="/straxi/odinochestvo">Боится оставаться один</Link></li>
        <li><Link href="/straxi/sadik">Не хочет идти в садик</Link></li>
      </ul>
    </div>
  )
}
