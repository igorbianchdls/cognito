import { AGENTSDK_ERP_MCP_HANDLERS_SCRIPT } from '@/products/chat/agentsdk/tools/handlers/erpBridgeScript'
import { AGENTSDK_ERP_MCP_SERVER_SCRIPT } from '@/products/chat/agentsdk/tools/mcp/erpServerScript'

export const ERP_MCP_SCRIPT = `import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

${AGENTSDK_ERP_MCP_HANDLERS_SCRIPT}

${AGENTSDK_ERP_MCP_SERVER_SCRIPT}
`
