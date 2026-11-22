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
