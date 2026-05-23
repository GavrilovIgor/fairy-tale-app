import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Сказка про переезд для ребёнка — помочь привыкнуть к новому дому',
  description: 'Переезжаете? Ребёнок тяжело переносит смену обстановки? Персональная сказка поможет принять новый дом. ИИ создаёт историю за 1 минуту. Метод сказкотерапии. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/pereezd` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Сказка про переезд для ребёнка',
    description: 'Как персональная сказка помогает ребёнку принять переезд и привыкнуть к новому дому',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/pereezd`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Переезд' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Сказка про переезд для ребёнка</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Помочь ребёнку принять новый дом — через историю, а не уговоры</p>

      <p>Переезд — второй по стрессовости жизненный опыт для ребёнка после развода родителей. Новый дом, новый садик или школа, нет старых друзей — всё знакомое исчезло. Дети реагируют по-разному: одни плачут, другие замыкаются, третьи злятся. <strong>Персональная сказка</strong> помогает сделать переезд приключением, а не потерей.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему детям тяжело переезжать</h2>
      <p>Для ребёнка «дом» — это не квартира. Это запахи, соседи, двор, маршрут до садика. Всё это создаёт ощущение безопасности. Когда оно исчезает — ребёнок теряет почву под ногами. Сказка помогает переосмыслить: новое место — это не конец, а начало новой главы.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li style={{ marginBottom: 8 }}>Вводите имя ребёнка и что его беспокоит в переезде</li>
        <li style={{ marginBottom: 8 }}>ИИ создаёт историю где герой тоже переезжал и боялся</li>
        <li style={{ marginBottom: 8 }}>Герой находит новых друзей, секретное место во дворе, свою комнату</li>
        <li style={{ marginBottom: 8 }}>Читайте до переезда и в первые недели на новом месте</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Мама 6-летней Сони: <em>«Соня отказывалась заходить в новую квартиру — стояла в дверях и плакала. Мы сделали сказку про лисёнка Соню которая переехала в новый лес и нашла там волшебное дерево. После сказки Соня пошла искать "своё дерево" во дворе. Нашла скамейку — теперь это её место».</em></p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку про переезд
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
        <li><Link href="/straxi/son" style={{ color: "#7c3aed" }}>Не может заснуть</Link></li>
        <li><Link href="/straxi/brat-sestra" style={{ color: "#7c3aed" }}>Ревнует к братику или сестрёнке</Link></li>
        <li><Link href="/straxi/eda" style={{ color: "#7c3aed" }}>Не хочет есть</Link></li>
      </ul>
    </div>
  )
}
