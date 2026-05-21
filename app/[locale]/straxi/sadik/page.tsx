import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://skazka-ai.vercel.app'

export const metadata: Metadata = {
  title: 'Ребёнок не хочет идти в садик — как помочь через сказку',
  description: 'Персональная сказка поможет ребёнку принять садик. ИИ создаёт историю с именем вашего ребёнка за 1 минуту. Герой преодолевает страх нового места. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/sadik` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Ребёнок не хочет в садик: сказка как инструмент адаптации',
    description: 'Как персональная сказка помогает ребёнку адаптироваться к детскому саду',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/sadik`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Страх садика' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Ребёнок не хочет в садик: сказка как инструмент адаптации</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Как сказкотерапия помогает при адаптации к детскому саду</p>

      <p>Страх садика — один из главных испытаний для детей 2,5–4 лет. Слёзы при расставании, отказ одеваться, жалобы на болезни — всё это проявления тревоги перед чем-то новым и незнакомым.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Сказка как подготовка к новому</h2>
      <p>Персональная сказка помогает ребёнку «проиграть» ситуацию заранее в безопасном формате. Герой с таким же именем и страхом идёт в новое место, знакомится с другими зверятами, находит друга — и возвращается счастливым.</p>
      <p>Это не обман и не манипуляция — это то, как работает детская психика. Через образы и истории она готовится к реальности.</p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку про садик</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · 1 минута · С иллюстрациями</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку
        </a>
      </div>

      <ul>
        <li><Link href="/straxi/temnota">Боится темноты</Link></li>
        <li><Link href="/straxi/odinochestvo">Боится оставаться один</Link></li>
        <li><Link href="/straxi/vrach">Боится врачей</Link></li>
      </ul>
    </div>
  )
}
