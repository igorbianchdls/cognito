import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForBuild: false,
  },
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium'],
  outputFileTracingIncludes: {
    '/*': ['./certificates/supabase-prod-ca-2021.crt'],
  },
  async redirects() {
    return [
      // Automação e CRM saíram de dentro do Inbox (novembro de 2026).
      ...['automacoes', 'disparos', 'negocios', 'relatorios'].flatMap(p => [
        { source: `/inbox/${p}`, destination: `/${p}`, permanent: true },
        { source: `/inbox/${p}/:path*`, destination: `/${p}/:path*`, permanent: true },
      ]),
      // Social virou Marketing (novembro de 2026): links antigos continuam funcionando.
      { source: '/social', destination: '/marketing', permanent: true },
      { source: '/social/:path*', destination: '/marketing/:path*', permanent: true },
      // Spaces virou Drive (novembro de 2026): links antigos continuam funcionando.
      { source: '/editor/spaces', destination: '/drive', permanent: true },
      { source: '/editor/spaces/:path*', destination: '/drive/:path*', permanent: true },
      { source: '/editor/pastas/:id', destination: '/drive/pastas/:id', permanent: true },
      {
        source: '/modulos',
        destination: '/erp',
        permanent: false,
      },
      {
        source: '/modulos/:path*',
        destination: '/erp/:path*',
        permanent: false,
      },
      {
        source: '/Relatórios',
        destination: '/erp',
        permanent: false,
      },
      {
        source: '/relatórios',
        destination: '/erp',
        permanent: false,
      },
      {
        source: '/relatorios',
        destination: '/erp',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
