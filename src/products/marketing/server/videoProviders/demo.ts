// Provedor de demonstração: "gera" em alguns segundos e entrega um clipe de exemplo do formato pedido
// (public/marketing/videos-demo). Serve para a tela funcionar inteira antes da integração real.
import { randomUUID } from 'node:crypto'
import type { VideoProvider } from './types'

export const DEMO_SEGUNDOS_PARA_FICAR_PRONTO = 8
const arquivo = { '9:16': '9x16', '16:9': '16x9', '1:1': '1x1' } as const

export const demoProvider: VideoProvider = {
  id: 'demo',
  async iniciar() {
    return { jobId: `demo-${randomUUID()}` }
  },
  async consultar(job, contexto) {
    const passou = (Date.now() - job.iniciadoEm.getTime()) / 1000
    if (passou < DEMO_SEGUNDOS_PARA_FICAR_PRONTO) return { estado: 'gerando' }
    return { estado: 'pronto', videoUrl: `${contexto.origem}/marketing/videos-demo/${arquivo[job.formato]}.mp4`, mime: 'video/mp4' }
  },
  async cancelar() {},
}
