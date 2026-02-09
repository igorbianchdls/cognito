import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/bigquery-test/codex-some': [
      // Keep only Linux binaries used by Vercel Node runtime.
      './node_modules/.pnpm/@openai+codex-sdk@*/node_modules/@openai/codex-sdk/vendor/x86_64-unknown-linux-musl/codex/codex',
    ],
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
