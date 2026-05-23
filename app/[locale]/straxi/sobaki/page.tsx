import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Сказка для ребёнка который боится собак — персональная история с иллюстрациями',
  description: 'Помогите ребёнку перестать бояться собак через персональную сказку. ИИ создаёт уникальную историю за 1 минуту с именем вашего ребёнка. Метод сказкотерапии. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/sobaki` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Сказка для ребёнка который боится собак',
    description: 'Как персональная сказка помогает ребёнку преодолеть страх собак методом сказкотерапии',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/sobaki`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Страх собак' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Сказка для ребёнка который боится собак</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Метод сказкотерапии — доступно каждой семье</p>

      <p>Страх собак — один из самых частых страхов у детей 2–7 лет. Особенно если ребёнка однажды облаяли или напугали. Запрещать контакт с животными не выход: собаки везде. Но есть добрый способ помочь — <strong>персональная сказка</strong>.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему ребёнок боится собак</h2>
      <p>Дети не умеют читать сигналы животных. Лай, резкое движение, большой размер — всё это активирует инстинкт опасности. Объяснения «собака добрая» не работают, потому что страх живёт не в голове, а в теле. Сказка помогает иначе: герой <em>проходит</em> через страх вместе с ребёнком.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li style={{ marginBottom: 8 }}>Вводите имя ребёнка и его любимого персонажа (лисёнок, котёнок, медвежонок)</li>
        <li style={{ marginBottom: 8 }}>Указываете страх: «боится собак», «кричит когда видит пса»</li>
        <li style={{ marginBottom: 8 }}>ИИ создаёт историю где герой знакомится с добрым щенком и перестаёт бояться</li>
        <li style={{ marginBottom: 8 }}>Три сцены с акварельными иллюстрациями — читать 5 минут перед сном</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Мама 3-летнего Кирилла: <em>«После того как соседская собака прыгнула на Кирилла, он боялся даже маленьких. Мы читали сказку про котёнка который подружился со щенком три вечера подряд. На четвёртый день он сам потянулся погладить собаку в парке. Я не верила что так бывает».</em></p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку про собак
        </a>
      </div>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Другие страхи</h2>
      <ul>
        <li><Link href="/straxi/temnota">Боится темноты</Link></li>
        <li><Link href="/straxi/odinochestvo">Боится оставаться один</Link></li>
        <li><Link href="/straxi/sadik">Не хочет идти в садик</Link></li>
        <li><Link href="/straxi/vrach">Боится врачей</Link></li>
        <li><Link href="/straxi/shkola">Боится идти в школу</Link></li>
        <li><Link href="/straxi/son">Не может заснуть</Link></li>
        <li><Link href="/straxi/brat-sestra">Ревнует к братику или сестрёнке</Link></li>
        <li><Link href="/straxi/pereezd">Переезд в новый дом</Link></li>
      </ul>
    </div>
  )
}
