import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Ребёнок кусается — как отучить через сказку',
  description: 'Ребёнок кусается в садике или дома? Персональная сказка поможет справиться с этой привычкой мягко, без наказаний. ИИ создаёт историю за 1 минуту. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/kusaetsya` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Ребёнок кусается — как помочь через сказку',
    description: 'Ребёнок кусается в садике или дома? Персональная сказка поможет справиться с этой привычкой мягко, без наказаний. ИИ создаёт историю за 1 минуту. Бесплатно.',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/kusaetsya`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Ребёнок кусается — как помочь через сказку' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Ребёнок кусается — как помочь через сказку</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Мягкий способ объяснить что так нельзя — без криков и наказаний</p>

      <p>Укусил в садике, укусил брата, укусил маму — и смотрит с вызовом. Знакомо? Кусание у детей 1,5–4 лет — нормальный этап развития. Но «нормальный» не значит «приемлемый». Крики и наказания не работают — ребёнок ещё не умеет управлять импульсами. <strong>Персональная сказка</strong> объясняет на языке который он понимает.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему дети кусаются</h2>
      <p>Ребёнок кусается когда не может выразить эмоцию словами: злость, страх, перевозбуждение. Это не агрессия — это коммуникация. Сказка помогает найти слова: герой тоже злился, но научился говорить «я злюсь» вместо того чтобы кусаться.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li key={0} style={{ marginBottom: 8 }}>Вводите имя ребёнка и ситуацию: «кусает других детей в садике»</li>
        <li key={1} style={{ marginBottom: 8 }}>ИИ создаёт историю где зверёк с таким же именем тоже кусался</li>
        <li key={2} style={{ marginBottom: 8 }}>Герой учится говорить о чувствах — и все хотят с ним дружить</li>
        <li key={3} style={{ marginBottom: 8 }}>Читайте 3–5 вечеров подряд — эффект накопительный</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Воспитатель Елена: «Максим (3 года) кусал детей почти каждый день. Мама принесла сказку — читали дома неделю. Через 10 дней укусов не было. Я не верила в сказки, теперь верю».</p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку про кусание
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
