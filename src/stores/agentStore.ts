import { atom } from 'nanostores'

// Estado global do agente atual
export const currentAgent = atom<string>('nexus')

// Action para mudar agente
export const setCurrentAgent = (agent: string) => {
  console.log('🏪 [agentStore] Mudando agente para:', agent)
  currentAgent.set(agent)
}

// Helper para log do estado atual
export const getCurrentAgent = () => {
  const agent = currentAgent.get()
  console.log('🏪 [agentStore] Agente atual:', agent)
  return agent
}