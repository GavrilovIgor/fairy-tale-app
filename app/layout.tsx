import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "cyrillic-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Волшебная Сказка — персональные сказки для детей с иллюстрациями",
  description: "Создайте уникальную сказку с именем вашего ребёнка за 1 минуту. Помогает при страхе темноты, разлуки, врачей. Основано на принципах сказкотерапии. 3 сказки бесплатно.",
  keywords: "персональная сказка для ребенка, сказкотерапия онлайн, сказка со страхом, детские страхи, сказка с именем ребенка, сказка про страх темноты, сказка для засыпания",
  openGraph: {
    title: "Волшебная Сказка — персональные сказки для детей",
    description: "Сказка с именем вашего ребёнка, его страхом и любимым героем. За 1 минуту. С иллюстрациями.",
    url: "https://skazka-ai.vercel.app",
    siteName: "Волшебная Сказка",
    locale: "ru_RU",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://skazka-ai.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${jakarta.variable} h-full antialiased`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,600;7..72,700&family=Lora:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
