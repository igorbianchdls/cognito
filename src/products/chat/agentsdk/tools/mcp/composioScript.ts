export const COMPOSIO_MCP_SCRIPT = `import { Composio } from '@composio/core';
import { ClaudeAgentSDKProvider } from '@composio/claude-agent-sdk';
import { createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
let server = null;
try {
  const apiKey = process.env.COMPOSIO_API_KEY || '';
  const provider = new ClaudeAgentSDKProvider();
  const composio = new Composio({ apiKey, provider });
  const externalUserId = process.env.COMPOSIO_USER_ID || process.env.AGENT_CHAT_ID || ('composio-' + Date.now());
  const session = await composio.create(String(externalUserId), {
    toolkits: ['gmail'],
    tools: { gmail: ['GMAIL_FETCH_EMAILS'] },
    tags: ['readOnlyHint']
  });
  const tools = await session.tools();
  server = createSdkMcpServer({ name: 'composio', version: '1.0.0', tools });
} catch (e) {
  server = createSdkMcpServer({ name: 'composio', version: '1.0.0', tools: [] });
}
export const composioServer = server;
export default composioServer;
`
