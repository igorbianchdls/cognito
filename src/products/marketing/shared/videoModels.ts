// Vídeos gerados por IA: catálogo dos modelos e as regras do pedido. Funções puras, usadas pela tela (os controles
// só mostram o que o modelo aceita) e pelo servidor (que recusa o que o modelo não aceita e confere a cota).

export type FormatoVideo = '16:9' | '9:16' | '1:1'
export type SituacaoVideo = 'na_fila' | 'gerando' | 'pronto' | 'erro' | 'cancelado'

export type ModeloVideo = {
  id: string
  nome: string
  /** Quem fornece hoje (troca quando a integração real entrar; o pedido guarda o provedor usado). */
  provedor: string
  formatos: FormatoVideo[]
  duracoes: number[]
  aceitaImagem: boolean
  descricao: string
}

/** Modelos oferecidos na tela. Um modelo novo é uma linha aqui (e o suporte no provedor). */
export const MODELOS_VIDEO: ModeloVideo[] = [
  { id: 'seedance-1-pro', nome: 'Seedance 1 Pro', provedor: 'demo', formatos: ['16:9', '9:16', '1:1'], duracoes: [5, 10], aceitaImagem: true,
    descricao: 'Movimento natural e boa fidelidade ao prompt.' },
  { id: 'runway-gen4', nome: 'Runway Gen-4', provedor: 'demo', formatos: ['16:9', '9:16', '1:1'], duracoes: [5, 10], aceitaImagem: true,
    descricao: 'Cenas cinematográficas, consistente com imagem de referência.' },
  { id: 'kling-2', nome: 'Kling 2', provedor: 'demo', formatos: ['16:9', '9:16', '1:1'], duracoes: [5, 10], aceitaImagem: true,
    descricao: 'Pessoas e produtos com movimento realista.' },
  { id: 'veo-3', nome: 'Veo 3', provedor: 'demo', formatos: ['16:9', '9:16'], duracoes: [8], aceitaImagem: false,
    descricao: 'Vídeo com áudio gerado junto.' },
]

export const ESTILOS_VIDEO = [
  { id: 'nenhum', nome: 'Sem estilo' },
  { id: 'cinematografico', nome: 'Cinematográfico' },
  { id: 'realista', nome: 'Realista' },
  { id: 'animacao', nome: 'Animação 3D' },
  { id: 'anime', nome: 'Anime' },
  { id: 'produto', nome: 'Comercial de produto' },
  { id: 'ugc', nome: 'Gravado no celular (UGC)' },
] as const
export type EstiloVideo = typeof ESTILOS_VIDEO[number]['id']

export const FORMATOS_VIDEO: { id: FormatoVideo; nome: string }[] = [
  { id: '9:16', nome: 'Vertical 9:16' }, { id: '16:9', nome: 'Horizontal 16:9' }, { id: '1:1', nome: 'Quadrado 1:1' },
]

/** Cota padrão por empresa, em minutos por mês, quando a empresa não tem uma própria. */
export const COTA_PADRAO_MINUTOS = 5
export const PROMPT_MAXIMO = 2000

export const modeloVideo = (id: string) => MODELOS_VIDEO.find(modelo => modelo.id === id) ?? null

export type PedidoVideo = { prompt: string; modelo: string; formato: string; duracao: number; estilo: string; temReferencia: boolean }

/** Recusa (mensagem para o usuário) ou null. Mesma regra na tela e no servidor. */
export function validarPedidoVideo(pedido: PedidoVideo): string | null {
  const prompt = pedido.prompt.trim()
  if (prompt.length < 3) return 'Descreva o vídeo que você quer gerar.'
  if (prompt.length > PROMPT_MAXIMO) return `A descrição pode ter até ${PROMPT_MAXIMO} caracteres.`
  const modelo = modeloVideo(pedido.modelo)
  if (!modelo) return 'Escolha um modelo da lista.'
  if (!modelo.formatos.includes(pedido.formato as FormatoVideo)) return `${modelo.nome} não gera no formato ${pedido.formato}.`
  if (!modelo.duracoes.includes(pedido.duracao)) return `${modelo.nome} gera vídeos de ${modelo.duracoes.join(' ou ')} segundos.`
  if (!ESTILOS_VIDEO.some(estilo => estilo.id === pedido.estilo)) return 'Escolha um estilo da lista.'
  if (pedido.temReferencia && !modelo.aceitaImagem) return `${modelo.nome} não usa imagem de referência.`
  return null
}

/** Ajusta formato e duração quando a pessoa troca de modelo (mantém o que o novo modelo aceita). */
export function ajustarAoModelo(modeloId: string, formato: FormatoVideo, duracao: number) {
  const modelo = modeloVideo(modeloId) ?? MODELOS_VIDEO[0]
  return {
    formato: modelo.formatos.includes(formato) ? formato : modelo.formatos[0],
    duracao: modelo.duracoes.includes(duracao) ? duracao : modelo.duracoes[0],
  }
}

/**
 * Cota do mês: conta o que está na fila, gerando ou pronto (o que foi pedido reserva a cota; erro e cancelado devolvem).
 * Recusa quando o novo vídeo passaria do limite.
 */
export function validarCota(dados: { usadoSegundos: number; limiteMinutos: number; pedidoSegundos: number }): string | null {
  const limite = dados.limiteMinutos * 60
  if (dados.usadoSegundos + dados.pedidoSegundos <= limite) return null
  const resta = Math.max(0, limite - dados.usadoSegundos)
  return `A cota de vídeos do mês acabou: restam ${formatarMinutos(resta)} de ${dados.limiteMinutos} min.`
}

export function formatarMinutos(segundos: number) {
  return `${(Math.max(0, segundos) / 60).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} min`
}

/** Situações em que o vídeo ainda pode mudar (a tela continua consultando). */
export const emAndamento = (situacao: SituacaoVideo) => situacao === 'na_fila' || situacao === 'gerando'

/** Transições permitidas da situação. */
export function podeMudarSituacao(de: SituacaoVideo, para: SituacaoVideo) {
  const permitidas: Record<SituacaoVideo, SituacaoVideo[]> = {
    na_fila: ['gerando', 'erro', 'cancelado'],
    gerando: ['pronto', 'erro', 'cancelado'],
    pronto: [], erro: [], cancelado: [],
  }
  return permitidas[de].includes(para)
}
