export async function getAgentMailClient() {
  const apiKey = process.env.AGENTMAIL_API_KEY
  if (!apiKey) {
    const { getLocalEmailClient } = await import('@/products/email/backend/integrations/localEmailClient')
    return getLocalEmailClient()
  }

  let AgentMailClient: any
  try {
    const mod: any = await import('agentmail')
    AgentMailClient = mod.AgentMailClient || mod.default || mod
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    AgentMailClient = require('agentmail').AgentMailClient
  }

  return new AgentMailClient({ apiKey })
}
