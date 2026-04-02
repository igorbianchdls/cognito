import { atom } from 'nanostores'

export type SandboxTab = 'preview' | 'code' | 'dashboard'

export const $sandboxActiveTab = atom<SandboxTab>('preview')

// Caminho do artefato de preview na sandbox (.tsx ou .dsl legado)
// Padrão legado: /vercel/sandbox/dashboard/vendas.dsl
export const $previewDslPath = atom<string>('/vercel/sandbox/dashboard/vendas.dsl')

export type ArtifactNotification = {
  id: string
  source: 'preview' | 'paths' | 'theme' | 'snapshot'
  message: string
  createdAt: number
  read?: boolean
}

export const $artifactNotifications = atom<ArtifactNotification[]>([])

export const sandboxActions = {
  setActiveTab(tab: SandboxTab) { $sandboxActiveTab.set(tab) },
  setPreviewPath(path: string) { $previewDslPath.set(path) },
  pushArtifactNotification(input: { source: ArtifactNotification['source']; message: string }) {
    const msg = String(input.message || '').trim()
    if (!msg) return
    const prev = $artifactNotifications.get()
    const last = prev[0]
    const now = Date.now()
    // Dedup same message bursts caused by repeated rerenders/effects
    if (last && last.source === input.source && last.message === msg && (now - last.createdAt) < 1500) return
    const next: ArtifactNotification = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      source: input.source,
      message: msg,
      createdAt: now,
      read: false,
    }
    $artifactNotifications.set([next, ...prev].slice(0, 100))
  },
  markArtifactNotificationsRead() {
    const prev = $artifactNotifications.get()
    $artifactNotifications.set(prev.map((n) => (n.read ? n : { ...n, read: true })))
  },
  clearArtifactNotifications() {
    $artifactNotifications.set([])
  },
}
