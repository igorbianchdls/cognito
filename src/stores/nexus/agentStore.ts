import { atom } from 'nanostores'

// Estado global do agente atual
export const currentAgent = atom<string | null>(null)

// Action para mudar agente
export const setCurrentAgent = (agent: string | null) => {
  currentAgent.set(agent)
}

// Helper para log do estado atual
export const getCurrentAgent = () => {
  const agent = currentAgent.get()
  return agent
}