import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Ребёнок боится стоматолога — как подготовить через сказку',
  description: 'Ребёнок панически боится зубного врача? Персональная сказка поможет подготовиться к визиту без слёз. ИИ создаёт историю за 1 минуту. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/stomatolog` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Ребёнок боится стоматолога — как подготовить',
    description: 'Ребёнок панически боится зубного врача? Персональная сказка поможет подготовиться к визиту без слёз. ИИ создаёт историю за 1 минуту. Бесплатно.',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/stomatolog`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Ребёнок боится стоматолога — как подготовить' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Ребёнок боится стоматолога — как подготовить</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Превратить поход к зубному в приключение — ещё до визита</p>

      <p>Плач начинается ещё в машине. В кресле — истерика. Врач ничего не может сделать. Знакомо? Страх стоматолога у детей — один из самых сильных. Он основан на неизвестности и потере контроля. <strong>Персональная сказка</strong> даёт ребёнку «репетицию» визита — безопасно, с добрым исходом.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему дети боятся стоматолога</h2>
      <p>Чужой человек, странные звуки, что-то во рту — всё это активирует инстинкт опасности. Объяснения «не больно» не помогают. Сказка даёт герою тот же опыт: он боялся, пошёл, справился — и получил награду.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li key={0} style={{ marginBottom: 8 }}>Вводите имя ребёнка: «боится стоматолога», «истерика у зубного»</li>
        <li key={1} style={{ marginBottom: 8 }}>ИИ создаёт историю где герой идёт к «зубному волшебнику»</li>
        <li key={2} style={{ marginBottom: 8 }}>В сказке врач — добрый помощник, кресло — «трон», инструменты — «волшебные палочки»</li>
        <li key={3} style={{ marginBottom: 8 }}>Читайте за 3–5 дней до визита — каждый вечер</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Мама Кати (5 лет): «Катя при слове "зубной" начинала плакать. Читали сказку 4 дня. На приёме она попросила врача показать "волшебный крючок" — прямо словами из сказки. Врач растрогался. Обошлось без слёз».</p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку про стоматолога
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
