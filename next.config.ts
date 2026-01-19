import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep the package as external so its files (cli.js, wasm) are available at runtime
    serverExternalPackages: ["@anthropic-ai/claude-agent-sdk"],
  },
  // Ensure the Claude Code CLI and its wasm assets are included in the serverless trace
  outputFileTracingIncludes: {
    "/api/bigquery-test/ia-chat": [
      "node_modules/@anthropic-ai/claude-agent-sdk/cli.js",
      "node_modules/@anthropic-ai/claude-agent-sdk/resvg.wasm",
      "node_modules/@anthropic-ai/claude-agent-sdk/tree-sitter.wasm",
      "node_modules/@anthropic-ai/claude-agent-sdk/tree-sitter-bash.wasm",
      "node_modules/@anthropic-ai/claude-agent-sdk/vendor/**",
      "node_modules/@anthropic-ai/claude-agent-sdk/transport/**",
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
