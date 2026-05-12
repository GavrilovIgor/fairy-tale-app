import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
