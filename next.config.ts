import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium'],
  outputFileTracingIncludes: {
    '/*': ['./certificates/supabase-prod-ca-2021.crt'],
  },
  async redirects() {
    return [
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
