import { MetadataRoute } from 'next'

const BASE = 'https://magicfairytale.ru'

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
    { url: `${BASE}/straxi/sobaki`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/shkola`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/son`,          lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/brat-sestra`,  lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/eda`,          lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/pereezd`,         lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/kusaetsya`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/lzhet`,           lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/ne-slushaetsya`,  lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/zhadnichaet`,     lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/kovyriaet-v-nosu`,lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/zuby`,            lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/igrushki`,        lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/stomatolog`,      lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/groza`,           lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/stesnyaetsya`,    lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/razvod`,          lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/straxi/pitomec`,         lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    // Privacy
    { url: `${BASE}/privacy`,    lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/en/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
