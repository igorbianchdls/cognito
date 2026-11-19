'use client'

import { useState } from 'react'
import { Film, Image as ImageIcon, Music, Plus, Send, Shapes, Smile, Sparkles, Type } from 'lucide-react'
import { formatDuration } from '@/products/editor/frontend/lib/format'
import { mediaLibrary, shapePresets, stickerProps, stickers, textPresets, type MediaItem } from '../project/data'
import { aiExamples } from '../ai/commands'
import { MEDIA_MIME } from '../timeline/Timeline'
import { fonts } from '../remotion/animate'
import { useDrive } from '@/products/editor/frontend/spaces/hooks'
import type { ClipProps, TrackKind } from '../project/types'
import e from '../editor.module.css'

type Tab = 'midia' | 'texto' | 'stickers' | 'formas' | 'audio' | 'ia'
export type ChatMessage = { from: 'voce' | 'ia'; text: string }

type Props = {
  onAddMedia: (m: MediaItem) => void
  onAddPreset: (kind: TrackKind, props: ClipProps, seconds: number) => void
  chat: ChatMessage[]; onAsk: (text: string) => void
}

const tabs: { id: Tab; label: string; Icon: typeof Film }[] = [
  { id: 'midia', label: 'Mídia', Icon: Film }, { id: 'texto', label: 'Texto', Icon: Type }, { id: 'stickers', label: 'Stickers', Icon: Smile }, { id: 'formas', label: 'Formas', Icon: Shapes },
  { id: 'audio', label: 'Áudio', Icon: Music }, { id: 'ia', label: 'IA', Icon: Sparkles },
]

export function LeftPanel({ onAddMedia, onAddPreset, chat, onAsk }: Props) {
  const [tab, setTab] = useState<Tab>('midia')
  const drive = useDrive()
  return <aside className={e.left}>
    <nav className={e.tabs}>{tabs.map(t => <button key={t.id} className={tab === t.id ? e.tabOn : ''} onClick={() => setTab(t.id)} aria-pressed={tab === t.id}><t.Icon size={16} />{t.label}</button>)}</nav>
    <div className={e.panelBody}>
      {tab === 'midia' && <>
        <p className={e.hint}>Arquivos dos seus Spaces. Arraste para a linha do tempo ou clique em +.</p>
        <div className={e.mediaGrid}>{mediaLibrary(drive).filter(m => m.kind !== 'audio').map(m => <MediaCard key={m.id} m={m} onAdd={onAddMedia} />)}</div>
      </>}
      {tab === 'audio' && <>
        <p className={e.hint}>Trilhas e narrações. Arraste ou clique em +.</p>
        <div className={e.list}>{mediaLibrary(drive).filter(m => m.kind === 'audio').map(m => <MediaRow key={m.id} m={m} onAdd={onAddMedia} />)}</div>
      </>}
      {tab === 'texto' && <div className={e.presets}>{textPresets.map(t => <button key={t.label} className={e.preset} onClick={() => onAddPreset(t.kind, t.props, t.seconds)}>
        <span className={e.presetSample} style={{ color: t.props.color, background: t.props.bg ?? (t.kind === 'legenda' ? '#111827' : '#1f2937'), fontWeight: t.props.weight, fontFamily: fonts[t.props.font ?? 'geist'].family, fontSize: t.props.font === 'bebas' ? 20 : undefined }}>{t.kind === 'legenda' ? <><b style={{ color: '#facc15' }}>Legenda</b> animada</> : t.label}</span>
        <small>{presetHint(t.kind, t.props)}</small>
      </button>)}</div>}
      {tab === 'stickers' && <>
        <p className={e.hint}>Clique para pôr na agulha. Pulsam por padrão; troque para “Balançar” em Animação do texto.</p>
        <div className={e.stickerGrid}>{stickers.map(s => <button key={s} onClick={() => onAddPreset('texto', stickerProps(s), 2)} aria-label={`Sticker ${s}`}>{s}</button>)}</div>
      </>}
      {tab === 'formas' && <div className={e.presets}>{shapePresets.map(s => <button key={s.label} className={e.preset} onClick={() => onAddPreset('forma', s.props, s.full ? 0 : 3)}>
        <span className={e.presetShape}><i style={{ background: s.props.bg, borderRadius: s.props.shape === 'circulo' ? '50%' : 6, width: s.label === 'Faixa' || s.full ? '100%' : 46, height: s.label === 'Faixa' ? 18 : s.full ? 6 : 46, opacity: s.props.opacity }} /></span>
        <small>{s.label}</small>
      </button>)}</div>}
      {tab === 'ia' && <AiChat chat={chat} onAsk={onAsk} />}
    </div>
  </aside>
}

const presetHint = (kind: TrackKind, p: ClipProps) =>
  kind === 'legenda' ? 'Palavra por palavra' : p.anim === 'digitar' ? 'Efeito digitando' : p.anim === 'pop' ? 'Entra com pop' : p.anim === 'pulsar' ? 'Pulsa' : p.transIn?.type === 'deslizar' ? 'Desliza para dentro' : 'Surge de baixo'

const dragStart = (ev: React.DragEvent, m: MediaItem) => { ev.dataTransfer.setData(MEDIA_MIME, m.id); ev.dataTransfer.effectAllowed = 'copy' }

function MediaCard({ m, onAdd }: { m: MediaItem; onAdd: (m: MediaItem) => void }) {
  const Icon = m.kind === 'video' ? Film : ImageIcon
  return <div className={e.mediaCard} draggable onDragStart={ev => dragStart(ev, m)} title={m.name}>
    <span className={`${e.mediaThumb} ${e[`tone_${m.tone}`]}`}><Icon size={18} strokeWidth={1.6} />{m.duration !== undefined && <i>{formatDuration(m.duration)}</i>}</span>
    <span className={e.mediaName}>{m.name}</span>
    <button className={e.addBtn} onClick={() => onAdd(m)} aria-label={`Adicionar ${m.name}`}><Plus size={14} /></button>
  </div>
}

function MediaRow({ m, onAdd }: { m: MediaItem; onAdd: (m: MediaItem) => void }) {
  return <div className={e.mediaRow} draggable onDragStart={ev => dragStart(ev, m)}>
    <span className={`${e.audioIcon}`}><Music size={15} /></span>
    <span className={e.rowText}><b>{m.name}</b><small>{formatDuration(m.duration ?? 0)}</small></span>
    <button className={e.addBtn} onClick={() => onAdd(m)} aria-label={`Adicionar ${m.name}`}><Plus size={14} /></button>
  </div>
}

function AiChat({ chat, onAsk }: { chat: ChatMessage[]; onAsk: (t: string) => void }) {
  const [text, setText] = useState('')
  const send = (t: string) => { if (!t.trim()) return; onAsk(t); setText('') }
  return <div className={e.chat}>
    <div className={e.messages}>
      {chat.length === 0 && <p className={e.hint}>Peça uma edição. A IA mexe na mesma linha do tempo, então tudo pode ser ajustado à mão ou desfeito com Ctrl+Z.</p>}
      {chat.map((m, i) => <p key={i} className={m.from === 'voce' ? e.msgMe : e.msgAi}>{m.text}</p>)}
    </div>
    <div className={e.chips}>{aiExamples.slice(0, 4).map(x => <button key={x} onClick={() => send(x)}>{x}</button>)}</div>
    <form className={e.ask} onSubmit={ev => { ev.preventDefault(); send(text) }}>
      <input value={text} onChange={ev => setText(ev.target.value)} placeholder="Ex.: corta os 2 primeiros segundos" aria-label="Pedido para a IA" />
      <button aria-label="Enviar"><Send size={15} /></button>
    </form>
    <p className={e.note}>Demonstração com comandos simples. A IA de verdade entra na próxima fase.</p>
  </div>
}
