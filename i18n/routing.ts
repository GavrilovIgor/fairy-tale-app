import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ru', 'en'],
  defaultLocale: 'ru',
  localePrefix: 'as-needed', // /ru → /, /en → /en
  localeDetection: false,    // User chooses explicitly — no auto-redirect by browser language
})
