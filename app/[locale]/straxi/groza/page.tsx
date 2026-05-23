import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Ребёнок боится грозы и грома — сказка которая помогает',
  description: 'Ребёнок прячется при грозе, плачет от грома? Персональная сказка поможет справиться со страхом. ИИ создаёт историю за 1 минуту. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/groza` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Ребёнок боится грозы и грома — как помочь',
    description: 'Ребёнок прячется при грозе, плачет от грома? Персональная сказка поможет справиться со страхом. ИИ создаёт историю за 1 минуту. Бесплатно.',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/groza`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Ребёнок боится грозы и грома — как помочь' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Ребёнок боится грозы и грома — как помочь</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Превратить страшный гром в понятное и даже интересное явление</p>

      <p>Первые раскаты грома — и ребёнок уже под одеялом или на руках. Каждый дождь с грозой превращается в стресс для всей семьи. Страх грозы у детей — один из самых распространённых. Объяснения про «тучки и электричество» не работают: страх не рациональный. <strong>Персональная сказка</strong> даёт грому новый смысл.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему дети боятся грозы</h2>
      <p>Гром — внезапный, громкий, непредсказуемый. Ребёнок не контролирует ситуацию. Это запускает реакцию страха. Сказка помогает переосмыслить: гром — это великан который чихнул, облака играют в мяч, молния — фотоаппарат неба. Новый образ снижает тревогу.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li key={0} style={{ marginBottom: 8 }}>Вводите имя ребёнка: «боится грозы», «плачет от грома»</li>
        <li key={1} style={{ marginBottom: 8 }}>ИИ создаёт историю где герой узнаёт кто «живёт» в тучах</li>
        <li key={2} style={{ marginBottom: 8 }}>Гром получает имя и характер — перестаёт быть угрозой</li>
        <li key={3} style={{ marginBottom: 8 }}>Читайте заранее — до сезона гроз или сразу после испуга</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Папа Серёжи (4 года): «При каждой грозе Серёжа прибегал в нашу кровать в слезах. Сделали сказку про великана Громослава который чихает. Теперь Серёжа при ударе грома говорит "Громослав опять чихнул!" и смеётся».</p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку про грозу
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
