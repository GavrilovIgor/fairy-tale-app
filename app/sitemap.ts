import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://skazka-ai.vercel.app'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/straxi/temnota`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/straxi/odinochestvo`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/straxi/sadik`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/straxi/vrach`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/skazkoterapiya`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]
}
