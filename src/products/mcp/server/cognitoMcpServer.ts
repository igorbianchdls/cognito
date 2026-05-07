import { DASHBOARD_AUTHORING_PROMPT } from '@/products/mcp/prompts/dashboardAuthoringPrompt'
import { DASHBOARD_MCP_TOOL_DEFINITIONS } from '@/products/mcp/tools/dashboardSchemas'
import { executeMcpDashboardTool } from '@/products/mcp/tools/dashboardTools'

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
    tools: DASHBOARD_MCP_TOOL_DEFINITIONS.map((tool) => ({
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
  const result = await executeMcpDashboardTool(name, args, context)
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

