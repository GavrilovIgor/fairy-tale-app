import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Ребёнок не слушается — как справиться через сказку',
  description: 'Ребёнок игнорирует просьбы, устраивает истерики, делает всё наоборот? Персональная сказка помогает наладить контакт. ИИ создаёт историю за 1 минуту. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/ne-slushaetsya` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Ребёнок не слушается — что делать',
    description: 'Ребёнок игнорирует просьбы, устраивает истерики, делает всё наоборот? Персональная сказка помогает наладить контакт. ИИ создаёт историю за 1 минуту. Бесплатно.',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/ne-slushaetsya`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Ребёнок не слушается — что делать' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Ребёнок не слушается — что делать</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Сказка говорит с ребёнком на его языке — там где приказы не работают</p>

      <p>Сказали «иди спать» — побежал прыгать. Попросили убрать игрушки — словно не слышит. Каждый день одно и то же. Это не вредность и не плохое воспитание. Ребёнок проходит нормальный этап автономии. Но жить с этим тяжело. <strong>Персональная сказка</strong> не заменяет правила — она помогает ребёнку захотеть их соблюдать.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему ребёнок не слушается</h2>
      <p>Дети от 2 до 6 лет переживают кризисы самостоятельности: «я сам», «не хочу», «нет». Это важно для развития. Проблема не в непослушании — а в том что ребёнок ещё не умеет договариваться. Герой сказки показывает: можно хотеть по-своему И при этом жить с другими.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li key={0} style={{ marginBottom: 8 }}>Вводите имя ребёнка и ситуацию: «не слушается», «делает всё наоборот»</li>
        <li key={1} style={{ marginBottom: 8 }}>ИИ создаёт историю где герой тоже не хотел слушать взрослых</li>
        <li key={2} style={{ marginBottom: 8 }}>Герой сталкивается с последствиями — и сам приходит к решению</li>
        <li key={3} style={{ marginBottom: 8 }}>После сказки обсудите: «Как думаешь, почему у него получилось?»</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Мама Артёма (4 года): «Мы каждый вечер воевали за ужин, зубы и сон. Начали читать сказку про медвежонка Артёма. На третий вечер он сам пошёл чистить зубы — "как медвежонок". Я просто не верила».</p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку для непоседы
        </a>
      </div>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Другие ситуации</h2>
      <ul>
        <li><Link href="/straxi/temnota">Боится темноты</Link></li>
        <li><Link href="/straxi/odinochestvo">Боится оставаться один</Link></li>
        <li><Link href="/straxi/sadik">Не хочет в садик</Link></li>
        <li><Link href="/straxi/vrach">Боится врачей</Link></li>
        <li><Link href="/straxi/sobaki">Боится собак</Link></li>
        <li><Link href="/straxi/shkola">Боится школы</Link></li>
        <li><Link href="/straxi/son">Не может заснуть</Link></li>
        <li><Link href="/straxi/brat-sestra">Ревнует к братику/сестрёнке</Link></li>
      </ul>
    </div>
  )
}
