// As ações que a IA pode pedir (as mesmas da linha do tempo) e como cada uma vira mudança no projeto. Roda no navegador
// (IA do editor: uma mudança só, um Ctrl+Z desfaz tudo) e no servidor (Claude/ChatGPT pelo conector do Otto, seguindo
// os comentários), por isso não depende de nada do navegador: o que precisa saber dos arquivos vem em `Arquivos`.
import { defaultBox, filterPresets } from '../project/presets'
import { addClip, cutHead, cutRange, findClip, limitTo, mapClip, moveClip, projectDuration, removeClips, setSpeed, splitAt, trimRight, updateProps, type DurationOf } from '../project/ops'
import { FPS, visualKinds, type CaptionStyle, type Format, type Keyframe, type Project, type TransitionType } from '../project/types'

/** O que as ações precisam saber dos arquivos: nome, se é música (para "abaixar a música") e a duração. */
export type Arquivos = { nome?: (fileId?: string) => string | undefined; ehMusica?: (fileId?: string) => boolean; durationOf?: DurationOf }
const musicaPadrao = (f?: string) => !!f?.startsWith('a-') && f !== 'a-narr'

/** Clipes por id, ou um grupo: videos, audios, musica, legendas, textos, midias (vídeos e imagens), todos, selecionados. */
export type Alvo = string[] | 'videos' | 'audios' | 'musica' | 'legendas' | 'textos' | 'midias' | 'todos' | 'selecionados'
export type Acao =
  | { tipo: 'cortar_inicio'; segundos: number }
  | { tipo: 'limitar_duracao'; segundos: number }
  | { tipo: 'adicionar_texto'; texto: string; inicio?: number; duracao?: number }
  | { tipo: 'editar_texto'; clipe: string; texto: string }
  | { tipo: 'estilo_legendas'; estilo: CaptionStyle }
  | { tipo: 'volume'; alvo: Alvo; porcentagem: number }
  | { tipo: 'remover'; alvo: Alvo }
  | { tipo: 'velocidade'; alvo: Alvo; vezes: number }
  | { tipo: 'filtro'; alvo: Alvo; filtro: string }
  | { tipo: 'transicao'; alvo: Alvo; transicao: TransitionType | 'nenhuma'; segundos?: number }
  | { tipo: 'abaixar_trilha_na_fala'; ligar: boolean }
  | { tipo: 'mover'; clipe: string; inicio: number }
  | { tipo: 'duracao_clipe'; clipe: string; segundos: number }
  | { tipo: 'dividir'; clipe: string; em: number }
  | { tipo: 'formato'; formato: Format }
  | { tipo: 'cortar_trecho'; de: number; ate: number }
  | { tipo: 'zoom'; clipe: string; escala: number; de?: number; ate?: number }
  | { tipo: 'panoramica'; clipe: string; direcao: 'esquerda' | 'direita' | 'cima' | 'baixo'; de?: number; ate?: number; intensidade?: number }
  | { tipo: 'gerar_legendas' }

const s = (seg: number) => Math.max(0, Math.round(seg * FPS))

function clipes(p: Project, alvo: Alvo, selecionados: string[], ehMusica: (f?: string) => boolean = musicaPadrao) {
  const de = (f: (k: string, fileId?: string) => boolean) => p.tracks.flatMap(t => t.clips.filter(c => f(t.kind, c.props.fileId)).map(c => c.id))
  if (Array.isArray(alvo)) return alvo.filter(id => findClip(p, id))
  switch (alvo) {
    case 'videos': return de(k => k === 'video')
    case 'audios': return de(k => k === 'audio')
    case 'musica': return de((k, f) => k === 'audio' && ehMusica(f))
    case 'legendas': return de(k => k === 'legenda')
    case 'textos': return de(k => k === 'texto')
    case 'midias': return de(k => k === 'video' || k === 'imagem')
    case 'todos': return de(k => visualKinds.includes(k as never))
    case 'selecionados': return selecionados.filter(id => findClip(p, id))
  }
}

/**
 * Movimento de câmera num trecho do clipe (tempos em segundos da linha do tempo; sem eles, o clipe inteiro): os
 * keyframes do começo e do fim do trecho; os de fora do trecho ficam como estavam.
 */
function movimento(p: Project, id: string, de: number | undefined, ate: number | undefined, inicio: Partial<Keyframe>, fim: Partial<Keyframe>) {
  const c = findClip(p, id)?.clip
  if (!c) return p
  const a = Math.max(0, Math.min(c.duration, de != null ? s(de) - c.start : 0))
  const b = Math.max(a + 1, Math.min(c.duration, ate != null ? s(ate) - c.start : c.duration))
  const neutro: Keyframe = { frame: 0, dx: 0, dy: 0, scale: 1, rotation: 0, opacity: 1 }
  const fora = (c.props.keyframes ?? []).filter(k => k.frame < a || k.frame > b)
  return updateProps(p, id, { keyframes: [...fora, { ...neutro, ...inicio, frame: a }, { ...neutro, ...fim, frame: b }].sort((x, y) => x.frame - y.frame) })
}

/** Aplica as ações em ordem; devolve o projeto novo e se a IA pediu legendas automáticas (feitas depois, à parte). */
export function aplicarAcoes(p0: Project, acoes: Acao[], agulha: number, selecionados: string[], arquivos: Arquivos = {}) {
  let p = p0, legendas = false
  const alvos = (alvo: Alvo) => clipes(p, alvo, selecionados, arquivos.ehMusica)
  for (const a of acoes) {
    try {
      switch (a.tipo) {
        case 'cortar_inicio': p = cutHead(p, s(a.segundos)); break
        case 'limitar_duracao': if (s(a.segundos) < projectDuration(p)) p = limitTo(p, s(a.segundos)); break
        case 'adicionar_texto': p = addClip(p, 'texto', { start: a.inicio != null ? s(a.inicio) : agulha, duration: s(a.duracao ?? 3), trimStart: 0, props: { text: a.texto, fontSize: 76, weight: 800, color: '#ffffff', align: 'center', anim: 'pop', box: defaultBox.texto } }).project; break
        case 'editar_texto': p = updateProps(p, a.clipe, { text: a.texto }); break
        case 'estilo_legendas': p = alvos('legendas').reduce((acc, id) => updateProps(acc, id, { captionStyle: a.estilo }), p); break
        case 'volume': p = alvos(a.alvo).reduce((acc, id) => mapClip(acc, id, c => ({ ...c, props: { ...c.props, volume: Math.max(0, Math.min(1, a.porcentagem / 100)) } })), p); break
        case 'remover': p = removeClips(p, alvos(a.alvo)); break
        case 'velocidade': if ([0.5, 1, 1.5, 2, 3].includes(a.vezes)) p = alvos(a.alvo).reduce((acc, id) => setSpeed(acc, id, a.vezes, arquivos.durationOf), p); break
        case 'filtro': { const f = filterPresets.find(x => x.id === a.filtro); if (f) p = alvos(a.alvo).reduce((acc, id) => updateProps(acc, id, { filter: f.filter }), p); break }
        case 'transicao': { const t = a.transicao === 'nenhuma' ? undefined : { type: a.transicao, frames: Math.max(3, s(a.segundos ?? 0.4)) }; p = alvos(a.alvo).reduce((acc, id) => updateProps(acc, id, { transIn: t, transOut: t }), p); break }
        case 'abaixar_trilha_na_fala': p = { ...p, ducking: { on: a.ligar, level: 0.3 } }; break
        case 'mover': p = moveClip(p, a.clipe, s(a.inicio)); break
        case 'duracao_clipe': { const c = findClip(p, a.clipe)?.clip; if (c) p = trimRight(p, a.clipe, c.start + Math.max(5, s(a.segundos)), arquivos.durationOf); break }
        case 'dividir': p = splitAt(p, a.clipe, s(a.em))?.project ?? p; break
        case 'formato': if (['9:16', '1:1', '16:9'].includes(a.formato)) p = { ...p, format: a.formato }; break
        case 'cortar_trecho': if (a.ate > a.de) p = cutRange(p, s(a.de), s(a.ate)); break
        case 'zoom': p = movimento(p, a.clipe, a.de, a.ate, { scale: 1 }, { scale: Math.max(0.5, Math.min(4, a.escala)) }); break
        case 'panoramica': {
          const n = Math.max(2, Math.min(30, a.intensidade ?? 8))
          const eixo = a.direcao === 'esquerda' || a.direcao === 'direita' ? 'dx' : 'dy'
          const sinal = a.direcao === 'esquerda' || a.direcao === 'cima' ? -1 : 1
          // Um pouco de zoom para a imagem não deixar borda ao andar.
          p = movimento(p, a.clipe, a.de, a.ate, { scale: 1 + n / 50, [eixo]: -sinal * n / 2 }, { scale: 1 + n / 50, [eixo]: sinal * n / 2 })
          break
        }
        case 'gerar_legendas': legendas = true; break
      }
    } catch { /* uma ação que não cabe (clipe sumiu, valor fora) não derruba as outras */ }
  }
  return { project: p, legendas }
}

/** O projeto resumido para a IA: faixas, clipes (com id, nome ou texto, tempos em segundos) e o que está selecionado. */
export function resumoParaIa(p: Project, agulha: number, selecionados: string[], nome: Arquivos['nome'] = () => undefined) {
  const seg = (f: number) => Math.round(f / FPS * 100) / 100
  return {
    formato: p.format, duracao: seg(projectDuration(p)), agulha: seg(agulha), selecionados,
    trilha_abaixa_na_fala: !!p.ducking?.on,
    faixas: p.tracks.map(t => ({ tipo: t.kind, silenciada: !!t.muted, clipes: t.clips.map(c => ({
      id: c.id, nome: t.kind === 'texto' || t.kind === 'legenda' ? c.props.text : nome(c.props.fileId) ?? c.props.shape,
      inicio: seg(c.start), duracao: seg(c.duration), ...(c.speed && c.speed !== 1 ? { velocidade: c.speed } : {}),
      ...(c.props.volume != null && t.kind !== 'texto' ? { volume: Math.round(c.props.volume * 100) } : {}),
      ...(c.props.filter?.preset ? { filtro: c.props.filter.preset } : {}), ...(c.props.captionStyle ? { estilo: c.props.captionStyle } : {}),
    })) })),
  }
}
