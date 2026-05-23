import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Ребёнок жадничает и не делится — как научить делиться через сказку',
  description: 'Ребёнок не делится игрушками, жадничает в садике? Персональная сказка научит делиться без принуждения. ИИ создаёт историю за 1 минуту. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/zhadnichaet` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Ребёнок жадничает и не делится — как помочь',
    description: 'Ребёнок не делится игрушками, жадничает в садике? Персональная сказка научит делиться без принуждения. ИИ создаёт историю за 1 минуту. Бесплатно.',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/zhadnichaet`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Ребёнок жадничает и не делится — как помочь' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Ребёнок жадничает и не делится — как помочь</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Научить делиться через историю — намного эффективнее чем заставлять</p>

      <p>Сцена на площадке: другой ребёнок тянется к машинке — и ваш уже кричит «моё!». Воспитатель говорит «не делится ни с кем». Знакомо? Жадность у детей 2–5 лет — это нормальный этап формирования границ. Заставлять делиться через силу создаёт обиду. <strong>Персональная сказка</strong> показывает почему делиться — это круто.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему дети не делятся</h2>
      <p>Для ребёнка «моё» — это про безопасность и идентичность. Он только учится понимать что вещи можно отдать и вернуть. Принуждение не учит щедрости — оно учит подчиняться. Сказка работает иначе: герой делится и получает от этого радость.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li key={0} style={{ marginBottom: 8 }}>Вводите имя ребёнка: «не делится игрушками», «жадничает в садике»</li>
        <li key={1} style={{ marginBottom: 8 }}>ИИ создаёт историю где герой сначала не хотел делиться</li>
        <li key={2} style={{ marginBottom: 8 }}>Герой делится и обнаруживает что друзей стало больше а игрушки вернулись</li>
        <li key={3} style={{ marginBottom: 8 }}>Читайте перед важными ситуациями — днём рождения, поездкой в гости</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Мама Насти (3,5 года): «Настя в садике была "та самая жадина". После двух недель со сказкой воспитательница сказала что Настя сама предложила девочке свою лопатку. Я чуть не плакала от радости».</p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку про щедрость
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
