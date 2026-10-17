import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForBuild: false,
  },
  turbopack: {
    root: process.cwd(),
  },
  // esbuild-wasm compiles React apps on save; it loads esbuild.wasm from its own package folder.
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium', 'esbuild-wasm'],
  outputFileTracingIncludes: {
    '/*': ['./certificates/supabase-prod-ca-2021.crt'],
    // Real pnpm folder only: Vercel rejects files included through the node_modules symlink.
    '/api/apps/\\[\\[\\.\\.\\.path\\]\\]': ['./node_modules/.pnpm/esbuild-wasm@*/node_modules/esbuild-wasm/**/*'],
    // The chat tools save React apps too, so the MCP routes compile as well.
    '/api/mcp': ['./node_modules/.pnpm/esbuild-wasm@*/node_modules/esbuild-wasm/**/*'],
    '/api/claude/mcp': ['./node_modules/.pnpm/esbuild-wasm@*/node_modules/esbuild-wasm/**/*'],
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
