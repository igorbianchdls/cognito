'use client'

// Legendas automáticas: ouve a fala dos clipes de vídeo e de áudio (o áudio sai do arquivo no próprio navegador,
// em mono de 16 kHz), manda em pedaços de 50 s para o servidor transcrever e põe uma legenda a cada poucas palavras,
// no tempo exato de cada uma, já seguindo o corte e a velocidade de cada clipe.
import { caption } from './presets'
import { addClip } from './ops'
import { mediaUrl } from './mediaUrls'
import { FPS, type Clip, type Project } from './types'

const TAXA = 16000
const PEDACO = 50
type Palavra = { palavra: string; inicio: number; fim: number }

function wav(amostras: Float32Array) {
  const dados = new DataView(new ArrayBuffer(44 + amostras.length * 2))
  const texto = (o: number, s: string) => [...s].forEach((c, i) => dados.setUint8(o + i, c.charCodeAt(0)))
  texto(0, 'RIFF'); dados.setUint32(4, 36 + amostras.length * 2, true); texto(8, 'WAVE'); texto(12, 'fmt ')
  dados.setUint32(16, 16, true); dados.setUint16(20, 1, true); dados.setUint16(22, 1, true); dados.setUint32(24, TAXA, true)
  dados.setUint32(28, TAXA * 2, true); dados.setUint16(32, 2, true); dados.setUint16(34, 16, true); texto(36, 'data'); dados.setUint32(40, amostras.length * 2, true)
  amostras.forEach((a, i) => dados.setInt16(44 + i * 2, Math.max(-1, Math.min(1, a)) * 0x7fff, true))
  return new Blob([dados], { type: 'audio/wav' })
}

/** O som do trecho do arquivo que o clipe usa, em mono de 16 kHz. */
async function somDoClipe(url: string, clip: Clip) {
  const bruto = await (await fetch(url)).arrayBuffer()
  const audio = await new OfflineAudioContext(1, 1, TAXA).decodeAudioData(bruto)
  const mono = new Float32Array(audio.length)
  for (let c = 0; c < audio.numberOfChannels; c++) audio.getChannelData(c).forEach((v, i) => { mono[i] += v / audio.numberOfChannels })
  const de = Math.floor(clip.trimStart / FPS * TAXA)
  const ate = Math.min(mono.length, de + Math.ceil(clip.duration * (clip.speed ?? 1) / FPS * TAXA))
  return mono.subarray(de, Math.max(de, ate))
}

async function transcrever(amostras: Float32Array): Promise<Palavra[]> {
  const form = new FormData()
  form.append('audio', wav(amostras), 'trecho.wav')
  form.append('segundos', String(amostras.length / TAXA))
  const resposta = await fetch('/api/editor/legendas', { method: 'POST', body: form })
  const corpo = await resposta.json().catch(() => ({})) as { palavras?: Palavra[]; erro?: string }
  if (!resposta.ok) throw new Error(corpo.erro ?? 'Não foi possível ouvir o áudio agora.')
  return corpo.palavras ?? []
}

/** Junta as palavras em legendas curtas: até 4 palavras, quebrando em pontuação e em pausas. */
function frases(palavras: Palavra[]) {
  const saida: Palavra[][] = []
  let atual: Palavra[] = []
  for (const p of palavras) {
    const pausa = atual.length && p.inicio - atual[atual.length - 1].fim > 0.6
    if (atual.length && (atual.length >= 4 || pausa)) { saida.push(atual); atual = [] }
    atual.push(p)
    if (/[.!?,;:]$/.test(p.palavra)) { saida.push(atual); atual = [] }
  }
  if (atual.length) saida.push(atual)
  return saida
}

/** Clipes com fala: o selecionado (vídeo ou áudio), ou todos os vídeos e áudios de voz que estão tocando. */
export function clipesComFala(p: Project, selecionados: string[]) {
  const todos = p.tracks.filter(t => (t.kind === 'video' || t.kind === 'audio') && !t.muted)
    .flatMap(t => t.clips.filter(c => c.props.fileId && (c.props.volume ?? 1) > 0 && (t.kind === 'video' || c.props.role !== 'musica')))
  const escolhidos = todos.filter(c => selecionados.includes(c.id))
  return escolhidos.length ? escolhidos : todos
}

export type LegendaNova = { start: number; duration: number; text: string }

/** Ouve os clipes e devolve as legendas (aplicadas depois sobre o projeto como estiver, com comLegendas). */
export async function gerarLegendas(clipes: Clip[], progresso: (texto: string) => void): Promise<LegendaNova[]> {
  const legendas: LegendaNova[] = []
  for (const [n, clip] of clipes.entries()) {
    progresso(clipes.length > 1 ? `Ouvindo o clipe ${n + 1} de ${clipes.length}…` : 'Ouvindo o áudio…')
    const url = await mediaUrl(clip.props.fileId!)
    if (!url) continue
    const som = await somDoClipe(url, clip)
    const palavras: Palavra[] = []
    for (let de = 0; de < som.length; de += PEDACO * TAXA) {
      const pedaco = som.subarray(de, Math.min(som.length, de + PEDACO * TAXA))
      const desloca = de / TAXA
      palavras.push(...(await transcrever(pedaco)).map(w => ({ ...w, inicio: w.inicio + desloca, fim: w.fim + desloca })))
    }
    const velocidade = clip.speed ?? 1
    for (const f of frases(palavras)) {
      const inicio = clip.start + Math.round(f[0].inicio / velocidade * FPS)
      const fim = clip.start + Math.round(f[f.length - 1].fim / velocidade * FPS)
      legendas.push({ start: inicio, duration: Math.max(Math.round(0.5 * FPS), fim - inicio), text: f.map(w => w.palavra).join(' ') })
    }
  }
  return legendas
}

export const comLegendas = (p: Project, legendas: LegendaNova[]) =>
  legendas.reduce((acc, l) => addClip(acc, 'legenda', { start: l.start, duration: l.duration, trimStart: 0, props: caption(l.text) }).project, p)
