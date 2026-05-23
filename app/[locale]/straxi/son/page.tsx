import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Сказка на ночь чтобы ребёнок заснул — персональная сказка для засыпания',
  description: 'Ребёнок не может заснуть, боится ночи или просит побыть рядом? Персональная сказка успокоит и поможет уснуть. ИИ создаёт историю с именем вашего ребёнка за 1 минуту. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/son` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Сказка на ночь чтобы ребёнок заснул',
    description: 'Как персональная сказка помогает ребёнку успокоиться и заснуть',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/son`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Не может заснуть' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Сказка на ночь чтобы ребёнок заснул</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Персональная история успокоит и создаст уютный ритуал засыпания</p>

      <p>Укладывание спать превращается в битву? Ребёнок просит ещё один стакан воды, ещё одну историю, боится оставаться один в темноте? Знакомая картина для миллионов родителей. <strong>Персональная сказка на ночь</strong> — самый мягкий способ создать ритуал, который работает.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему дети не могут заснуть</h2>
      <p>Детский мозг к вечеру переполнен впечатлениями. Ему нужен плавный переход: от активности к покою. Сказка создаёт этот мост — замедляет темп, снижает тревогу, даёт ощущение безопасности. Особенно если герой — с тем же именем, что и ваш ребёнок.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li style={{ marginBottom: 8 }}>Вводите имя ребёнка и любимого героя (зайчонок, единорог, дракончик)</li>
        <li style={{ marginBottom: 8 }}>Указываете что мешает засыпать или чего боится ночью</li>
        <li style={{ marginBottom: 8 }}>ИИ создаёт спокойную историю — герой находит уютное место, засыпает с улыбкой</li>
        <li style={{ marginBottom: 8 }}>Читайте каждый вечер — за 2–3 недели формируется ритуал</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Папа 5-летней Ани: <em>«Аня не засыпала без нас по полтора часа — приходила, просила пить, плакала. Сделали сказку про зайчонку Аню которая находит волшебный сон-цветок. Теперь Аня сама просит "сказку про меня" и засыпает пока я читаю. Вечер снова наш».</em></p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку для засыпания
        </a>
      </div>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Другие страхи</h2>
      <ul>
        <li><Link href="/straxi/temnota" style={{ color: "#7c3aed" }}>Боится темноты</Link></li>
        <li><Link href="/straxi/odinochestvo" style={{ color: "#7c3aed" }}>Боится оставаться один</Link></li>
        <li><Link href="/straxi/sadik" style={{ color: "#7c3aed" }}>Не хочет идти в садик</Link></li>
        <li><Link href="/straxi/vrach" style={{ color: "#7c3aed" }}>Боится врачей</Link></li>
        <li><Link href="/straxi/sobaki" style={{ color: "#7c3aed" }}>Боится собак</Link></li>
        <li><Link href="/straxi/shkola" style={{ color: "#7c3aed" }}>Боится школы</Link></li>
        <li><Link href="/straxi/brat-sestra" style={{ color: "#7c3aed" }}>Ревнует к братику или сестрёнке</Link></li>
        <li><Link href="/straxi/pereezd" style={{ color: "#7c3aed" }}>Переезд в новый дом</Link></li>
      </ul>
    </div>
  )
}
