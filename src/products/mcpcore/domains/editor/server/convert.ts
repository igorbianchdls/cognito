// The project as the assistant sees and edits it: seconds instead of frames and Portuguese names instead of the
// editor's internal props. Both directions live here so the tools read what they write.
import { z } from 'zod'
import { filterPresets, neutralFilter } from '@/products/editor/frontend/editor/project/presets'
import { clipEnd, projectDuration } from '@/products/editor/frontend/editor/project/ops'
import { FPS, type ClipProps, type Clip, type Project, type Track, type TrackKind, type TransitionType } from '@/products/editor/frontend/editor/project/types'

export const frames = (seconds: number) => Math.round(seconds * FPS)
export const seconds = (f: number) => Math.round(f / FPS * 100) / 100

const color = z.string().trim().regex(/^(#[0-9a-f]{3}|#[0-9a-f]{6}|#[0-9a-f]{8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/i, 'Use #rrggbb ou rgba(r,g,b,a).')
const percent = (what: string) => z.number().min(-50).max(150).describe(what)
// A function, not a shared schema: a schema used twice is published as a reference without its descriptions.
const transition = () => z.object({
  tipo: z.enum(['fade', 'deslizar', 'zoom', 'desfoque', 'nenhuma']).describe('Efeito; nenhuma remove a transição.'),
  duracao_s: z.number().min(0.1).max(3).default(0.3).describe('Duração da transição em segundos.'),
}).strict()

export const fonts = ['geist', 'bebas', 'serif', 'caveat', 'mono'] as const
export const animations = ['surgir', 'pop', 'digitar', 'pulsar', 'balancar', 'nenhuma'] as const
export const captionStyles = ['amarela', 'branca', 'caixa'] as const
const weights = { normal: 400, semi: 600, negrito: 800 } as const
const aligns = { esquerda: 'left', centro: 'center', direita: 'right' } as const

/** Everything a clip can look or sound like. Each field only applies to the kinds named in its description. */
export const styleSchema = z.object({
  texto: z.string().max(1000).describe('Texto e legenda: o conteúdo. Use \\n para quebrar linha. Adesivo: um emoji.'),
  fonte: z.enum(fonts).describe('Texto: geist (moderna), bebas (manchete condensada), serif, caveat (manuscrita) ou mono.'),
  tamanho_fonte: z.number().min(8).max(400).describe('Texto: tamanho em pixels numa tela de 1080 de largura (título ~76, subtítulo ~48).'),
  cor: color.describe('Texto: cor da letra.'),
  fundo: z.union([color, z.literal('nenhum')]).describe('Texto: cor da caixa atrás da letra; forma: cor da forma. nenhum remove.'),
  peso: z.enum(['normal', 'semi', 'negrito']).describe('Texto: espessura da letra.'),
  alinhamento: z.enum(['esquerda', 'centro', 'direita']).describe('Texto: alinhamento.'),
  animacao: z.enum(animations).describe('Texto: como o texto entra e se mexe.'),
  estilo_legenda: z.enum(captionStyles).describe('Legenda: amarela, branca ou caixa (fundo escuro).'),
  contorno: z.union([z.object({ cor: color.describe('Cor do contorno.'), largura: z.number().min(0).max(30).describe('Largura em pixels.') }).strict(), z.null()]).describe('Texto: contorno da letra; null remove.'),
  sombra: z.number().min(0).max(1).describe('Texto: intensidade da sombra, de 0 a 1.'),
  forma: z.enum(['retangulo', 'circulo', 'progresso']).describe('Forma: retângulo, círculo ou barra de progresso do vídeo.'),
  arredondamento: z.number().min(0).max(500).describe('Forma: raio dos cantos em pixels.'),
  posicao: z.object({
    x: percent('Distância da esquerda, em % da largura da tela.'), y: percent('Distância do topo, em % da altura da tela.'),
    largura: z.number().min(1).max(200).describe('Largura em % da tela.'), altura: z.number().min(1).max(200).describe('Altura em % da tela.'),
  }).strict().describe('Posição e tamanho na tela, em %. Tela cheia: x 0, y 0, largura 100, altura 100.'),
  opacidade: z.number().min(0).max(1).describe('Visual: 0 invisível, 1 opaco.'),
  enquadramento: z.enum(['preencher', 'ajustar', 'desfoque']).describe('Vídeo e imagem: preencher corta as sobras; ajustar mostra tudo; desfoque mostra tudo sobre uma cópia desfocada.'),
  recorte: z.object({ topo: z.number().min(0).max(45).describe('% cortado em cima.'), direita: z.number().min(0).max(45).describe('% cortado à direita.'), base: z.number().min(0).max(45).describe('% cortado embaixo.'), esquerda: z.number().min(0).max(45).describe('% cortado à esquerda.') }).strict().describe('Vídeo e imagem: recorte das bordas.'),
  espelhar_horizontal: z.boolean().describe('Vídeo e imagem: espelha na horizontal.'),
  espelhar_vertical: z.boolean().describe('Vídeo e imagem: espelha na vertical.'),
  filtro: z.object({
    predefinido: z.enum(['nenhum', 'pb', 'vivido', 'quente', 'vintage', 'escuro']).optional().describe('Filtro pronto; nenhum remove o filtro. Os ajustes abaixo partem dele.'),
    brilho: z.number().min(0).max(3).optional().describe('1 = original.'), contraste: z.number().min(0).max(3).optional().describe('1 = original.'),
    saturacao: z.number().min(0).max(3).optional().describe('1 = original; 0 sem cor.'), preto_e_branco: z.number().min(0).max(1).optional().describe('0 a 1.'), sepia: z.number().min(0).max(1).optional().describe('0 a 1.'),
  }).strict().describe('Vídeo e imagem: cores.'),
  transicao_entrada: transition().describe('Visual: transição na entrada do clipe.'),
  transicao_saida: transition().describe('Visual: transição na saída do clipe.'),
  volume: z.number().min(0).max(1).describe('Vídeo e áudio: volume de 0 a 1.'),
  fade_entrada_s: z.number().min(0).max(10).describe('Vídeo e áudio: segundos de som subindo no começo.'),
  fade_saida_s: z.number().min(0).max(10).describe('Vídeo e áudio: segundos de som descendo no fim.'),
  papel_audio: z.enum(['voz', 'musica']).describe('Áudio: voz ou música. A música abaixa durante a voz quando essa opção está ligada no projeto.'),
}).partial().strict()
export type Style = z.infer<typeof styleSchema>

const transitionProps = (t: z.infer<ReturnType<typeof transition>>) => t.tipo === 'nenhuma' ? undefined : { type: t.tipo as TransitionType, frames: Math.max(1, frames(t.duracao_s)) }

/** The props a style changes. Fields that don't apply to the clip's kind are ignored. */
export function styleToProps(style: Style, kind: TrackKind, current: ClipProps): Partial<ClipProps> {
  const visual = kind !== 'audio', textual = kind === 'texto' || kind === 'legenda', media = kind === 'video' || kind === 'imagem', sound = kind === 'video' || kind === 'audio'
  const out: Partial<ClipProps> = {}
  if (textual) {
    if (style.texto !== undefined) out.text = style.texto
    if (style.fonte) out.font = style.fonte
    if (style.tamanho_fonte !== undefined) out.fontSize = style.tamanho_fonte
    if (style.cor) out.color = style.cor
    if (style.peso) out.weight = weights[style.peso]
    if (style.alinhamento) out.align = aligns[style.alinhamento]
    if (style.animacao) out.anim = style.animacao
    if (style.contorno !== undefined) out.stroke = style.contorno ? { color: style.contorno.cor, width: style.contorno.largura } : undefined
    if (style.sombra !== undefined) out.shadow = style.sombra
  }
  if (kind === 'legenda' && style.estilo_legenda) out.captionStyle = style.estilo_legenda
  if ((textual || kind === 'forma') && style.fundo) out.bg = style.fundo === 'nenhum' ? undefined : style.fundo
  if (kind === 'forma') {
    if (style.forma) out.shape = style.forma
    if (style.arredondamento !== undefined) out.radius = style.arredondamento
  }
  if (visual) {
    if (style.posicao) out.box = { x: style.posicao.x, y: style.posicao.y, w: style.posicao.largura, h: style.posicao.altura }
    if (style.opacidade !== undefined) out.opacity = style.opacidade
    if (style.transicao_entrada) out.transIn = transitionProps(style.transicao_entrada)
    if (style.transicao_saida) out.transOut = transitionProps(style.transicao_saida)
  }
  if (media) {
    if (style.enquadramento) out.fit = style.enquadramento
    if (style.recorte) out.crop = { t: style.recorte.topo, r: style.recorte.direita, b: style.recorte.base, l: style.recorte.esquerda }
    if (style.espelhar_horizontal !== undefined) out.flipX = style.espelhar_horizontal
    if (style.espelhar_vertical !== undefined) out.flipY = style.espelhar_vertical
    if (style.filtro) {
      const f = style.filtro
      const preset = f.predefinido ? filterPresets.find(p => p.id === f.predefinido)?.filter : undefined
      const base = f.predefinido ? preset ?? neutralFilter : current.filter ?? neutralFilter
      const next = { ...base, ...(f.brilho !== undefined ? { brightness: f.brilho } : {}), ...(f.contraste !== undefined ? { contrast: f.contraste } : {}),
        ...(f.saturacao !== undefined ? { saturation: f.saturacao } : {}), ...(f.preto_e_branco !== undefined ? { grayscale: f.preto_e_branco } : {}), ...(f.sepia !== undefined ? { sepia: f.sepia } : {}) }
      const neutral = next.brightness === 1 && next.contrast === 1 && next.saturation === 1 && !next.grayscale && !next.sepia
      out.filter = neutral ? undefined : next
    }
  }
  if (sound) {
    if (style.volume !== undefined) out.volume = style.volume
    if (style.fade_entrada_s !== undefined) out.fadeIn = frames(style.fade_entrada_s)
    if (style.fade_saida_s !== undefined) out.fadeOut = frames(style.fade_saida_s)
  }
  if (kind === 'audio' && style.papel_audio) out.role = style.papel_audio
  return out
}

const drop = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '')) as Partial<T>
const round = (n: number) => Math.round(n * 100) / 100

/** The clip's look and sound in the same names the tools accept. */
export function propsToStyle(p: ClipProps): Record<string, unknown> {
  const weight = Object.entries(weights).find(([, v]) => v === p.weight)?.[0]
  const align = Object.entries(aligns).find(([, v]) => v === p.align)?.[0]
  const trans = (t?: ClipProps['transIn']) => t ? { tipo: t.type, duracao_s: seconds(t.frames) } : undefined
  return drop({
    texto: p.text, fonte: p.font, tamanho_fonte: p.fontSize, cor: p.color, fundo: p.bg, peso: weight, alinhamento: align, animacao: p.anim,
    estilo_legenda: p.captionStyle, contorno: p.stroke ? { cor: p.stroke.color, largura: p.stroke.width } : undefined, sombra: p.shadow,
    forma: p.shape, arredondamento: p.radius,
    posicao: p.box ? { x: round(p.box.x), y: round(p.box.y), largura: round(p.box.w), altura: round(p.box.h) } : undefined,
    opacidade: p.opacity, enquadramento: p.fit,
    recorte: p.crop ? { topo: p.crop.t, direita: p.crop.r, base: p.crop.b, esquerda: p.crop.l } : undefined,
    espelhar_horizontal: p.flipX || undefined, espelhar_vertical: p.flipY || undefined,
    filtro: p.filter ? drop({ predefinido: p.filter.preset, brilho: p.filter.brightness, contraste: p.filter.contrast, saturacao: p.filter.saturation, preto_e_branco: p.filter.grayscale, sepia: p.filter.sepia }) : undefined,
    transicao_entrada: trans(p.transIn), transicao_saida: trans(p.transOut),
    volume: p.volume, fade_entrada_s: p.fadeIn ? seconds(p.fadeIn) : undefined, fade_saida_s: p.fadeOut ? seconds(p.fadeOut) : undefined,
    papel_audio: p.role,
    quadros_chave: p.keyframes?.length ? p.keyframes.map(k => drop({ em_s: seconds(k.frame), x: k.dx, y: k.dy, escala: k.scale, rotacao: k.rotation, opacidade: k.opacity, cor: k.color, tamanho_fonte: k.fontSize })) : undefined,
  })
}

export type FileInfo = { id: string; name: string; kind: string; duration: number | null; width: number; height: number }

function clipView(c: Clip, t: Track, files: Map<string, FileInfo>) {
  const { fileId, ...props } = c.props
  const file = fileId ? files.get(fileId) : undefined
  const isMedia = t.kind === 'video' || t.kind === 'audio'
  return drop({
    id: c.id, inicio_s: seconds(c.start), fim_s: seconds(clipEnd(c)), duracao_s: seconds(c.duration),
    arquivo: fileId ? (file ? { id: file.id, nome: file.name, duracao_s: file.duration ?? undefined } : { id: fileId, nome: 'Arquivo de exemplo (não está no Drive)' }) : undefined,
    trecho_do_arquivo_s: isMedia && c.trimStart ? seconds(c.trimStart) : undefined,
    velocidade: c.speed && c.speed !== 1 ? c.speed : undefined, grupo: c.group, ...propsToStyle(props),
  })
}

/** The whole project for the assistant. Track position 0 is drawn on top. */
export function projectView(p: Project, files: Map<string, FileInfo>, link: string, updatedAt?: string) {
  return drop({
    id: p.id, nome: p.name, formato: p.format, fundo: p.background, duracao_s: seconds(projectDuration(p)), link, atualizado_em: updatedAt,
    abaixar_musica_na_fala: p.ducking?.on ? { nivel: p.ducking.level } : undefined,
    marca_dagua: p.watermark ? drop({ texto: p.watermark.text, arquivo_id: p.watermark.fileId, posicao: p.watermark.position, opacidade: p.watermark.opacity }) : undefined,
    marcadores_s: p.markers?.length ? p.markers.map(seconds) : undefined,
    trilhas: p.tracks.map((t, i) => drop({ id: t.id, tipo: t.kind, posicao: i, silenciada: t.muted || undefined, oculta: t.hidden || undefined, travada: t.locked || undefined, clipes: t.clips.map(c => clipView(c, t, files)) })),
  })
}

export const fileIds = (p: Project) => [...new Set([...p.tracks.flatMap(t => t.clips.map(c => c.props.fileId)), p.watermark?.fileId].filter((id): id is string => !!id))]
