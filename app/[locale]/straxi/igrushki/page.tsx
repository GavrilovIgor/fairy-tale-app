import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Ребёнок не убирает игрушки — как приучить через сказку',
  description: 'Уборка игрушек каждый раз заканчивается скандалом? Персональная сказка поможет приучить к порядку без конфликтов. ИИ создаёт историю за 1 минуту. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/igrushki` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Ребёнок не убирает игрушки — как приучить',
    description: 'Уборка игрушек каждый раз заканчивается скандалом? Персональная сказка поможет приучить к порядку без конфликтов. ИИ создаёт историю за 1 минуту. Бесплатно.',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/igrushki`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Ребёнок не убирает игрушки — как приучить' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Ребёнок не убирает игрушки — как приучить</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Порядок через сказку — работает там где требования не помогают</p>

      <p>«Убери игрушки!» — «Сейчас». Проходит час. Игрушки на месте, ребёнок играет дальше. Знакомо? Уборка — скучно, требует усилий и прерывает игру. Кричать и наказывать создаёт негативную ассоциацию с порядком. <strong>Персональная сказка</strong> делает уборку частью приключения.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему дети не убирают</h2>
      <p>Для ребёнка беспорядок — это следы игры, живой мир. Убирать = убивать игру. Мозг сопротивляется. Сказка меняет смысл: игрушки «устали» и хотят «домой», навести порядок = позаботиться о друзьях.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li key={0} style={{ marginBottom: 8 }}>Вводите имя ребёнка: «не убирает игрушки», «оставляет всё на полу»</li>
        <li key={1} style={{ marginBottom: 8 }}>ИИ создаёт историю где игрушки героя обижались что их бросали</li>
        <li key={2} style={{ marginBottom: 8 }}>Герой наводит порядок и игрушки «оживают» снова</li>
        <li key={3} style={{ marginBottom: 8 }}>Введите ритуал: читать сказку пока ребёнок убирает</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Мама Лёши (5 лет): «Я устала каждый вечер убирать сама. Сделала сказку где кубики Лёши грустили в углу. После сказки Лёша спросил "а мои кубики тоже грустят?". С тех пор убирает. Не всегда, но убирает».</p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку про уборку
        </a>
      </div>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Другие ситуации</h2>
      <ul>
        <li><Link href="/straxi/temnota" style={{ color: "#7c3aed" }}>Боится темноты</Link></li>
        <li><Link href="/straxi/odinochestvo" style={{ color: "#7c3aed" }}>Боится оставаться один</Link></li>
        <li><Link href="/straxi/sadik" style={{ color: "#7c3aed" }}>Не хочет в садик</Link></li>
        <li><Link href="/straxi/vrach" style={{ color: "#7c3aed" }}>Боится врачей</Link></li>
        <li><Link href="/straxi/sobaki" style={{ color: "#7c3aed" }}>Боится собак</Link></li>
        <li><Link href="/straxi/shkola" style={{ color: "#7c3aed" }}>Боится школы</Link></li>
        <li><Link href="/straxi/son" style={{ color: "#7c3aed" }}>Не может заснуть</Link></li>
        <li><Link href="/straxi/brat-sestra" style={{ color: "#7c3aed" }}>Ревнует к братику/сестрёнке</Link></li>
      </ul>
    </div>
  )
}
