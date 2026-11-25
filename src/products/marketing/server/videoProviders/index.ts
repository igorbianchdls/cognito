// Escolha do provedor. Hoje só o de demonstração; a integração real entra aqui (VIDEO_PROVIDER no ambiente).
import { demoProvider } from './demo'
import type { VideoProvider } from './types'

const provedores: Record<string, VideoProvider> = { demo: demoProvider }

export function videoProvider(id?: string | null): VideoProvider {
  const escolhido = id || process.env.VIDEO_PROVIDER || 'demo'
  const provedor = provedores[escolhido]
  if (!provedor) throw new Error(`Provedor de vídeo desconhecido: ${escolhido}`)
  return provedor
}
