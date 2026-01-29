import { atom } from 'nanostores'

export type SandboxTab = 'preview' | 'code' | 'console'

export const $sandboxActiveTab = atom<SandboxTab>('preview')

// Caminho do arquivo .jsonr na sandbox a ser usado pelo Preview
// Padrão: /vercel/sandbox/dashboard.jsonr
export const $previewJsonrPath = atom<string>('/vercel/sandbox/dashboard/vendas.jsonr')

export const sandboxActions = {
  setActiveTab(tab: SandboxTab) { $sandboxActiveTab.set(tab) },
  setPreviewPath(path: string) { $previewJsonrPath.set(path) },
}
