import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Сказка чтобы ребёнок ел — помочь малоежке через персональную историю',
  description: 'Ребёнок отказывается есть, выбирает только 2-3 продукта или устраивает истерики за столом? Персональная сказка поможет. ИИ создаёт историю за 1 минуту. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/eda` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Сказка чтобы ребёнок ел — помочь малоежке',
    description: 'Как персональная сказка помогает ребёнку попробовать новую еду и перестать капризничать за столом',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/eda`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Не хочет есть' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Сказка чтобы ребёнок ел</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Помочь малоежке — мягко, без принуждения и стресса</p>

      <p>«Не хочу», «фу», «не буду» — каждый приём пищи как переговоры. Многие родители к 3–4 годам уже не знают что делать: угрожать, уговаривать, прятать овощи? Ни то, ни другое не работает надолго. А вот <strong>персональная сказка про еду</strong> — работает, потому что обходит сопротивление.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему дети отказываются от еды</h2>
      <p>Отказ от еды — это часто про контроль. Еда — одна из немногих областей где маленький ребёнок может сказать «нет» и это сработает. Давление усугубляет ситуацию. Сказка предлагает другое: герой сам хочет попробовать новое, потому что это помогает ему в приключении.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li style={{ marginBottom: 8 }}>Вводите имя ребёнка и что он отказывается есть</li>
        <li style={{ marginBottom: 8 }}>ИИ создаёт историю где герой с таким же именем попадает в приключение</li>
        <li style={{ marginBottom: 8 }}>В сказке именно этот продукт помогает герою стать сильнее или умнее</li>
        <li style={{ marginBottom: 8 }}>Читайте за ужином — дети часто сами просят попробовать то, что ел герой</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Мама 4-летнего Гриши: <em>«Гриша не ел ничего зелёного от слова совсем. Мы сделали сказку где медвежонок Гриша ел волшебный горошек и стал быстро бегать. На следующий день Гриша сам взял горошину с тарелки. Я чуть не заплакала».</em></p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку про еду
        </a>
      </div>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Другие страхи</h2>
      <ul>
        <li><Link href="/straxi/temnota">Боится темноты</Link></li>
        <li><Link href="/straxi/odinochestvo">Боится оставаться один</Link></li>
        <li><Link href="/straxi/sadik">Не хочет идти в садик</Link></li>
        <li><Link href="/straxi/vrach">Боится врачей</Link></li>
        <li><Link href="/straxi/sobaki">Боится собак</Link></li>
        <li><Link href="/straxi/shkola">Боится школы</Link></li>
        <li><Link href="/straxi/son">Не может заснуть</Link></li>
        <li><Link href="/straxi/brat-sestra">Ревнует к братику или сестрёнке</Link></li>
        <li><Link href="/straxi/pereezd">Переезд в новый дом</Link></li>
      </ul>
    </div>
  )
}
