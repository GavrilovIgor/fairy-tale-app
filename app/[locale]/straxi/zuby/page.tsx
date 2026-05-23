import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Ребёнок не хочет чистить зубы — как помочь через сказку',
  description: 'Чистка зубов каждый раз как война? Персональная сказка превратит её в ритуал который ребёнок любит. ИИ создаёт историю за 1 минуту. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/zuby` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Ребёнок не хочет чистить зубы — что делать',
    description: 'Чистка зубов каждый раз как война? Персональная сказка превратит её в ритуал который ребёнок любит. ИИ создаёт историю за 1 минуту. Бесплатно.',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/zuby`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Ребёнок не хочет чистить зубы — что делать' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Ребёнок не хочет чистить зубы — что делать</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Превратить чистку зубов в ритуал — через персональную историю</p>

      <p>Каждый вечер одно и то же: уговоры, слёзы, побеги. Ребёнок закрывает рот, выплёвывает пасту, кричит «не буду». А вы боитесь кариеса и нервничаете. Заставлять — стресс для всех. Есть способ лучше: <strong>сделать чистку зубов частью любимой сказки</strong>.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему дети отказываются чистить зубы</h2>
      <p>Детям не нравится вкус пасты, ощущение щётки, потеря времени. Но главное — это ещё один момент где взрослый контролирует. Сказка меняет рамку: не «надо» а «хочу — как мой герой».</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li key={0} style={{ marginBottom: 8 }}>Вводите имя ребёнка: «не хочет чистить зубы», «убегает от щётки»</li>
        <li key={1} style={{ marginBottom: 8 }}>ИИ создаёт историю где герой защищает зубы от «сладких монстров»</li>
        <li key={2} style={{ marginBottom: 8 }}>Щётка становится «волшебным мечом» — чистка зубов превращается в игру</li>
        <li key={3} style={{ marginBottom: 8 }}>Читайте прямо во время чистки зубов или сразу до неё</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Мама Миши (4 года): «Миша ненавидел зубную щётку. Мы сделали сказку где медвежонок Миша сражается с кариесными монстрами. Теперь он сам берёт щётку и говорит "пора бить монстров". Это чудо».</p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку про чистку зубов
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
