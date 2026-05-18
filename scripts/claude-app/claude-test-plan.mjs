#!/usr/bin/env node

const DEFAULT_CLAUDE_APP_MCP_URL = 'https://cognito-seven.vercel.app/api/claude-app/mcp'

const mcpUrl = (process.env.COGNITO_CLAUDE_APP_MCP_URL || DEFAULT_CLAUDE_APP_MCP_URL).trim()

const checks = [
  {
    title: 'Preflight',
    steps: [
      'Deploy the current code.',
      'Confirm COGNITO_CLAUDE_APP_OAUTH_SECRET and COGNITO_CLAUDE_APP_EMBED_SECRET exist in Vercel, or confirm fallbacks are intentionally used.',
      'Run: COGNITO_MCP_TOKEN=... pnpm claude-app:smoke',
    ],
  },
  {
    title: 'Connector setup',
    steps: [
      'Open Claude connector settings.',
      `Use MCP URL: ${mcpUrl}`,
      'Complete the OAuth flow and confirm the connector is enabled.',
    ],
  },
  {
    title: 'Dashboard list',
    prompt: 'Liste meus dashboards.',
    expected: [
      'Claude calls dashboards.',
      'The MCP Apps widget renders dashboard cards.',
    ],
  },
  {
    title: 'Interactive dashboard',
    prompt: 'Abra o dashboard <id> como app interativo.',
    expected: [
      'Claude calls open_artifact with { kind: "dashboard", id }.',
      'The MCP Apps widget opens.',
      'The widget renders the full Cognito dashboard iframe.',
      'The iframe URL contains embed=1 and a signed token.',
    ],
  },
  {
    title: 'Analytical UI',
    prompt: 'Mostre um resumo de ecommerce como app interativo.',
    expected: [
      'Claude calls ecommerce.',
      'The MCP Apps widget renders cards, chart, or table from structuredContent.',
    ],
  },
]

console.log('Claude App Manual Test Plan')
console.log('')
console.log(`MCP URL: ${mcpUrl}`)
console.log('')

for (const [index, check] of checks.entries()) {
  console.log(`${index + 1}. ${check.title}`)
  if (check.prompt) {
    console.log(`Prompt: ${check.prompt}`)
  }
  const lines = check.steps || check.expected || []
  for (const line of lines) {
    console.log(`- ${line}`)
  }
  console.log('')
}

console.log('If the UI does not appear, remove and recreate the connector so Claude reloads the MCP Apps resource.')
