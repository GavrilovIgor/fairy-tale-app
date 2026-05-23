import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Как объяснить ребёнку смерть питомца — через сказку',
  description: 'Умер питомец и не знаете как объяснить ребёнку? Персональная сказка поможет пережить потерю мягко. ИИ создаёт историю за 1 минуту. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/pitomec` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Как объяснить ребёнку смерть питомца',
    description: 'Умер питомец и не знаете как объяснить ребёнку? Персональная сказка поможет пережить потерю мягко. ИИ создаёт историю за 1 минуту. Бесплатно.',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/pitomec`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Как объяснить ребёнку смерть питомца' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Как объяснить ребёнку смерть питомца</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Первый опыт потери — помочь пережить его с любовью</p>

      <p>Умерла рыбка, хомяк, кот, собака. Ребёнок плачет или — что пугает сильнее — не реагирует совсем. Как объяснить? «Улетел в другой город» — не работает, дети чувствуют ложь. «Умер» — пугает. <strong>Персональная сказка</strong> помогает мягко рассказать о смерти как о части жизни — через образы которые ребёнок может принять.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как дети переживают потерю питомца</h2>
      <p>Для ребёнка питомец часто первый близкий друг. Потеря реальная и сильная. Обесценивать («это просто рыбка») — обесценивать чувства ребёнка. Придумывать — создавать страх обмана. Сказка даёт язык для горя: герой прощается, помнит, продолжает жить.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li key={0} style={{ marginBottom: 8 }}>Вводите имя ребёнка и питомца: «умер кот Барсик»</li>
        <li key={1} style={{ marginBottom: 8 }}>ИИ создаёт историю где герой прощается с другом и хранит о нём память</li>
        <li key={2} style={{ marginBottom: 8 }}>Питомец «уходит в волшебный лес» — но его любовь остаётся с героем</li>
        <li key={3} style={{ marginBottom: 8 }}>Читайте в первые дни после потери — возможно несколько раз</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Мама Маши (6 лет): «Умер наш кот Тихон, с которым Маша выросла. Она не плакала — просто молчала два дня. Сказка про котика который ушёл в Звёздный лес — Маша плакала и говорила "он там тебя ждёт". После этого ей стало легче».</p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку про прощание
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
