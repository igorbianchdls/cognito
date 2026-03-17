import { AGENTSDK_ERP_MCP_TOOLS_SCRIPT } from '@/products/chat/backend/agents/agentsdk/tools/schema/erpToolsScript'

export const AGENTSDK_ERP_MCP_SERVER_SCRIPT = `export const mcpERPServer = createSdkMcpServer({
  name: 'ERP',
  version: '1.0.0',
  tools: [
    ${AGENTSDK_ERP_MCP_TOOLS_SCRIPT}
  ]
});
export default mcpERPServer;`
