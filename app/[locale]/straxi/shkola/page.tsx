import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Сказка про школу для ребёнка — помочь первокласснику не бояться школы',
  description: 'Ребёнок боится идти в школу? Персональная сказка поможет справиться с тревогой. ИИ создаёт историю с именем вашего ребёнка за 1 минуту. Метод сказкотерапии. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/shkola` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Сказка про школу для ребёнка — помочь первокласснику',
    description: 'Как персональная сказка помогает ребёнку справиться с тревогой перед школой',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/shkola`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Страх школы' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Сказка про школу для ребёнка</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Помочь первокласснику не бояться нового — мягко и через историю</p>

      <p>Перед первым сентября многие дети испытывают настоящую тревогу: новые люди, незнакомые правила, страх не справиться. Это нормально. Но если ребёнок плачет, отказывается собирать портфель или жалуется на живот — пора действовать. <strong>Персональная сказка</strong> помогает мягко подготовить его к школе.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Что пугает детей в школе</h2>
      <p>Чаще всего дети боятся: не найти друзей, получить плохую оценку, не понравиться учительнице, потеряться в большом здании. Объяснения «всё будет хорошо» не снимают тревогу. Сказка работает глубже — ребёнок <em>проживает</em> успешный опыт через героя.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li style={{ marginBottom: 8 }}>Вводите имя ребёнка, возраст и любимого героя</li>
        <li style={{ marginBottom: 8 }}>Указываете что беспокоит: «боится школы», «не хочет идти в первый класс»</li>
        <li style={{ marginBottom: 8 }}>ИИ создаёт историю где герой тоже переживал — и нашёл друзей, и понравился учителю</li>
        <li style={{ marginBottom: 8 }}>Читайте вместе за неделю до 1 сентября — каждый вечер по главе</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Мама первоклассника Димы: <em>«Дима за две недели до школы начал плакать по вечерам. Мы сделали сказку про медвежонка который тоже боялся школы. К первому сентября он уже сам рассказывал младшей сестре как его герой подружился с белочкой на переменке. Пошёл в школу спокойно».</em></p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку про школу
        </a>
      </div>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Другие страхи</h2>
      <ul>
        <li><Link href="/straxi/temnota" style={{ color: "#7c3aed" }}>Боится темноты</Link></li>
        <li><Link href="/straxi/sadik" style={{ color: "#7c3aed" }}>Не хочет идти в садик</Link></li>
        <li><Link href="/straxi/vrach" style={{ color: "#7c3aed" }}>Боится врачей</Link></li>
        <li><Link href="/straxi/sobaki" style={{ color: "#7c3aed" }}>Боится собак</Link></li>
        <li><Link href="/straxi/son" style={{ color: "#7c3aed" }}>Не может заснуть</Link></li>
        <li><Link href="/straxi/brat-sestra" style={{ color: "#7c3aed" }}>Ревнует к братику или сестрёнке</Link></li>
        <li><Link href="/straxi/pereezd" style={{ color: "#7c3aed" }}>Переезд в новый дом</Link></li>
      </ul>
    </div>
  )
}
