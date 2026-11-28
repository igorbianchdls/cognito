// As ações que a IA do editor pode pedir (as mesmas da linha do tempo) e como cada uma vira mudança no projeto.
// O servidor só decide QUAIS ações; quem aplica é o navegador, numa mudança só (um Ctrl+Z desfaz tudo).
import { defaultBox, filterPresets } from '../project/presets'
import { addClip, cutHead, findClip, limitTo, mapClip, moveClip, projectDuration, removeClips, setSpeed, splitAt, trimRight, updateProps } from '../project/ops'
import { media } from '../project/data'
import { FPS, visualKinds, type CaptionStyle, type Format, type Project, type TransitionType } from '../project/types'

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
  | { tipo: 'gerar_legendas' }

const s = (seg: number) => Math.max(0, Math.round(seg * FPS))

function clipes(p: Project, alvo: Alvo, selecionados: string[]) {
  const de = (f: (k: string, fileId?: string) => boolean) => p.tracks.flatMap(t => t.clips.filter(c => f(t.kind, c.props.fileId)).map(c => c.id))
  if (Array.isArray(alvo)) return alvo.filter(id => findClip(p, id))
  switch (alvo) {
    case 'videos': return de(k => k === 'video')
    case 'audios': return de(k => k === 'audio')
    case 'musica': return de((k, f) => k === 'audio' && (media(f)?.role === 'musica' || !!f?.startsWith('a-')) && f !== 'a-narr')
    case 'legendas': return de(k => k === 'legenda')
    case 'textos': return de(k => k === 'texto')
    case 'midias': return de(k => k === 'video' || k === 'imagem')
    case 'todos': return de(k => visualKinds.includes(k as never))
    case 'selecionados': return selecionados.filter(id => findClip(p, id))
  }
}

/** Aplica as ações em ordem; devolve o projeto novo e se a IA pediu legendas automáticas (feitas depois, à parte). */
export function aplicarAcoes(p0: Project, acoes: Acao[], agulha: number, selecionados: string[]) {
  let p = p0, legendas = false
  for (const a of acoes) {
    try {
      switch (a.tipo) {
        case 'cortar_inicio': p = cutHead(p, s(a.segundos)); break
        case 'limitar_duracao': if (s(a.segundos) < projectDuration(p)) p = limitTo(p, s(a.segundos)); break
        case 'adicionar_texto': p = addClip(p, 'texto', { start: a.inicio != null ? s(a.inicio) : agulha, duration: s(a.duracao ?? 3), trimStart: 0, props: { text: a.texto, fontSize: 76, weight: 800, color: '#ffffff', align: 'center', anim: 'pop', box: defaultBox.texto } }).project; break
        case 'editar_texto': p = updateProps(p, a.clipe, { text: a.texto }); break
        case 'estilo_legendas': p = clipes(p, 'legendas', selecionados).reduce((acc, id) => updateProps(acc, id, { captionStyle: a.estilo }), p); break
        case 'volume': p = clipes(p, a.alvo, selecionados).reduce((acc, id) => mapClip(acc, id, c => ({ ...c, props: { ...c.props, volume: Math.max(0, Math.min(1, a.porcentagem / 100)) } })), p); break
        case 'remover': p = removeClips(p, clipes(p, a.alvo, selecionados)); break
        case 'velocidade': if ([0.5, 1, 1.5, 2, 3].includes(a.vezes)) p = clipes(p, a.alvo, selecionados).reduce((acc, id) => setSpeed(acc, id, a.vezes), p); break
        case 'filtro': { const f = filterPresets.find(x => x.id === a.filtro); if (f) p = clipes(p, a.alvo, selecionados).reduce((acc, id) => updateProps(acc, id, { filter: f.filter }), p); break }
        case 'transicao': { const t = a.transicao === 'nenhuma' ? undefined : { type: a.transicao, frames: Math.max(3, s(a.segundos ?? 0.4)) }; p = clipes(p, a.alvo, selecionados).reduce((acc, id) => updateProps(acc, id, { transIn: t, transOut: t }), p); break }
        case 'abaixar_trilha_na_fala': p = { ...p, ducking: { on: a.ligar, level: 0.3 } }; break
        case 'mover': p = moveClip(p, a.clipe, s(a.inicio)); break
        case 'duracao_clipe': { const c = findClip(p, a.clipe)?.clip; if (c) p = trimRight(p, a.clipe, c.start + Math.max(5, s(a.segundos))); break }
        case 'dividir': p = splitAt(p, a.clipe, s(a.em))?.project ?? p; break
        case 'formato': if (['9:16', '1:1', '16:9'].includes(a.formato)) p = { ...p, format: a.formato }; break
        case 'gerar_legendas': legendas = true; break
      }
    } catch { /* uma ação que não cabe (clipe sumiu, valor fora) não derruba as outras */ }
  }
  return { project: p, legendas }
}

/** O projeto resumido para a IA: faixas, clipes (com id, nome ou texto, tempos em segundos) e o que está selecionado. */
export function resumoParaIa(p: Project, agulha: number, selecionados: string[]) {
  const seg = (f: number) => Math.round(f / FPS * 100) / 100
  return {
    formato: p.format, duracao: seg(projectDuration(p)), agulha: seg(agulha), selecionados,
    trilha_abaixa_na_fala: !!p.ducking?.on,
    faixas: p.tracks.map(t => ({ tipo: t.kind, silenciada: !!t.muted, clipes: t.clips.map(c => ({
      id: c.id, nome: t.kind === 'texto' || t.kind === 'legenda' ? c.props.text : media(c.props.fileId)?.name ?? c.props.shape,
      inicio: seg(c.start), duracao: seg(c.duration), ...(c.speed && c.speed !== 1 ? { velocidade: c.speed } : {}),
      ...(c.props.volume != null && t.kind !== 'texto' ? { volume: Math.round(c.props.volume * 100) } : {}),
      ...(c.props.filter?.preset ? { filtro: c.props.filter.preset } : {}), ...(c.props.captionStyle ? { estilo: c.props.captionStyle } : {}),
    })) })),
  }
}
