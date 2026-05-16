import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "cyrillic-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Magic Tale / Волшебная Сказка",
  description: "Personalized therapeutic fairy tales for children. Story therapy in 30 seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
