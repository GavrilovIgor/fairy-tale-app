import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Сказка про ревность к братику или сестрёнке — помочь старшему ребёнку',
  description: 'Старший ребёнок ревнует к новорождённому? Персональная сказка поможет принять братика или сестрёнку. ИИ создаёт историю за 1 минуту. Метод сказкотерапии. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/brat-sestra` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Сказка про ревность к братику или сестрёнке',
    description: 'Как персональная сказка помогает старшему ребёнку принять появление братика или сестрёнки',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/brat-sestra`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Ревность к братику/сестрёнке' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Сказка про ревность к братику или сестрёнке</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Помочь старшему ребёнку принять новое — через историю, а не объяснения</p>

      <p>Появление второго ребёнка — огромный стресс для первенца. Ещё вчера он был центром вселенной, а сегодня мама занята малышом. Капризы, регресс, агрессия к младенцу — это не вредность, это крик о помощи. <strong>Персональная сказка</strong> помогает старшему ребёнку почувствовать: его любят не меньше, просто по-другому.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему появляется ревность</h2>
      <p>Дети до 7 лет воспринимают внимание как ресурс: если его получает братик, значит мне достаётся меньше. Это не эгоизм — это нормальная реакция. Сказка помогает переработать эту эмоцию: герой тоже злился, но потом понял что братик — это навсегда рядом, а не вместо.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li style={{ marginBottom: 8 }}>Вводите имя старшего ребёнка и имя малыша</li>
        <li style={{ marginBottom: 8 }}>Указываете ситуацию: «ревнует к новорождённому», «злится на братика»</li>
        <li style={{ marginBottom: 8 }}>ИИ создаёт историю где старший герой проходит путь от ревности к дружбе</li>
        <li style={{ marginBottom: 8 }}>В сказке оба брата/сестры становятся командой — это важно для идентификации</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Мама двух детей: <em>«Маша (4 года) начала бить новорождённого Лёшу — щипала, толкала. Мы сделали сказку где лисёнок Маша сначала злилась на братика, а потом спасла его от дождика и стала самой важной сестрой в лесу. Через неделю Маша сама просила подержать Лёшу».</em></p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку про братика или сестрёнку
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
        <li><Link href="/straxi/pereezd">Переезд в новый дом</Link></li>
      </ul>
    </div>
  )
}
