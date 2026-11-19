// Demonstration of the AI editing the project. Phase 2 swaps this parser for a model that calls the same operations.
import { defaultBox, filterPresets } from '../project/data'
import { addClip, cutHead, limitTo, mapClip, projectDuration, removeClip, setSpeed, updateProps } from '../project/ops'
import { FPS, visualKinds, type CaptionStyle, type Project, type TransitionType } from '../project/types'

export type AiResult = { project?: Project; reply: string }

export const aiExamples = [
  'Corta os 2 primeiros segundos',
  'Adiciona o título "Seu ERP no ChatGPT"',
  'Deixa a legenda branca',
  'Deixa com 15 segundos',
  'Abaixa a trilha para 10%',
  'Tira a música',
  'Acelera o vídeo para 2x',
  'Deixa o vídeo preto e branco',
  'Coloca fade em tudo',
  'Abaixa a trilha quando eu falar',
]

const num = (s: string) => parseFloat(s.replace(',', '.'))

export function runCommand(p: Project, input: string, frame: number): AiResult {
  const text = input.trim()
  const low = text.toLowerCase()
  const allClips = (kind: string) => p.tracks.filter(t => t.kind === kind).flatMap(t => t.clips)

  let m = low.match(/corta(?:r)?\s+(?:os\s+)?(\d+(?:[.,]\d+)?)\s+primeiros?\s+segundos?/)
  if (m) {
    const sec = num(m[1])
    return { project: cutHead(p, Math.round(sec * FPS)), reply: `Cortei os ${sec} primeiros segundos e puxei tudo para o começo.` }
  }

  m = low.match(/(?:deixa|deixe|corta|limita)\s+(?:com|em|para)\s+(\d+(?:[.,]\d+)?)\s*(?:s|seg|segundos?)/)
  if (m) {
    const sec = num(m[1])
    if (sec * FPS >= projectDuration(p)) return { reply: `O vídeo já tem ${Math.round(projectDuration(p) / FPS)} segundos, menos que ${sec}.` }
    return { project: limitTo(p, Math.round(sec * FPS)), reply: `Pronto: o vídeo agora termina em ${sec} segundos.` }
  }

  m = text.match(/t[íi]tulo\s*:?\s*["“”']?([^"“”']+)["“”']?/i)
  if (m && /adiciona|coloca|põe|poe|cria|título:/i.test(text)) {
    const { project } = addClip(p, 'texto', { start: frame, duration: 3 * FPS, trimStart: 0, props: { text: m[1].trim(), fontSize: 76, weight: 800, color: '#ffffff', align: 'center', anim: 'pop', box: defaultBox.texto } })
    return { project, reply: `Adicionei o título “${m[1].trim()}” na agulha, com 3 segundos.` }
  }

  m = low.match(/legendas?\s+(?:fica\s+)?(amarela|branca|caixa|com caixa|preta)/) ?? low.match(/(amarela|branca|caixa)\b.*legenda/)
  if (m) {
    const style: CaptionStyle = m[1].includes('caixa') || m[1] === 'preta' ? 'caixa' : m[1] as CaptionStyle
    const caps = allClips('legenda')
    if (!caps.length) return { reply: 'Este projeto ainda não tem legendas. Adicione pela aba Texto.' }
    return { project: caps.reduce((acc, c) => updateProps(acc, c.id, { captionStyle: style }), p), reply: `Mudei ${caps.length} legenda${caps.length > 1 ? 's' : ''} para o estilo ${style}.` }
  }

  m = low.match(/(?:trilha|música|musica).*?(\d+)\s*%/) ?? low.match(/(\d+)\s*%.*(?:trilha|música|musica)/)
  if (m) {
    const vol = Math.min(100, +m[1]) / 100
    const music = allClips('audio').filter(c => c.props.fileId?.startsWith('a-') && c.props.fileId !== 'a-narr')
    if (!music.length) return { reply: 'Não encontrei trilha neste projeto.' }
    return { project: music.reduce((acc, c) => mapClip(acc, c.id, x => ({ ...x, props: { ...x.props, volume: vol } })), p), reply: `Trilha no volume ${Math.round(vol * 100)}%.` }
  }

  if (/(tira|remove|sem)\s+(a\s+)?(m[úu]sica|trilha)/.test(low)) {
    const music = allClips('audio').filter(c => c.props.fileId !== 'a-narr')
    if (!music.length) return { reply: 'Não há trilha para tirar.' }
    return { project: music.reduce((acc, c) => removeClip(acc, c.id), p), reply: 'Tirei a trilha. A narração continua.' }
  }

  m = low.match(/(?:acelera|deixa|coloca|velocidade)\D*(\d+(?:[.,]\d+)?)\s*x/)
  if (m) {
    const speed = num(m[1])
    const videos = allClips('video')
    if (!videos.length) return { reply: 'Não há vídeo neste projeto.' }
    if (![0.5, 1, 1.5, 2, 3].includes(speed)) return { reply: 'Use 0.5x, 1x, 1.5x, 2x ou 3x.' }
    return { project: videos.reduce((acc, c) => setSpeed(acc, c.id, speed), p), reply: `Coloquei ${videos.length > 1 ? 'os vídeos' : 'o vídeo'} em ${speed}x.` }
  }

  const preset = filterPresets.find(f => f.filter && (low.includes(f.label.toLowerCase()) || (f.id === 'pb' && /preto e branco/.test(low))))
  if (preset && /(filtro|deixa|aplica|coloca|põe)/.test(low)) {
    const media = [...allClips('video'), ...allClips('imagem')]
    return { project: media.reduce((acc, c) => updateProps(acc, c.id, { filter: preset.filter }), p), reply: `Apliquei o filtro ${preset.label} em ${media.length} clipe${media.length > 1 ? 's' : ''}.` }
  }

  m = low.match(/(fade|deslizar|zoom|desfoque)\s+em\s+tudo/)
  if (m) {
    const type = m[1] as TransitionType
    const clips = p.tracks.filter(t => visualKinds.includes(t.kind)).flatMap(t => t.clips)
    const t = { type, frames: 9 }
    return { project: clips.reduce((acc, c) => updateProps(acc, c.id, { transIn: t, transOut: t }), p), reply: `Coloquei transição ${type} na entrada e na saída de ${clips.length} clipes.` }
  }

  if (/(abaixa|baixa|diminui).*(trilha|música|musica).*(fala|narra)/.test(low)) {
    return { project: { ...p, ducking: { on: true, level: 0.3 } }, reply: 'Pronto: a trilha cai para 30% sempre que tiver narração.' }
  }

  return { reply: 'Nesta demonstração eu entendo pedidos como: ' + aiExamples.map(x => `“${x}”`).join(', ') + '. Na próxima fase a IA de verdade entra aqui, usando as mesmas ações da linha do tempo.' }
}
