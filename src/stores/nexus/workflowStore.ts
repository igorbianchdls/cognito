import { atom } from 'nanostores'

// Estado global do workflow atual
export const currentWorkflow = atom<string | null>(null)

// Action para mudar workflow
export const setCurrentWorkflow = (workflow: string | null) => {
  currentWorkflow.set(workflow)
}

// Helper para log do estado atual
export const getCurrentWorkflow = () => {
  const workflow = currentWorkflow.get()
  return workflow
}
