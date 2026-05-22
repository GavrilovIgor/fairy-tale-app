import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Ребёнок боится оставаться один — сказка для помощи | Волшебная Сказка',
  description: 'Если ребёнок не отпускает маму и боится одиночества — персональная сказка поможет. ИИ создаёт историю с именем вашего ребёнка за 1 минуту. Метод сказкотерапии. 3 истории бесплатно.',
  alternates: { canonical: `${BASE}/straxi/odinochestvo` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Ребёнок боится оставаться один: как помочь через сказку',
    description: 'Сепарационная тревога у детей — причины и помощь через метод сказкотерапии',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/odinochestvo`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Страх одиночества' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Ребёнок боится оставаться один: как помочь через сказку</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Страх разлуки у детей 2–6 лет — и как с ним работать</p>

      <p>Страх разлуки (сепарационная тревога) — когда ребёнок не отпускает маму даже на минуту, плачет если та выходит из комнаты — встречается у 15–20% детей дошкольного возраста. Это не капризы: это настоящий страх, который ребёнок не может контролировать.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему объяснения не помогают</h2>
      <p>«Мама всегда вернётся», «бояться нечего» — эти слова работают на уровне сознания, а страх живёт глубже. Сказкотерапия обходит защитный барьер: ребёнок видит героя, который <em>тоже боялся</em>, и через его опыт безопасно переживает ситуацию сам.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Реальная история</h2>
      <p>Папа-разработчик Игорь рассказывает о своей 4-летней дочке Тае: <em>«Она не отпускала маму буквально никуда. Я написал для неё сказку — про зайчонка, который тоже боялся что мама уйдёт. После нескольких вечеров она сама стала ходить по квартире одна и попросилась гулять знакомиться с детьми. Теперь говорит что не боится».</em></p>
      <p>Именно эту историю Игорь положил в основу сервиса — чтобы любая семья могла создать такую же сказку для своего ребёнка.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как создать сказку</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li style={{ marginBottom: 8 }}>Введите имя ребёнка и его возраст</li>
        <li style={{ marginBottom: 8 }}>Опишите страх: «боится когда мама выходит», «не хочет оставаться один»</li>
        <li style={{ marginBottom: 8 }}>Выберите любимого героя ребёнка</li>
        <li style={{ marginBottom: 8 }}>Через 1 минуту — готовая сказка с иллюстрациями и вопросами для обсуждения</li>
      </ol>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку
        </a>
      </div>

      <ul>
        <li><Link href="/straxi/temnota">Боится темноты</Link></li>
        <li><Link href="/straxi/sadik">Не хочет идти в садик</Link></li>
        <li><Link href="/straxi/vrach">Боится врачей</Link></li>
      </ul>
    </div>
  )
}
