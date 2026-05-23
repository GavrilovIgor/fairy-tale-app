import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Как объяснить ребёнку развод родителей — через сказку',
  description: 'Разводитесь и не знаете как объяснить ребёнку? Персональная сказка поможет рассказать о разводе мягко и понятно. ИИ создаёт историю за 1 минуту. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/razvod` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Как объяснить ребёнку развод родителей',
    description: 'Разводитесь и не знаете как объяснить ребёнку? Персональная сказка поможет рассказать о разводе мягко и понятно. ИИ создаёт историю за 1 минуту. Бесплатно.',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/razvod`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Как объяснить ребёнку развод родителей' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Как объяснить ребёнку развод родителей</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Сказка говорит то, что трудно сказать словами</p>

      <p>Объяснить ребёнку что мама и папа больше не живут вместе — одна из самых тяжёлых задач для родителей. Слова не находятся. Ребёнок чувствует что что-то не так, но не понимает что. <strong>Персональная сказка</strong> помогает ребёнку принять изменения — через историю где герой переживает похожее и находит опору.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как дети воспринимают развод</h2>
      <p>Дети до 7 лет часто берут вину на себя: «это из-за меня». Им нужно услышать три вещи: мама и папа оба любят тебя, это не твоя вина, у тебя есть два дома. Сказка доносит это через метафору — без давления и лишних слов.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li key={0} style={{ marginBottom: 8 }}>Вводите имя ребёнка и ситуацию: «родители разводятся», «папа уходит из семьи»</li>
        <li key={1} style={{ marginBottom: 8 }}>ИИ создаёт историю где звериная семья меняется но любовь остаётся</li>
        <li key={2} style={{ marginBottom: 8 }}>Герой живёт в двух уютных домиках и любим всеми</li>
        <li key={3} style={{ marginBottom: 8 }}>Читайте в период изменений — несколько раз, возвращайтесь к ней</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Мама Вани (4 года): «После того как мы разъехались с мужем Ваня спрашивал "папа ушёл потому что я плохой?". Сказка про двух медведей которые живут в разных берлогах но оба любят медвежонка — он сам попросил перечитать три раза».</p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку про изменения в семье
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
