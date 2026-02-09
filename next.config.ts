import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/bigquery-test/codex-some': [
      './node_modules/@openai/codex-sdk/vendor/**/*',
      './node_modules/@openai/codex-sdk/dist/**/*',
      './node_modules/.pnpm/@openai+codex-sdk@*/node_modules/@openai/codex-sdk/vendor/**/*',
      './node_modules/.pnpm/@openai+codex-sdk@*/node_modules/@openai/codex-sdk/dist/**/*',
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
