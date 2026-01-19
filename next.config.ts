import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the Claude Code CLI and its wasm assets are included in the serverless trace
  outputFileTracingIncludes: {
    // Use file-system path key for the app route to ensure proper tracing
    "src/app/api/bigquery-test/ia-chat/route.ts": [
      "./node_modules/@anthropic-ai/claude-agent-sdk/cli.js",
      "./node_modules/@anthropic-ai/claude-agent-sdk/resvg.wasm",
      "./node_modules/@anthropic-ai/claude-agent-sdk/tree-sitter.wasm",
      "./node_modules/@anthropic-ai/claude-agent-sdk/tree-sitter-bash.wasm",
    ],
  },
  async redirects() {
    return [
      {
        source: '/Relatórios',
        destination: '/modulos/relatorios',
        permanent: false,
      },
      {
        source: '/relatórios',
        destination: '/modulos/relatorios',
        permanent: false,
      },
      {
        source: '/relatorios',
        destination: '/modulos/relatorios',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
