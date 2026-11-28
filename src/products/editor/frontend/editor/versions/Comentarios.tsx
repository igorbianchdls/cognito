'use client'

// Comentários no vídeo (revisão): cada um preso a um momento. Ao escrever, o vídeo pausa e o comentário fica no tempo
// da agulha; clicar no tempo leva o vídeo até ele. Os abertos são o que o assistente (Claude/ChatGPT pelo conector do
// Otto) segue para refazer o vídeo — ele marca como resolvidos na versão nova que cria.
import { useRef, useState } from 'react'
import { ArrowUp, Check, MessageSquare, RotateCcw, Trash2, X } from 'lucide-react'
import { useFrame, type FrameStore } from '../project/useEditor'
import { FPS } from '../project/types'
import type { Comentario } from '../project/store'
import e from '../editor.module.css'

export const tempoCurto = (segundos: number) => `${Math.floor(segundos / 60)}:${String(Math.floor(segundos % 60)).padStart(2, '0')}`

type Props = {
  lista: Comentario[] | null
  frames: FrameStore
  pausar: () => void
  irPara: (segundo: number) => void
  onFechar: () => void
  onCriar: (segundo: number, texto: string) => Promise<void>
  onResolver: (c: Comentario, resolvido: boolean) => void
  onApagar: (c: Comentario) => void
  versaoDe: (id?: string) => string | undefined
}

export function Comentarios({ lista, frames, pausar, irPara, onFechar, onCriar, onResolver, onApagar, versaoDe }: Props) {
  const agulha = useFrame(frames) / FPS
  // O tempo fica preso quando a pessoa começa a escrever (o vídeo pausa).
  const [preso, setPreso] = useState<number | null>(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [verResolvidos, setVerResolvidos] = useState(false)
  const campo = useRef<HTMLTextAreaElement>(null)
  const tempo = preso ?? agulha
  const abertos = (lista ?? []).filter(c => !c.resolvidoEm)
  const resolvidos = (lista ?? []).filter(c => c.resolvidoEm)

  const enviar = async () => {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    try { await onCriar(tempo, texto); setTexto(''); setPreso(null); campo.current?.blur() } finally { setEnviando(false) }
  }

  const linha = (c: Comentario) => <div key={c.id} className={`${e.comentario} ${c.resolvidoEm ? e.comentarioResolvido : ''}`} data-comentario={c.id}>
    <button type="button" className={e.tempoChip} onClick={() => irPara(c.segundo)} title="Ir para este momento">{tempoCurto(c.segundo)}</button>
    <span className={e.comentarioTexto}>
      <span>{c.texto}</span>
      <small>{c.autorNome ?? 'Alguém da equipe'} · {c.at.slice(8, 10)}/{c.at.slice(5, 7)} {c.at.slice(11, 16)}{c.resolvidoEm ? ` · resolvido${versaoDe(c.resolvidoNaVersaoId) ? ` em “${versaoDe(c.resolvidoNaVersaoId)}”` : ''}` : ''}</small>
    </span>
    <span className={e.comentarioAcoes}>
      {c.resolvidoEm
        ? <button type="button" className={e.mini} onClick={() => onResolver(c, false)} aria-label="Reabrir comentário" title="Reabrir"><RotateCcw size={14} /></button>
        : <button type="button" className={e.mini} onClick={() => onResolver(c, true)} aria-label="Marcar como resolvido" title="Resolvido"><Check size={15} /></button>}
      <button type="button" className={e.mini} onClick={() => onApagar(c)} aria-label="Apagar comentário" title="Apagar"><Trash2 size={14} /></button>
    </span>
  </div>

  return <aside className={e.historico} aria-label="Comentários">
    <div className={e.historicoTopo}>
      <b><MessageSquare size={16} />Comentários{abertos.length ? <i className={e.contaComentarios}>{abertos.length}</i> : null}</b>
      <button type="button" className={e.mini} onClick={onFechar} aria-label="Fechar os comentários"><X size={16} /></button>
    </div>
    <form className={e.comentarNovo} onSubmit={ev => { ev.preventDefault(); void enviar() }}>
      <span className={e.tempoChip} aria-label={`No tempo ${tempoCurto(tempo)}`}>{tempoCurto(tempo)}</span>
      <textarea ref={campo} rows={1} value={texto} placeholder="Comente este momento do vídeo…" aria-label="Comentário"
        onFocus={() => { pausar(); setPreso(frames.get() / FPS) }}
        onBlur={() => { if (!texto.trim()) setPreso(null) }}
        onChange={ev => setTexto(ev.target.value)}
        onKeyDown={ev => { ev.stopPropagation(); if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); void enviar() } if (ev.key === 'Escape') { setTexto(''); campo.current?.blur() } }} />
      <button type="submit" className={e.comentarEnviar} disabled={!texto.trim() || enviando} aria-label="Enviar comentário"><ArrowUp size={15} /></button>
    </form>
    <p className={e.historicoDica}>Pause no momento e escreva o que mudar. Depois peça ao Claude ou ao ChatGPT (com o Otto conectado): “refaça o vídeo seguindo os comentários”.</p>
    <div className={e.historicoLista}>
      {!lista && <p className={e.hint}>Carregando…</p>}
      {lista && !abertos.length && <p className={e.hint}>Nenhum comentário aberto. Tecla C comenta no tempo da agulha.</p>}
      {abertos.map(linha)}
      {resolvidos.length > 0 && <>
        <button type="button" className={e.verResolvidos} onClick={() => setVerResolvidos(v => !v)} aria-expanded={verResolvidos}>{verResolvidos ? 'Esconder' : 'Ver'} resolvidos ({resolvidos.length})</button>
        {verResolvidos && resolvidos.map(linha)}
      </>}
    </div>
  </aside>
}
