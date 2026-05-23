import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = 'https://magicfairytale.ru'

export const metadata: Metadata = {
  title: 'Ребёнок врёт и обманывает — как помочь через сказку',
  description: 'Ребёнок начал врать? Персональная сказка объяснит почему честность важна — мягко, без морализаторства. ИИ создаёт историю за 1 минуту. Бесплатно.',
  alternates: { canonical: `${BASE}/straxi/lzhet` },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Ребёнок врёт — как объяснить через сказку',
    description: 'Ребёнок начал врать? Персональная сказка объяснит почему честность важна — мягко, без морализаторства. ИИ создаёт историю за 1 минуту. Бесплатно.',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    publisher: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    mainEntityOfPage: `${BASE}/straxi/lzhet`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Страхи', item: `${BASE}/straxi` },
      { '@type': 'ListItem', position: 3, name: 'Ребёнок врёт — как объяснить через сказку' },
    ],
  },
]

export default function Page() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'Georgia, serif', lineHeight: 1.7, color: '#333' }}>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <h1 style={{ fontSize: 28, color: '#4a1d96', marginBottom: 8 }}>Ребёнок врёт — как объяснить через сказку</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Не читать лекции, а рассказать историю — это работает лучше</p>

      <p>Поймали на лжи — и не знаете как реагировать? Наказать строго или поговорить? Ни то ни другое не учит честности системно. Детская ложь — это нормальный этап: ребёнок тестирует границы реальности. <strong>Персональная сказка</strong> показывает на примере героя что честность выгоднее.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Почему дети врут</h2>
      <p>Дети 3–7 лет врут по нескольким причинам: боятся наказания, хотят получить желаемое, проверяют реакцию взрослых, или просто фантазируют. Морализаторство усиливает защиту. Сказка обходит её: герой сам приходит к выводу что врать невыгодно.</p>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>Как работает персональная сказка</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li key={0} style={{ marginBottom: 8 }}>Вводите имя ребёнка и ситуацию: «говорит неправду», «скрывает что разбил»</li>
        <li key={1} style={{ marginBottom: 8 }}>ИИ создаёт историю где герой соврал и потерял доверие друзей</li>
        <li key={2} style={{ marginBottom: 8 }}>В финале герой честно признаётся — и всё налаживается</li>
        <li key={3} style={{ marginBottom: 8 }}>Обсудите после: «А ты бы как поступил?»</li>
      </ol>

      <h2 style={{ fontSize: 20, color: '#4a1d96', marginTop: 32 }}>История из жизни</h2>
      <p>Папа 5-летней Вики: «Вика начала врать по мелочам постоянно. После сказки про лисёнка который потерял друзей из-за лжи — она сама пришла и призналась что разбила кружку. Первый раз за полгода».</p>

      <div style={{ background: '#f3e8ff', borderRadius: 16, padding: '24px 32px', margin: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: '#4a1d96', marginBottom: 8 }}>Создайте сказку для вашего ребёнка</p>
        <p style={{ color: '#666', marginBottom: 20 }}>3 сказки бесплатно · Готово за 1 минуту · Иллюстрации включены</p>
        <a href="/" style={{ background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 'bold', fontSize: 16 }}>
          ✨ Создать сказку про честность
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
