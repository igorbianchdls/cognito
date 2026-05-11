#!/usr/bin/env node

const DEFAULT_CHATGPT_APP_MCP_URL = 'https://cognito-seven.vercel.app/api/chatgpt-app/mcp'

const mcpUrl = (process.env.COGNITO_CHATGPT_APP_MCP_URL || DEFAULT_CHATGPT_APP_MCP_URL).trim()

const checks = [
  {
    title: 'Connector setup',
    steps: [
      'Open ChatGPT Settings > Connectors > Create.',
      `Use MCP URL: ${mcpUrl}`,
      'Complete the OAuth flow and confirm the connector is enabled.',
    ],
  },
  {
    title: 'Dashboard list UI',
    prompt: 'Liste meus dashboards e renderize como cards.',
    expected: [
      'ChatGPT calls dashboard_list.',
      'ChatGPT calls dashboard_render_list.',
      'The widget renders cards, not raw JSON.',
    ],
  },
  {
    title: 'Dashboard full preview UI',
    prompt: 'Abra o preview do dashboard <id> e renderize o dashboard completo.',
    expected: [
      'ChatGPT calls dashboard_read.',
      'ChatGPT calls dashboard_render_preview.',
      'The widget renders an iframe with the full Cognito dashboard.',
      'The iframe URL contains embed=1 and a signed token.',
    ],
  },
  {
    title: 'Domain tools UI',
    prompt: 'Mostre um resumo de ecommerce e renderize a resposta.',
    expected: [
      'ChatGPT calls ecommerce.',
      'The widget renders cards/chart/table for the structured result.',
    ],
  },
]

console.log('ChatGPT App Manual Test Plan')
console.log('')
console.log(`MCP URL: ${mcpUrl}`)
console.log('')
console.log('Before opening ChatGPT, run after deploy:')
console.log('COGNITO_MCP_TOKEN=... pnpm chatgpt-app:smoke')
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

console.log('If the UI does not appear, remove and recreate the connector so ChatGPT reloads the widget resource.')
