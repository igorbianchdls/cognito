// Temporário: chama uma tool do MCP com o mesmo código do servidor, em produção, como o conector faria.
// Uso: node --import tsx scripts/_mcp_call_tmp.ts <tool> <arquivo-json-com-argumentos>
import { readFileSync } from 'node:fs'
import dotenv from 'dotenv'
Object.assign(process.env, dotenv.parse(readFileSync('.env.local')))

async function main() {
  const { executeTool } = await import('../src/products/mcpcore/application/executeTool')
  const { loadPluginPrincipal } = await import('../src/products/mcpcore/auth/resolvePrincipal')
  const [tool, file] = process.argv.slice(2)
  const args = file ? JSON.parse(readFileSync(file, 'utf8')) : {}
  const principal = await loadPluginPrincipal('user_3EyO1rFYG4ysjCm0aeJf34NOxv1', 'claude-teste-local', ['erp:read', 'erp:write'])
  const result = await executeTool(principal, tool, args, { integration: 'claude', resource: 'https://cognito-seven.vercel.app/api/claude/mcp', metadataUrl: 'https://cognito-seven.vercel.app/.well-known/oauth-protected-resource/api/claude/mcp', issuer: process.env.CHATGPTPLUGIN_OAUTH_ISSUER ?? '', scope: 'erp:read', clientIds: ['claude-teste-local'], origins: [], toolTimeoutMs: 60000, requestsPerMinute: 60 })
  console.log((result.content[0] as { text: string }).text)
}
main().catch(error => { console.error(error) }).finally(() => process.exit(0))
