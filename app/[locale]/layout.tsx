import type { Metadata } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

type Locale = 'ru' | 'en'

const META: Record<Locale, Metadata> = {
  ru: {
    title: "Волшебная Сказка — персональные сказки для детей с иллюстрациями",
    description: "Создайте уникальную сказку с именем вашего ребёнка за 1 минуту. Помогает при страхе темноты, разлуки, врачей. Основано на принципах сказкотерапии. 3 сказки бесплатно.",
    keywords: "персональная сказка для ребенка, сказкотерапия онлайн, сказка со страхом, детские страхи, сказка с именем ребенка",
    openGraph: {
      title: "Волшебная Сказка — персональные сказки для детей",
      description: "Сказка с именем вашего ребёнка, его страхом и любимым героем. За 1 минуту. С иллюстрациями.",
      url: "https://skazka-ai.vercel.app",
      siteName: "Волшебная Сказка",
      locale: "ru_RU",
      type: "website",
    },
    alternates: { canonical: "https://skazka-ai.vercel.app" },
  },
  en: {
    title: "Magic Tale — personalized therapeutic stories for children",
    description: "Create a unique fairy tale with your child's name in 1 minute. Helps with fear, jealousy, new school. Based on story therapy. 3 stories free.",
    keywords: "personalized fairy tale, story therapy, children fear, therapeutic stories, custom fairy tale",
    openGraph: {
      title: "Magic Tale — personalized stories for children",
      description: "A story featuring your child's name, fears, and favorite hero. In 1 minute. With illustrations.",
      url: "https://skazka-ai.vercel.app/en",
      siteName: "Magic Tale",
      locale: "en_US",
      type: "website",
    },
    alternates: { canonical: "https://skazka-ai.vercel.app/en" },
  },
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return META[locale as Locale] ?? META.ru
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

  return (
    <html lang={locale}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,600;7..72,700&family=Lora:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{__html:`
          if('scrollRestoration' in history){history.scrollRestoration='manual'}
          window.scrollTo(0,0)
        `}}/>
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
