import { DASHBOARD_AUTHORING_PROMPT } from '@/products/mcp/prompts/dashboardAuthoringPrompt'
import { ARTIFACT_MCP_TOOL_DEFINITIONS } from '@/products/mcp/tools/artifactSchemas'
import { executeMcpArtifactTool } from '@/products/mcp/tools/artifactTools'
import { MCP_ARTIFACT_TOOL_NAME_SET } from '@/products/mcp/shared/toolNames'

export const COGNITO_MCP_SERVER_INFO = {
  name: 'cognito',
  version: '0.1.0',
} as const

export const COGNITO_MCP_PROTOCOL_VERSION = '2025-11-25'

export type CognitoMcpServerContext = {
  tenantId?: number
}

export function getCognitoMcpInitializeResult(requestedProtocolVersion?: string) {
  return {
    protocolVersion: requestedProtocolVersion || COGNITO_MCP_PROTOCOL_VERSION,
    capabilities: {
      tools: {
        listChanged: false,
      },
    },
    serverInfo: COGNITO_MCP_SERVER_INFO,
    instructions: DASHBOARD_AUTHORING_PROMPT,
  }
}

export function listCognitoMcpTools() {
  return {
    tools: ARTIFACT_MCP_TOOL_DEFINITIONS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }
}

export async function callCognitoMcpTool(
  name: string,
  args: unknown,
  context: CognitoMcpServerContext = {},
) {
  if (!MCP_ARTIFACT_TOOL_NAME_SET.has(name)) {
    return {
      content: [
        {
          type: 'text',
          text: `Tool MCP desconhecida: ${name}`,
        },
      ],
      structuredContent: {
        ok: false,
        error: `Tool MCP desconhecida: ${name}`,
      },
      isError: true,
    }
  }

  const result = await executeMcpArtifactTool(name, args, context)
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result.result, null, 2),
      },
    ],
    structuredContent: result.result,
    isError: false,
  }
}
