// Provedor de geração de vídeo: a integração real (fal.ai, Replicate, Runway…) implementa esta interface.
import type { FormatoVideo } from '@/products/marketing/shared/videoModels'

export type PedidoProvedor = {
  id: string
  prompt: string
  modelo: string
  formato: FormatoVideo
  duracao: number
  estilo: string
  /** URL assinada da imagem de referência, quando houver. */
  referenciaUrl: string | null
}

export type SituacaoProvedor =
  | { estado: 'gerando' }
  | { estado: 'pronto'; videoUrl: string; mime: string }
  | { estado: 'erro'; mensagem: string }

export type ContextoProvedor = {
  /** Endereço do Otto que recebeu o pedido (o provedor de demonstração serve os clipes daqui). */
  origem: string
}

export interface VideoProvider {
  id: string
  iniciar(pedido: PedidoProvedor, contexto: ContextoProvedor): Promise<{ jobId: string }>
  consultar(job: { jobId: string; iniciadoEm: Date; formato: FormatoVideo }, contexto: ContextoProvedor): Promise<SituacaoProvedor>
  cancelar(job: { jobId: string }): Promise<void>
}
