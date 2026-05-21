import { MetadataRoute } from 'next'

const BASE = 'https://skazka-ai.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    // Главные страницы — обе локали
    { url: BASE,           lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/en`,   lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    // Лендинги по страхам (RU)
    { url: `${BASE}/straxi/temnota`,      lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/odinochestvo`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/sadik`,        lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/vrach`,        lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    // Privacy
    { url: `${BASE}/privacy`,    lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/en/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
