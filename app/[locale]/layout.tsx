import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

type Locale = 'ru' | 'en'

const BASE = 'https://skazka-ai.vercel.app'

const META: Record<Locale, Metadata> = {
  ru: {
    title: "Волшебная Сказка — персональные сказки для детей с иллюстрациями",
    description: "Создайте уникальную сказку с именем вашего ребёнка за 1 минуту. Помогает при страхе темноты, разлуки, врачей. Основано на принципах сказкотерапии. 3 сказки бесплатно.",
    keywords: "персональная сказка для ребенка, сказкотерапия онлайн, сказка со страхом, детские страхи, сказка с именем ребенка",
    openGraph: {
      title: "Волшебная Сказка — персональные сказки для детей",
      description: "Сказка с именем вашего ребёнка, его страхом и любимым героем. За 1 минуту. С иллюстрациями.",
      url: BASE,
      siteName: "Волшебная Сказка",
      locale: "ru_RU",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Волшебная Сказка — персональные сказки для детей",
      description: "Сказка с именем вашего ребёнка, его страхом и любимым героем. За 1 минуту. С иллюстрациями.",
    },
    alternates: {
      canonical: BASE,
      languages: { ru: BASE, en: `${BASE}/en`, 'x-default': BASE },
    },
  },
  en: {
    title: "Magic Tale — personalized therapeutic stories for children",
    description: "Create a unique fairy tale with your child's name in 1 minute. Helps with fear, jealousy, new school. Based on story therapy. 3 stories free.",
    keywords: "personalized fairy tale, story therapy, children fear, therapeutic stories, custom fairy tale",
    openGraph: {
      title: "Magic Tale — personalized stories for children",
      description: "A story featuring your child's name, fears, and favorite hero. In 1 minute. With illustrations.",
      url: `${BASE}/en`,
      siteName: "Magic Tale",
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Magic Tale — personalized stories for children",
      description: "A story featuring your child's name, fears, and favorite hero. In 1 minute. With illustrations.",
    },
    alternates: {
      canonical: `${BASE}/en`,
      languages: { ru: BASE, en: `${BASE}/en`, 'x-default': BASE },
    },
  },
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return META[locale as Locale] ?? META.ru
}

const JSON_LD: Record<Locale, object> = {
  ru: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Волшебная Сказка',
    url: BASE,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    description: 'Персональные сказки для детей с иллюстрациями. Помогает при страхах темноты, разлуки, садика.',
    inLanguage: 'ru',
    author: { '@type': 'Organization', name: 'Волшебная Сказка', url: BASE },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB', description: '3 сказки бесплатно' },
  },
  en: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Magic Tale',
    url: `${BASE}/en`,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    description: 'Personalized fairy tales for children with illustrations. Helps with fears.',
    inLanguage: 'en',
    author: { '@type': 'Organization', name: 'Magic Tale', url: BASE },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: '3 stories free' },
  },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as Locale)) {
    notFound()
  }

  const messages = await getMessages()
  const jsonLd = JSON_LD[locale as Locale] ?? JSON_LD.ru

  return (
    <NextIntlClientProvider messages={messages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </NextIntlClientProvider>
  )
}
