import type { Sandbox } from '@vercel/sandbox'
import { COMPOSIO_MCP_SCRIPT } from '@/products/chat/backend/agents/agentsdk/tools/mcp/composioScript'
import { ERP_MCP_SCRIPT } from '@/products/chat/backend/agents/agentsdk/tools/mcp/erpScript'

export async function seedMcpServersInSandbox(sandbox: Sandbox) {
  await sandbox.runCommand({
    cmd: 'node',
    args: ['-e', "require('fs').mkdirSync('/vercel/sandbox/.mcp', { recursive: true });"],
  })
  await sandbox.writeFiles([
    { path: '/vercel/sandbox/.mcp/composio.mjs', content: Buffer.from(COMPOSIO_MCP_SCRIPT) },
    { path: '/vercel/sandbox/.mcp/ERP.mjs', content: Buffer.from(ERP_MCP_SCRIPT) },
  ])
}

