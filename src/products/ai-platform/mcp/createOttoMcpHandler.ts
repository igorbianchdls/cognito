import { createMcpHandler, withMcpAuth } from 'mcp-handler'

import { executeAiTool } from '@/products/ai-platform/application/executeAiTool'
import { resolveMcpPrincipal, verifyOttoMcpToken } from '@/products/ai-platform/auth/mcpAuth'
import { listAiTools } from '@/products/ai-platform/tools/toolRegistry'

const baseHandler = createMcpHandler((server) => {
  for (const tool of listAiTools()) {
    server.registerTool(tool.name, {
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations,
    }, async (args, context) => {
      try {
        const principal = await resolveMcpPrincipal(context.http?.authInfo)
        if (!principal) throw new Error('Usuario ou empresa sem acesso ao ERP.')
        const result = await executeAiTool({ principal, source: 'mcp', toolName: tool.name, args })
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result.data) }],
          structuredContent: result as unknown as Record<string, unknown>,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao executar a ferramenta.'
        return { isError: true, content: [{ type: 'text' as const, text: message }] }
      }
    })
  }
}, {
  serverInfo: { name: 'otto-erp', version: '1.0.0' },
  instructions: 'Ferramentas do ERP Otto. Consulte antes de alterar e use prepare/commit nas operacoes criticas.',
})

export const ottoMcpHandler = withMcpAuth(baseHandler, verifyOttoMcpToken, {
  required: true,
  requiredScopes: ['openid', 'user:org:read'],
  resourceMetadataPath: '/.well-known/oauth-protected-resource/api/ai/mcp',
})
