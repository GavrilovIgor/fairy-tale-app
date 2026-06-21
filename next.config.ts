import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Self-host (next start) на Next 16 + next-intl (localePrefix: as-needed):
  // без этих флагов rewrite '/'→'/ru' превращается в редирект на '/' →
  // бесконечная петля. На Vercel не проявляется (свой роутинг-слой).
  skipProxyUrlNormalize: true,
  skipTrailingSlashRedirect: true,
};

export default withNextIntl(nextConfig);
