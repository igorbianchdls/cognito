'use client'

// Frames of the video files for the clips of the timeline (as in any editor: you see where each scene is).
// One frame per second of the file, extracted in the browser from the same link the preview uses, one at a time and
// kept in memory. Without a link (sample files) or when the browser can't read the video, the clip keeps its color.
import { useEffect, useSyncExternalStore } from 'react'

const ALTURA = 72
const frames = new Map<string, string>()
const pedidos = new Set<string>()
const listeners = new Set<() => void>()
let versao = 0
const avisar = () => { versao++; listeners.forEach(l => l()) }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

type Fila = { url: string; video: HTMLVideoElement; pendentes: number[]; rodando: boolean; falhou: boolean }
const filas = new Map<string, Fila>()

function video(url: string) {
  const v = document.createElement('video')
  v.muted = true
  v.preload = 'auto'
  v.playsInline = true
  if (!url.startsWith('blob:')) v.crossOrigin = 'anonymous'
  v.src = url
  return v
}

const esperar = (v: HTMLVideoElement, evento: string) => new Promise<void>((ok, erro) => {
  const tempo = setTimeout(() => erro(new Error('tempo')), 8000)
  v.addEventListener(evento, () => { clearTimeout(tempo); ok() }, { once: true })
  v.addEventListener('error', () => { clearTimeout(tempo); erro(new Error('vídeo')) }, { once: true })
})

async function rodar(fileId: string, fila: Fila) {
  if (fila.rodando || fila.falhou) return
  fila.rodando = true
  try {
    const v = fila.video
    if (v.readyState < 1) await esperar(v, 'loadedmetadata')
    const canvas = document.createElement('canvas')
    canvas.height = ALTURA
    canvas.width = Math.max(1, Math.round(ALTURA * (v.videoWidth || 9) / (v.videoHeight || 16)))
    const ctx = canvas.getContext('2d')
    while (fila.pendentes.length && ctx) {
      const s = fila.pendentes.shift()!
      const chave = `${fileId}:${s}`
      if (frames.has(chave)) continue
      v.currentTime = Math.min(Math.max(0, (v.duration || s + 1) - 0.05), s + 0.01)
      await esperar(v, 'seeked')
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
      frames.set(chave, canvas.toDataURL('image/jpeg', 0.6))
      avisar()
    }
  } catch {
    // Link sem permissão para ler os quadros (ou vídeo que o navegador não abre): o clipe fica com a cor.
    fila.falhou = true
  } finally { fila.rodando = false }
}

function pedir(fileId: string, url: string, segundos: number[]) {
  let fila = filas.get(fileId)
  if (!fila || fila.url !== url) { fila = { url, video: video(url), pendentes: [], rodando: false, falhou: false }; filas.set(fileId, fila) }
  for (const s of segundos) {
    const chave = `${fileId}:${s}`
    if (frames.has(chave) || pedidos.has(chave)) continue
    pedidos.add(chave)
    fila.pendentes.push(s)
  }
  void rodar(fileId, fila)
}

/** Frames (data URLs) of these seconds of the file; the missing ones come in as they are extracted. */
export function useFilmstrip(fileId: string | undefined, url: string | null, segundos: number[]) {
  useSyncExternalStore(subscribe, () => versao, () => 0)
  const chave = segundos.join(',')
  useEffect(() => {
    if (fileId && url) pedir(fileId, url, segundos)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a lista muda junto com a chave
  }, [fileId, url, chave])
  return segundos.map(s => (fileId ? frames.get(`${fileId}:${s}`) ?? null : null))
}
