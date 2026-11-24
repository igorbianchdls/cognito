'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeftRight, ChevronLeft, ChevronRight, CloudUpload, Captions, Film, FileUp, FolderUp, HardDrive, Image as ImageIcon, LayoutTemplate, Link2, Loader2, Music, Package, Pause, Play, Plus, Search, Send, Shapes, Sparkles, SunMedium, Type, Wand2, X } from 'lucide-react'
import { formatDuration } from '@/products/editor/frontend/lib/format'
import { filterPresets, mediaLibrary, media as mediaById, shapePresets, stickerProps, stickers, textPresets, type MediaItem } from '../project/data'
import { aiExamples } from '../ai/commands'
import { MEDIA_MIME } from '../timeline/Timeline'
import { fonts } from '../remotion/animate'
import { templates } from '../project/templates'
import { findClip, updateProps } from '../project/ops'
import { useDriveState } from '@/products/drive/frontend/hooks'
import { childFolders, createFolder, getDriveState, liveFiles, uploadFiles, type DFile, type DriveState } from '@/products/drive/frontend/store'
import { Thumb } from '@/products/drive/frontend/Thumb'
import type { ClipProps, Project, TextAnim, TrackKind, TransitionType } from '../project/types'
import e from '../editor.module.css'

type Tab = 'midia' | 'modelos' | 'elementos' | 'audio' | 'texto' | 'legendas' | 'efeitos' | 'transicoes' | 'filtros' | 'ia'
export type ChatMessage = { from: 'voce' | 'ia'; text: string }

type Props = {
  project: Project
  selectedIds: string[]
  apply: (change: (p: Project) => Project, key?: string) => void
  onApplyTemplate: (templateId: string) => void
  onAddMedia: (m: MediaItem) => void
  onAddMediaMany: (list: MediaItem[]) => void
  onAddPreset: (kind: TrackKind, props: ClipProps, seconds: number) => void
  onToast: (text: string) => void
  chat: ChatMessage[]; onAsk: (text: string) => void
}

const tabs: { id: Tab; label: string; Icon: typeof Film }[] = [
  { id: 'midia', label: 'Mídia', Icon: CloudUpload }, { id: 'modelos', label: 'Modelos', Icon: LayoutTemplate },
  { id: 'elementos', label: 'Elementos', Icon: Shapes }, { id: 'audio', label: 'Áudio', Icon: Music },
  { id: 'texto', label: 'Texto', Icon: Type }, { id: 'legendas', label: 'Legendas', Icon: Captions },
  { id: 'efeitos', label: 'Efeitos', Icon: Wand2 }, { id: 'transicoes', label: 'Transições', Icon: ArrowLeftRight },
  { id: 'filtros', label: 'Filtros', Icon: SunMedium }, { id: 'ia', label: 'IA', Icon: Sparkles },
]

/** Folders of the first drive where the editor saves what it brings in. */
const UPLOAD_FOLDER = 'Uploads do Editor'
const SFX_FOLDER = 'Sound effects'
function folderFor(name: string) {
  const d = getDriveState()
  const drive = d.drives[0]
  if (!drive) return null
  const folderId = childFolders(d, drive.id, null).find(f => f.name === name && !f.trashedAt)?.id ?? createFolder(drive.id, null, name)
  return { driveId: drive.id, folderId }
}

/** The left of the editor: the rail of tools and the panel of the open one (it folds to give the preview more room). */
export function LeftPanel(props: Props) {
  const [tab, setTab] = useState<Tab>('midia')
  const [open, setOpen] = useState(true)
  const pick = (t: Tab) => { if (t === tab && open) setOpen(false); else { setTab(t); setOpen(true) } }
  const current = tabs.find(t => t.id === tab)!
  return <>
    <nav className={e.rail} aria-label="Ferramentas do editor">
      <Link href="/editor" className={e.home} aria-label="Voltar ao início do Editor" title="Voltar ao início do Editor">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logoOttoIcon.svg" alt="" width={22} height={22} />
      </Link>
      {tabs.map(t => <button key={t.id} type="button" className={open && tab === t.id ? e.railOn : ''} onClick={() => pick(t.id)} aria-pressed={open && tab === t.id}><t.Icon size={20} strokeWidth={1.8} /><span>{t.label}</span></button>)}
    </nav>
    {open && <aside className={e.left} aria-label={current.label}>
      <div className={e.panelHead}><b>{current.label}</b></div>
      <div className={e.panelBody}><TabBody tab={tab} {...props} /></div>
      <button type="button" className={e.fold} onClick={() => setOpen(false)} aria-label="Recolher painel" title="Recolher painel"><ChevronLeft size={14} /></button>
    </aside>}
    {!open && <button type="button" className={`${e.fold} ${e.unfold}`} onClick={() => setOpen(true)} aria-label="Abrir painel" title="Abrir painel"><ChevronRight size={14} /></button>}
  </>
}

function TabBody({ tab, project, selectedIds, apply, onApplyTemplate, onAddMedia, onAddMediaMany, onAddPreset, onToast, chat, onAsk }: Props & { tab: Tab }) {
  switch (tab) {
    case 'midia': return <MediaTab onAddMedia={onAddMedia} onAddMediaMany={onAddMediaMany} onToast={onToast} />
    case 'modelos': return <div className={e.list}>
      <p className={e.hint}>Troca o projeto atual pelo modelo. Ctrl+Z desfaz.</p>
      {templates.filter(t => t.id !== 'branco').map(t => <button key={t.id} type="button" className={e.templateRow} onClick={() => onApplyTemplate(t.id)}>
        <span className={e.ratioTag}>{t.format}</span><span className={e.rowText}><b>{t.label}</b><small>{t.description}</small></span>
      </button>)}
    </div>
    case 'elementos': return <>
      <h4 className={e.groupTitle}>Stickers</h4>
      <div className={e.stickerGrid}>{stickers.map(s => <button key={s} onClick={() => onAddPreset('texto', stickerProps(s), 2)} aria-label={`Sticker ${s}`}>{s}</button>)}</div>
      <h4 className={e.groupTitle}>Formas</h4>
      <div className={e.presets}>{shapePresets.map(s => <button key={s.label} className={e.preset} onClick={() => onAddPreset('forma', s.props, s.full ? 0 : 3)}>
        <span className={e.presetShape}><i style={{ background: s.props.bg, borderRadius: s.props.shape === 'circulo' ? '50%' : 6, width: s.label === 'Faixa' || s.full ? '100%' : 46, height: s.label === 'Faixa' ? 18 : s.full ? 6 : 46, opacity: s.props.opacity }} /></span>
        <small>{s.label}</small>
      </button>)}</div>
    </>
    case 'audio': return <AudioTab onAddMedia={onAddMedia} onToast={onToast} />
    case 'texto': return <TextPresets kinds="texto" onAddPreset={onAddPreset} />
    case 'legendas': return <TextPresets kinds="legenda" onAddPreset={onAddPreset} />
    case 'efeitos': return <ClipTab project={project} selectedIds={selectedIds} need="texto" empty="Selecione um texto ou legenda na linha do tempo para aplicar um efeito.">
      {ids => <div className={e.presets}>{anims.map(a => <button key={a.id} type="button" className={e.preset} onClick={() => applyAll(apply, ids, { anim: a.id }, 'anim')}>
        <span className={e.presetSample} style={{ background: '#1f2937' }}>{a.label}</span><small>{a.hint}</small>
      </button>)}</div>}
    </ClipTab>
    case 'transicoes': return <ClipTab project={project} selectedIds={selectedIds} need="visual" empty="Selecione um clipe na linha do tempo para aplicar uma transição.">
      {ids => <>
        <p className={e.hint}>Clique para aplicar na entrada e na saída do clipe. Ajuste a duração em Propriedades.</p>
        <div className={e.presets}>
          {transitions.map(t => <button key={t.id} type="button" className={e.preset} onClick={() => applyAll(apply, ids, { transIn: { type: t.id, frames: 12 }, transOut: { type: t.id, frames: 12 } }, 'trans')}>
            <span className={e.presetSample} style={{ background: '#1f2937' }}><ArrowLeftRight size={18} /></span><small>{t.label}</small>
          </button>)}
          <button type="button" className={e.preset} onClick={() => applyAll(apply, ids, { transIn: undefined, transOut: undefined }, 'trans')}>
            <span className={e.presetSample} style={{ background: 'var(--soft)', color: 'var(--muted)' }}><X size={18} /></span><small>Sem transição</small>
          </button>
        </div>
      </>}
    </ClipTab>
    case 'filtros': return <ClipTab project={project} selectedIds={selectedIds} need="media" empty="Selecione um vídeo ou imagem na linha do tempo para aplicar um filtro.">
      {ids => <div className={e.presets}>{filterPresets.map(fp => <button key={fp.id} type="button" className={e.preset} onClick={() => applyAll(apply, ids, { filter: fp.filter }, 'fpreset')}>
        <span className={e.filterSample} style={{ filter: fp.filter ? `brightness(${fp.filter.brightness}) contrast(${fp.filter.contrast}) saturate(${fp.filter.saturation}) grayscale(${fp.filter.grayscale}) sepia(${fp.filter.sepia})` : undefined }} />
        <small>{fp.label}</small>
      </button>)}</div>}
    </ClipTab>
    case 'ia': return <AiChat chat={chat} onAsk={onAsk} />
  }
}

const anims: { id: TextAnim; label: string; hint: string }[] = [
  { id: 'pop', label: 'Pop', hint: 'Entra com pop' }, { id: 'surgir', label: 'Surgir', hint: 'Surge de baixo' }, { id: 'digitar', label: 'Digitando', hint: 'Letra por letra' },
  { id: 'pulsar', label: 'Pulsar', hint: 'Pulsa sem parar' }, { id: 'balancar', label: 'Balançar', hint: 'Balança sem parar' }, { id: 'nenhuma', label: 'Nenhuma', hint: 'Sem animação' },
]
const transitions: { id: TransitionType; label: string }[] = [{ id: 'fade', label: 'Fade' }, { id: 'deslizar', label: 'Deslizar' }, { id: 'zoom', label: 'Zoom' }, { id: 'desfoque', label: 'Desfoque' }]

const applyAll = (apply: Props['apply'], ids: string[], patch: Partial<ClipProps>, key: string) =>
  apply(p => ids.reduce((acc, id) => updateProps(acc, id, patch), p), `${ids.join(',')}:${key}:${Date.now()}`)

/** Tools that act on the selected clips: lists the ones that fit, or says what to select. */
function ClipTab({ project, selectedIds, need, empty, children }: { project: Project; selectedIds: string[]; need: 'texto' | 'visual' | 'media'; empty: string; children: (ids: string[]) => React.ReactNode }) {
  const ids = selectedIds.filter(id => {
    const kind = findClip(project, id)?.track.kind
    return need === 'texto' ? kind === 'texto' || kind === 'legenda' : need === 'media' ? kind === 'video' || kind === 'imagem' : !!kind && kind !== 'audio'
  })
  if (!ids.length) return <p className={e.hint}>{empty}</p>
  return <>{ids.length > 1 && <p className={e.hint}>{ids.length} clipes selecionados.</p>}{children(ids)}</>
}

function TextPresets({ kinds, onAddPreset }: { kinds: 'texto' | 'legenda'; onAddPreset: Props['onAddPreset'] }) {
  const list = textPresets.filter(t => kinds === 'legenda' ? t.kind === 'legenda' : t.kind !== 'legenda')
  return <div className={e.presets}>{list.map(t => <button key={t.label} className={e.preset} onClick={() => onAddPreset(t.kind, t.props, t.seconds)}>
    <span className={e.presetSample} style={{ color: t.props.color, background: t.props.bg ?? (t.kind === 'legenda' ? '#111827' : '#1f2937'), fontWeight: t.props.weight, fontFamily: fonts[t.props.font ?? 'geist'].family, fontSize: t.props.font === 'bebas' ? 20 : undefined }}>{t.kind === 'legenda' ? <><b style={{ color: '#facc15' }}>Legenda</b> animada</> : t.label}</span>
    <small>{presetHint(t.kind, t.props)}</small>
  </button>)}</div>
}

const presetHint = (kind: TrackKind, p: ClipProps) =>
  kind === 'legenda' ? 'Palavra por palavra' : p.anim === 'digitar' ? 'Efeito digitando' : p.anim === 'pop' ? 'Entra com pop' : p.anim === 'pulsar' ? 'Pulsa' : p.transIn?.type === 'deslizar' ? 'Desliza para dentro' : 'Surge de baixo'

const dragStart = (ev: React.DragEvent, m: MediaItem) => { ev.dataTransfer.setData(MEDIA_MIME, m.id); ev.dataTransfer.effectAllowed = 'copy' }

// ---------- Mídia ----------

const isMediaFile = (f: File) => /^(video|image|audio)\//.test(f.type)
/** Saves files to the Drive (folder "Uploads do Editor") and returns their ids, ready to go into the video. */
export async function uploadToEditor(list: File[], onToast: (text: string) => void): Promise<string[]> {
  const files = list.filter(isMediaFile)
  if (!files.length) { onToast('Escolha vídeos, imagens ou áudios.'); return [] }
  const target = folderFor(UPLOAD_FOLDER)
  if (!target) { onToast('Crie um drive no Drive antes de carregar.'); return [] }
  try {
    const ids = await uploadFiles(files, target.driveId, target.folderId)
    onToast(`${files.length} ${files.length === 1 ? 'arquivo carregado' : 'arquivos carregados'} em ${UPLOAD_FOLDER}.`)
    return ids
  } catch (err) {
    console.error('editor: carregar falhou', err)
    onToast('Não foi possível carregar.')
    return []
  }
}

type Shape = 'todos' | 'vertical' | 'horizontal'

function MediaTab({ onAddMedia, onAddMediaMany, onToast }: { onAddMedia: Props['onAddMedia']; onAddMediaMany: Props['onAddMediaMany']; onToast: Props['onToast'] }) {
  const driveState = useDriveState()
  const [menu, setMenu] = useState(false)
  const [picker, setPicker] = useState(false)
  const [shape, setShape] = useState<Shape>('todos')
  const [uploading, setUploading] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  // webkitdirectory isn't in React's input props.
  useEffect(() => { folderInput.current?.setAttribute('webkitdirectory', '') }, [])
  useEffect(() => {
    if (!menu) return
    const close = (ev: MouseEvent) => { if (!menuRef.current?.contains(ev.target as Node)) setMenu(false) }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [menu])

  const files = useMemo(() => {
    const byId = new Map(driveState.files.map(f => [f.id, f]))
    return mediaLibrary(driveState).filter(m => m.kind !== 'audio')
      .filter(m => shape === 'todos' || !m.width || !m.height || (shape === 'vertical' ? m.height >= m.width : m.width > m.height))
      .map(m => ({ m, file: byId.get(m.id) }))
  }, [driveState, shape])

  const upload = async (list: File[]) => {
    const n = list.filter(isMediaFile).length
    setUploading(u => u + n)
    try { await uploadToEditor(list, onToast) } finally { setUploading(u => u - n) }
  }

  return <>
    <input ref={fileInput} type="file" multiple accept="video/*,image/*,audio/*" hidden onChange={ev => { void upload([...(ev.target.files ?? [])]); ev.target.value = '' }} />
    <input ref={folderInput} type="file" multiple hidden onChange={ev => { void upload([...(ev.target.files ?? [])]); ev.target.value = '' }} />
    <div ref={menuRef} className={e.uploadWrap}>
      <button type="button" className={e.uploadBtn} onClick={() => setMenu(o => !o)} aria-expanded={menu}>
        {uploading ? <Loader2 size={18} className={e.spin} /> : <CloudUpload size={18} />}{uploading ? `Carregando ${uploading}…` : 'Carregar'}
      </button>
      {menu && <div className={e.uploadMenu} role="menu">
        <button type="button" role="menuitem" onClick={() => { setMenu(false); fileInput.current?.click() }}><FileUp size={18} />Carregar arquivo</button>
        <button type="button" role="menuitem" onClick={() => { setMenu(false); folderInput.current?.click() }}><FolderUp size={18} />Carregar pasta</button>
        <hr />
        <button type="button" role="menuitem" onClick={() => { setMenu(false); setPicker(true) }}><HardDrive size={18} />Drive</button>
        <button type="button" role="menuitem" disabled title="Em breve"><Package size={18} />Dropbox<small>Em breve</small></button>
        <button type="button" role="menuitem" disabled title="Em breve"><Link2 size={18} />Compartilhar link de carregamento<small>Em breve</small></button>
      </div>}
    </div>
    <div className={e.shapeSwitch} role="group" aria-label="Formato">
      {(['todos', 'vertical', 'horizontal'] as Shape[]).map(s => <button key={s} type="button" className={shape === s ? e.segOn : ''} onClick={() => setShape(s)} aria-pressed={shape === s}>{s === 'todos' ? 'Todos' : s === 'vertical' ? 'Vertical' : 'Horizontal'}</button>)}
    </div>
    {files.length ? <div className={e.mediaGrid}>{files.map(({ m, file }) => <MediaCard key={m.id} m={m} file={file} onAdd={onAddMedia} />)}</div>
      : <p className={e.hint}>Nenhuma mídia ainda. Carregue arquivos ou traga do Drive.</p>}
    {picker && <DrivePicker onClose={() => setPicker(false)} onPick={ids => { onAddMediaMany(ids.flatMap(id => mediaById(id) ?? [])); setPicker(false); onToast(`${ids.length} ${ids.length === 1 ? 'arquivo adicionado' : 'arquivos adicionados'} ao vídeo.`) }} />}
  </>
}

function MediaCard({ m, file, onAdd }: { m: MediaItem; file?: DFile; onAdd: (m: MediaItem) => void }) {
  const Icon = m.kind === 'video' ? Film : ImageIcon
  return <div className={e.mediaCard} draggable onDragStart={ev => dragStart(ev, m)} title={m.name}>
    <span className={`${e.mediaThumb} ${file ? e.mediaThumbReal : e[`tone_${m.tone}`]}`}>
      {file ? <span className={e.mediaFrame} style={{ aspectRatio: m.width && m.height ? `${m.width} / ${m.height}` : '9 / 16' }}><Thumb file={file} showKind={false} className={e.mediaImg} /></span> : <Icon size={18} strokeWidth={1.6} />}
      {!file && m.duration !== undefined && <i>{formatDuration(m.duration)}</i>}
    </span>
    <span className={e.mediaName}>{m.name}</span>
    <button className={e.addBtn} onClick={() => onAdd(m)} aria-label={`Adicionar ${m.name}`}><Plus size={14} /></button>
  </div>
}

/** Picks videos, images and audios from the company's Drive to put in the video. */
function DrivePicker({ onPick, onClose }: { onPick: (ids: string[]) => void; onClose: () => void }) {
  const d = useDriveState()
  const [driveId, setDriveId] = useState(d.drives[0]?.id ?? '')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [chosen, setChosen] = useState<string[]>([])
  const folders = driveId ? childFolders(d, driveId, folderId) : []
  const files = liveFiles(d).filter(f => f.driveId === driveId && f.folderId === folderId && (f.kind === 'video' || f.kind === 'image' || f.kind === 'audio'))
  const path = pathOf(d, folderId)
  const toggle = (id: string) => setChosen(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id])
  return <div className={e.modalBack} onMouseDown={ev => { if (ev.target === ev.currentTarget) onClose() }}>
    <div className={e.modal} role="dialog" aria-modal="true" aria-label="Escolher do Drive">
      <div className={e.modalHead}><b>Escolher do Drive</b><button type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button></div>
      <div className={e.crumbs}>
        <select value={driveId} onChange={ev => { setDriveId(ev.target.value); setFolderId(null) }} aria-label="Drive">{d.drives.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        {path.map(f => <span key={f.id}><ChevronRight size={14} /><button type="button" onClick={() => setFolderId(f.id)}>{f.name}</button></span>)}
      </div>
      <div className={e.pickerList}>
        {folderId && <button type="button" className={e.pickerRow} onClick={() => setFolderId(path.at(-2)?.id ?? null)}><ChevronLeft size={16} />Voltar</button>}
        {folders.map(f => <button key={f.id} type="button" className={e.pickerRow} onClick={() => setFolderId(f.id)}><HardDrive size={16} />{f.name}<ChevronRight size={14} className={e.pickerArrow} /></button>)}
        {files.map(f => <label key={f.id} className={e.pickerRow}><input type="checkbox" checked={chosen.includes(f.id)} onChange={() => toggle(f.id)} />{f.kind === 'audio' ? <Music size={16} /> : f.kind === 'video' ? <Film size={16} /> : <ImageIcon size={16} />}<span className={e.pickerName}>{f.name}</span>{f.duration != null && <small>{formatDuration(f.duration)}</small>}</label>)}
        {!folders.length && !files.length && <p className={e.hint}>Nada aqui.</p>}
      </div>
      <div className={e.modalFoot}><button type="button" className={e.ghostBtn} onClick={onClose}>Cancelar</button><button type="button" className={e.export} disabled={!chosen.length} onClick={() => onPick(chosen)}>Adicionar {chosen.length || ''}</button></div>
    </div>
  </div>
}

function pathOf(d: DriveState, folderId: string | null) {
  const out: { id: string; name: string }[] = []
  let id = folderId
  while (id) { const f = d.folders.find(x => x.id === id); if (!f) break; out.unshift({ id: f.id, name: f.name }); id = f.parentId }
  return out
}

// ---------- Áudio ----------

type Sfx = { id: string; title: string; category: string; duration_ms: number | null; tags: string[]; url: string | null; storage_path: string }

async function sfxApi<T>(params: Record<string, string>): Promise<T> {
  const response = await fetch(`/api/marketing/sound-effects?${new URLSearchParams(params)}`, { cache: 'no-store' })
  const body = await response.json().catch(() => ({})) as T & { erro?: string }
  if (!response.ok) throw new Error(body.erro ?? `HTTP ${response.status}`)
  return body
}

const sfxCategories: Record<string, string> = {
  transicoes: 'Transições', impactos: 'Impactos', texto: 'Texto e destaque', interface: 'Interface e digital', comicos: 'Cômicos e reações',
  risers: 'Risers e tensão', sucesso: 'Sucesso e dinheiro', erro: 'Erro e alerta', objetos: 'Corpo e objetos', ambientes: 'Ambientes',
  vozes: 'Vozes e reações', natureza: 'Natureza e clima', animais: 'Animais', veiculos: 'Veículos e trânsito', comida: 'Comida e cozinha',
  esporte: 'Esporte e fitness', casa: 'Casa', tecnologia: 'Tecnologia e sci-fi', terror: 'Terror e suspense', festa: 'Festa e celebração',
  musicais: 'Musicais curtos', beleza: 'Beleza e moda', negocios: 'Negócios e escritório', saude: 'Saúde e bem-estar',
}

function AudioTab({ onAddMedia, onToast }: { onAddMedia: Props['onAddMedia']; onToast: Props['onToast'] }) {
  const driveState = useDriveState()
  const [section, setSection] = useState<'sfx' | 'meus'>('sfx')
  const mine = mediaLibrary(driveState).filter(m => m.kind === 'audio')
  return <>
    <div className={e.shapeSwitch} role="group" aria-label="Áudios">
      <button type="button" className={section === 'sfx' ? e.segOn : ''} onClick={() => setSection('sfx')} aria-pressed={section === 'sfx'}>Sound effects</button>
      <button type="button" className={section === 'meus' ? e.segOn : ''} onClick={() => setSection('meus')} aria-pressed={section === 'meus'}>Meus áudios</button>
    </div>
    {section === 'sfx' ? <SoundEffects onAddMedia={onAddMedia} onToast={onToast} /> : <>
      <p className={e.hint}>Trilhas e narrações do Drive. Arraste ou clique em +.</p>
      <div className={e.list}>{mine.map(m => <div key={m.id} className={e.mediaRow} draggable onDragStart={ev => dragStart(ev, m)}>
        <span className={e.audioIcon}><Music size={15} /></span>
        <span className={e.rowText}><b>{m.name}</b><small>{formatDuration(m.duration ?? 0)}</small></span>
        <button className={e.addBtn} onClick={() => onAddMedia(m)} aria-label={`Adicionar ${m.name}`}><Plus size={14} /></button>
      </div>)}</div>
    </>}
  </>
}

/** The Sound effects library: search, categories, listen, and add (the file is copied to the Drive, then to the video). */
function SoundEffects({ onAddMedia, onToast }: { onAddMedia: Props['onAddMedia']; onToast: Props['onToast'] }) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [category, setCategory] = useState('transicoes')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<Sfx[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const request = useRef(0)

  useEffect(() => { sfxApi<{ categorias: { category: string; total: number }[] }>({ categorias: '1' }).then(r => setCounts(Object.fromEntries(r.categorias.map(c => [c.category, c.total]))), () => setError('Não foi possível carregar os efeitos.')) }, [])
  useEffect(() => { const t = setTimeout(() => setSearch(query.trim()), 300); return () => clearTimeout(t) }, [query])
  const load = async (offset: number) => {
    const id = ++request.current
    try {
      const page = await sfxApi<{ efeitos: Sfx[]; total: number }>({ ...(search ? { busca: search } : { categoria: category }), inicio: String(offset) })
      if (id !== request.current) return
      setItems(prev => [...(offset ? prev ?? [] : []), ...page.efeitos]); setTotal(page.total); setError('')
    } catch { if (id === request.current) { setError('Não foi possível carregar os efeitos.'); if (!offset) setItems([]) } }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { setItems(null); void load(0) }, [category, search])
  useEffect(() => () => audio.current?.pause(), [])

  const fresh = async (s: Sfx) => (await sfxApi<{ efeitos: Sfx[] }>({ id: s.id })).efeitos[0]?.url ?? null
  const listen = async (s: Sfx) => {
    const a = audio.current ??= new Audio()
    if (playing === s.id) { a.pause(); setPlaying(null); return }
    a.pause()
    const url = await fresh(s).catch(() => null)
    if (!url) { onToast('Não foi possível tocar este efeito.'); return }
    a.src = url; a.onended = () => setPlaying(null)
    await a.play().catch(() => undefined); setPlaying(s.id)
  }
  const add = async (s: Sfx) => {
    setAdding(s.id)
    try {
      const target = folderFor(SFX_FOLDER)
      if (!target) throw new Error('sem drive')
      const name = s.storage_path.split('/').pop() ?? `${s.title}.mp3`
      const existing = liveFiles(getDriveState()).find(f => f.folderId === target.folderId && f.name === name)
      let fileId = existing?.id
      if (!fileId) {
        const url = await fresh(s)
        if (!url) throw new Error('sem url')
        const blob = await (await fetch(url)).blob()
        ;[fileId] = await uploadFiles([new File([blob], name, { type: 'audio/mpeg' })], target.driveId, target.folderId)
      }
      const m = fileId ? mediaById(fileId) : undefined
      if (!m) throw new Error('mídia não encontrada')
      onAddMedia(m)
    } catch (err) {
      console.error('editor: sound effect', err)
      onToast('Não foi possível adicionar o efeito.')
    } finally { setAdding(null) }
  }

  const cats = Object.keys(sfxCategories).filter(c => counts[c])
  return <>
    <label className={e.sfxSearch}><Search size={15} /><input value={query} onChange={ev => setQuery(ev.target.value)} placeholder="Buscar efeito ou tag" /></label>
    {!search && cats.length > 0 && <select className={e.sfxSelect} value={category} onChange={ev => setCategory(ev.target.value)} aria-label="Categoria">
      {cats.map(c => <option key={c} value={c}>{sfxCategories[c]} ({counts[c]})</option>)}
    </select>}
    {search && <p className={e.hint}>{total} {total === 1 ? 'resultado' : 'resultados'}</p>}
    {error && <p className={e.hint}>{error}</p>}
    {items === null ? <Loader2 size={18} className={e.spin} /> : <div className={e.list}>
      {items.map(s => <div key={s.id} className={e.mediaRow}>
        <button type="button" className={e.sfxPlay} onClick={() => void listen(s)} aria-label={playing === s.id ? `Pausar ${s.title}` : `Ouvir ${s.title}`}>{playing === s.id ? <Pause size={14} /> : <Play size={14} />}</button>
        <span className={e.rowText}><b title={s.title}>{s.title}</b><small>{s.duration_ms != null ? `${(s.duration_ms / 1000).toFixed(1).replace('.', ',')} s` : ''}{s.tags.length ? ` · ${s.tags.join(', ')}` : ''}</small></span>
        <button className={e.addBtn} onClick={() => void add(s)} disabled={adding === s.id} aria-label={`Adicionar ${s.title}`}>{adding === s.id ? <Loader2 size={14} className={e.spin} /> : <Plus size={14} />}</button>
      </div>)}
      {items.length < total && <button type="button" className={e.ghostBtn} onClick={() => void load(items.length)}>Carregar mais</button>}
    </div>}
  </>
}

// ---------- IA ----------

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
