'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Thumbnail } from '@remotion/player'
import { ArrowDownWideNarrow, ChevronDown, ChevronRight, Clapperboard, CloudUpload, Film, Filter, Folder, FolderPlus, LayoutGrid, List, Plus, Scissors, Trash2, Upload } from 'lucide-react'
import { formatSize } from '@/products/editor/frontend/lib/format'
import { useDriveState } from '@/products/drive/frontend/hooks'
import { liveFiles, liveFolders, type DFile } from '@/products/drive/frontend/store'
import { STORAGE_LIMIT } from '@/products/drive/frontend/data'
import { Thumb } from '@/products/drive/frontend/Thumb'
import { useDriveActions } from '@/products/drive/frontend/views/actions'
import { EditorComposition } from './remotion/Composition'
import { projectDuration } from './project/ops'
import { newProjectId, useProjects } from './project/store'
import { templates } from './project/templates'
import { FPS, canvasSize, type Project } from './project/types'
import { timecode } from './timeline/Timeline'
import s from '@/products/editor/frontend/shell/ui.module.css'
import h from './home.module.css'

/** Where the export dialog saves videos in the Drive. */
const EXPORT_FOLDER = 'Exportados'
type Show = 'todos' | 'projetos' | 'exportados'
type Sort = 'modificacao' | 'nome'
const showLabel: Record<Show, string> = { todos: 'Todos', projetos: 'Projetos', exportados: 'Vídeos exportados' }
const sortLabel: Record<Sort, string> = { modificacao: 'Data de modificação', nome: 'Nome' }
const VIEW_KEY = 'otto.editor.home.view'

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }).replace(/^(\d+) de (\w)/, (_, d, m) => `${d} de ${m.toUpperCase()}`)
const clock = (seconds?: number) => seconds == null ? '' : `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.round(seconds) % 60).padStart(2, '0')}`

/** A small menu under a button (closes on any click outside). */
function Menu<T extends string>({ value, options, onPick, children, icon: Icon, align = 'left' }: { value?: T; options: Record<T, string>; onPick: (v: T) => void; children: React.ReactNode; icon?: typeof Filter; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [open])
  return <div ref={ref} className={h.menuWrap}>
    <button type="button" className={h.tool} onClick={() => setOpen(o => !o)} aria-expanded={open}>{Icon && <Icon size={16} />}{children}<ChevronDown size={14} /></button>
    {open && <div className={`${h.menu} ${align === 'right' ? h.menuRight : ''}`} role="menu">
      {(Object.keys(options) as T[]).map(k => <button key={k} type="button" role="menuitemradio" aria-checked={value === k} className={value === k ? h.menuOn : ''} onClick={() => { onPick(k); setOpen(false) }}>{options[k]}</button>)}
    </div>}
  </div>
}

function ProjectCard({ p, list }: { p: Project; list: boolean }) {
  const { width, height } = canvasSize[p.format]
  const d = projectDuration(p)
  return <Link href={`/editor/${p.id}`} className={list ? h.row : h.card}>
    <span className={h.thumb}>
      <span className={h.frame} style={{ aspectRatio: `${width} / ${height}` }}>
        <Thumbnail component={EditorComposition} inputProps={{ project: p }} compositionWidth={width} compositionHeight={height} durationInFrames={d} fps={FPS} frameToDisplay={Math.min(d - 1, Math.round(FPS * 1.5))} style={{ width: '100%', height: '100%' }} />
      </span>
      <i className={h.badge}><Scissors size={12} />{timecode(d).slice(0, 5)}</i>
    </span>
    <span className={h.meta}><b>{p.name}</b><small>Editado em {shortDate(p.updatedAt)}</small></span>
  </Link>
}

function ExportCard({ f, list, onOpen }: { f: DFile; list: boolean; onOpen: () => void }) {
  return <button type="button" className={list ? h.row : h.card} onClick={onOpen}>
    <span className={h.thumb}>
      <span className={h.frame} style={{ aspectRatio: f.width && f.height ? `${f.width} / ${f.height}` : '9 / 16' }}><Thumb file={f} className={h.fileThumb} showKind={false} /></span>
      {f.duration != null && <i className={h.badge}>{clock(f.duration)}</i>}
    </span>
    <span className={h.meta}><b>{f.name}</b><small>Exportado em {shortDate(f.createdAt)}</small></span>
  </button>
}

/** Home of the Editor: create a video, upload media, projects and exported videos. */
export function ProjectsView() {
  const router = useRouter()
  const projects = useProjects()
  const driveState = useDriveState()
  const drive = driveState.drives[0]
  const actions = useDriveActions(drive ? { driveId: drive.id, folderId: null } : undefined)
  const [show, setShow] = useState<Show>('todos')
  const [sort, setSort] = useState<Sort>('modificacao')
  const [list, setList] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  // The saved view is read after the first render, so the server and the first client render match.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { try { setList(localStorage.getItem(VIEW_KEY) === 'lista') } catch { /* storage blocked */ } }, [])
  const toggleView = () => setList(v => { try { localStorage.setItem(VIEW_KEY, v ? 'grade' : 'lista') } catch { /* storage blocked */ } return !v })

  const create = (modelo?: string) => router.push(`/editor/${newProjectId()}${modelo ? `?modelo=${modelo}` : ''}`)

  const used = useMemo(() => liveFiles(driveState).reduce((sum, f) => sum + f.size, 0), [driveState])
  const exportFolders = useMemo(() => new Set(liveFolders(driveState).filter(f => f.name === EXPORT_FOLDER).map(f => f.id)), [driveState])
  const folders = useMemo(() => drive ? liveFolders(driveState).filter(f => f.driveId === drive.id && f.parentId === null && f.name !== EXPORT_FOLDER) : [], [driveState, drive])
  const byName = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { numeric: true })
  const shownProjects = useMemo(() => [...projects].sort((a, b) => sort === 'nome' ? byName(a.name, b.name) : b.updatedAt.localeCompare(a.updatedAt)), [projects, sort])
  const exported = useMemo(() => liveFiles(driveState).filter(f => f.kind === 'video' && f.folderId && exportFolders.has(f.folderId))
    .sort((a, b) => sort === 'nome' ? byName(a.name, b.name) : (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt)), [driveState, exportFolders, sort])

  const grid = list ? h.list : h.grid
  return <section className={`${s.content} ${h.page}`}>
    <div className={h.top}>
      <h1>Editor</h1>
      <Link href="/drive" className={h.usage} title="Espaço usado no Drive">{formatSize(used)} / {formatSize(STORAGE_LIMIT)}<span>Drive<ChevronRight size={14} /></span></Link>
    </div>

    <div className={h.actions}>
      <div className={h.create}>
        <button type="button" className={h.createMain} onClick={() => create()}><Clapperboard size={20} />Criar vídeo</button>
        <button type="button" className={h.createMore} aria-label="Começar com um modelo" title="Começar com um modelo" aria-expanded={templatesOpen} onClick={() => setTemplatesOpen(o => !o)}><Plus size={18} /></button>
        {templatesOpen && <div className={h.templates} role="menu">
          {templates.map(t => <button key={t.id} type="button" role="menuitem" onClick={() => create(t.id === 'branco' ? undefined : t.id)}><span className={h.ratio}>{t.format}</span><span><b>{t.label}</b><small>{t.description}</small></span></button>)}
        </div>}
      </div>
    </div>

    <div className={h.toolbar}>
      <div className={h.toolsLeft}>
        {drive && <Menu options={{ arquivos: 'Enviar arquivos', pasta: 'Enviar pasta' }} onPick={k => actions.pickFiles(drive.id, null, k === 'pasta')} icon={CloudUpload}>Carregar mídia</Menu>}
        {drive && <button type="button" className={h.tool} onClick={() => actions.newFolder(drive.id, null)}><FolderPlus size={16} />Nova pasta</button>}
        <Link href="/drive/lixeira" className={h.tool}><Trash2 size={16} />Lixeira</Link>
      </div>
      <div className={h.toolsRight}>
        <Menu value={show} options={showLabel} onPick={setShow} icon={Filter} align="right">{showLabel[show]}</Menu>
        <Menu value={sort} options={sortLabel} onPick={setSort} icon={ArrowDownWideNarrow} align="right">{sortLabel[sort]}</Menu>
        <button type="button" className={h.iconTool} onClick={toggleView} aria-label={list ? 'Ver em grade' : 'Ver em lista'} title={list ? 'Ver em grade' : 'Ver em lista'}>{list ? <LayoutGrid size={18} /> : <List size={18} />}</button>
      </div>
    </div>

    {show === 'todos' && folders.length > 0 && <>
      <h2 className={h.section}>Pastas</h2>
      <div className={h.folders}>{folders.map(f => <Link key={f.id} href={`/drive/pastas/${f.id}`} className={h.folder}><Folder size={18} /><span>{f.name}</span></Link>)}</div>
    </>}

    {show !== 'exportados' && <>
      <h2 className={h.section}>Projetos</h2>
      {shownProjects.length ? <div className={grid}>{shownProjects.map(p => <ProjectCard key={p.id} p={p} list={list} />)}</div>
        : <button type="button" className={h.empty} onClick={() => create()}><Plus size={18} />Nenhum projeto ainda. Criar o primeiro vídeo</button>}
    </>}

    {show !== 'projetos' && <>
      <h2 className={h.section}>Vídeos exportados</h2>
      {exported.length ? <div className={grid}>{exported.map(f => <ExportCard key={f.id} f={f} list={list} onOpen={() => actions.open({ type: 'file', file: f }, exported)} />)}</div>
        : <p className={h.emptyText}><Film size={16} />Os vídeos que você exportar aparecem aqui.</p>}
    </>}

    {!drive && <p className={h.emptyText}><Upload size={16} />Crie um drive no <Link href="/drive">Drive</Link> para enviar mídias.</p>}
    {actions.ui}
  </section>
}
