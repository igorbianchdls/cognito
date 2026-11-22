'use client'

// A drive or folder, Google DriveState style: folders and files on the same screen, nested folders,
// "+ Novo", filters, sorting, grid or list, right-click menus, drag to move and an Info panel.
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Calendar, ChevronDown, ChevronRight, FolderClosed, FolderPlus, FolderUp, Info, LayoutGrid, List, Plus, Search, Shapes, Star, Upload, Weight, X } from 'lucide-react'
import { formatDate, formatDateTime, formatDuration, formatSize } from '@/products/editor/frontend/lib/format'
import { tagTone, STORAGE_LIMIT } from '../data'
import { childFiles, childFolders, descendants, folderPath, folderStats, getDriveState, itemKey, liveFiles, moveItems, driveStats, type DFile, type DFolder, type Item } from '../store'
import { useDriveState, useDriveStatus } from '../hooks'
import { Thumb } from '../Thumb'
import { Browser, ITEMS_MIME, modifiedOf, type Sort } from './Browser'
import { useDriveActions } from './actions'
import s from '@/products/editor/frontend/shell/ui.module.css'
import d from './drive.module.css'

type KindFilter = 'todos' | 'video' | 'image' | 'audio' | 'text'
type DateFilter = 'qualquer' | '7' | '30' | '365'
type SizeFilter = 'qualquer' | 'p' | 'm' | 'g'
const MB = 1024 * 1024
const kindLabels: Record<KindFilter, string> = { todos: 'Tipo', video: 'Vídeos', image: 'Imagens', audio: 'Áudios', text: 'Textos' }
const dateLabels: Record<DateFilter, string> = { qualquer: 'Modificado', '7': 'Últimos 7 dias', '30': 'Últimos 30 dias', '365': 'Este ano' }
const sizeLabels: Record<SizeFilter, string> = { qualquer: 'Tamanho', p: 'Até 10 MB', m: '10 a 100 MB', g: 'Mais de 100 MB' }
const VIEW_KEY = 'otto-editor-driveState-view'

export function applyFilters(files: DFile[], f: { kind: KindFilter; date: DateFilter; size: SizeFilter }) {
  const since = f.date === 'qualquer' ? '' : new Date(Date.now() - +f.date * 864e5).toISOString().slice(0, 10)
  return files.filter(x => (f.kind === 'todos' || x.kind === f.kind)
    && (!since || (x.updatedAt ?? x.createdAt).slice(0, 10) >= since)
    && (f.size === 'qualquer' || (f.size === 'p' ? x.size < 10 * MB : f.size === 'm' ? x.size >= 10 * MB && x.size <= 100 * MB : x.size > 100 * MB)))
}

export function sortItems<T extends Item>(items: T[], sort: Sort, sizeOf: (i: T) => number) {
  const name = (i: Item) => i.type === 'file' ? i.file.name : i.folder.name
  return [...items].sort((a, b) => sort.dir * (sort.by === 'nome' ? name(a).localeCompare(name(b), 'pt-BR', { numeric: true })
    : sort.by === 'data' ? modifiedOf(a).localeCompare(modifiedOf(b)) : sizeOf(a) - sizeOf(b)))
}

export function useViewMode() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  useEffect(() => {
    try { const v = localStorage.getItem(VIEW_KEY); if (v === 'grid' || v === 'list') setView(v) } catch { /* default */ } // eslint-disable-line react-hooks/set-state-in-effect
  }, [])
  const change = (v: 'grid' | 'list') => { setView(v); try { localStorage.setItem(VIEW_KEY, v) } catch { /* storage blocked */ } }
  return [view, change] as const
}

export function DriveView({ driveId, folderId, openFileId }: { driveId?: string; folderId: string | null; openFileId?: string }) {
  const driveState = useDriveState()
  const status = useDriveStatus()
  const folder = folderId ? driveState.folders.find(f => f.id === folderId) : undefined
  const drive = driveState.drives.find(x => x.id === (folder?.driveId ?? driveId))
  const act = useDriveActions(drive ? { driveId: drive.id, folderId: folder?.id ?? null } : undefined)
  const [view, setView] = useViewMode()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<KindFilter>('todos')
  const [date, setDate] = useState<DateFilter>('qualquer')
  const [size, setSize] = useState<SizeFilter>('qualquer')
  const [sort, setSort] = useState<Sort>({ by: 'nome', dir: 1 })
  const [selection, setSelection] = useState<string[]>([])
  const [info, setInfo] = useState(true)
  const [dropping, setDropping] = useState(false)

  const here = folder?.id ?? null
  const searching = q.trim().length > 0
  const filtered = kind !== 'todos' || date !== 'qualquer' || size !== 'qualquer'
  const { folders, files } = useMemo(() => {
    if (!drive) return { folders: [] as DFolder[], files: [] as DFile[] }
    let fo: DFolder[], fi: DFile[]
    if (searching) {
      // Search looks inside this folder and every folder below it.
      const term = q.trim().toLowerCase()
      const scope = here ? new Set(descendants(driveState, here)) : null
      const inScope = (fid: string | null) => !scope || (fid !== null && scope.has(fid))
      fo = driveState.folders.filter(f => f.driveId === drive.id && !f.trashedAt && f.id !== here && inScope(f.parentId) && f.name.toLowerCase().includes(term) && !folderPath(driveState, f.id).some(p => p.trashedAt))
      fi = liveFiles(driveState).filter(f => f.driveId === drive.id && (here ? inScope(f.folderId) : true) && f.name.toLowerCase().includes(term))
    } else {
      fo = childFolders(driveState, drive.id, here)
      fi = childFiles(driveState, drive.id, here)
    }
    fi = applyFilters(fi, { kind, date, size })
    if (filtered) fo = []
    const sizeOf = (i: Item) => i.type === 'file' ? i.file.size : folderStats(driveState, i.folder.id).size
    return {
      folders: sortItems(fo.map(folder => ({ type: 'folder' as const, folder })), sort, sizeOf).map(i => i.folder),
      files: sortItems(fi.map(file => ({ type: 'file' as const, file })), sort, sizeOf).map(i => i.file),
    }
  }, [driveState, drive, here, searching, q, kind, date, size, sort, filtered])

  const all: Item[] = [...folders.map(folder => ({ type: 'folder' as const, folder })), ...files.map(file => ({ type: 'file' as const, file }))]
  const byKey = new Map(all.map(i => [itemKey(i), i]))
  const selected = selection.map(k => byKey.get(k)).filter((i): i is Item => !!i)

  // Opened from the global search: select the file and show it in the viewer once.
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (shown || !openFileId) return
    const f = files.find(x => x.id === openFileId)
    if (!f) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setShown(true)
    setSelection([`f:${f.id}`])
    /* eslint-enable react-hooks/set-state-in-effect */
    act.open({ type: 'file', file: f }, files)
  }, [openFileId, files, shown, act])

  // Keyboard: Delete, F2, Enter, Ctrl+A, Escape — like DriveState.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (act.busy || (e.target as HTMLElement).closest('input, textarea, select')) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); setSelection(all.map(itemKey)) }
      else if (e.key === 'Escape') setSelection([])
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selected.length) { act.trash(selected); setSelection([]) }
      else if (e.key === 'F2' && selected.length === 1) act.renameItem(selected[0])
      else if (e.key === 'Enter' && selected.length === 1) act.open(selected[0], files)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  if (status !== 'ready' && (!drive || (folderId && !folder))) return <section className={s.content}><p className={s.empty} role="status">{status === 'error' ? 'Não foi possível carregar. Recarregue a página.' : 'Carregando…'}</p></section>
  if (!drive) return <section className={s.content}><p className={s.empty}>Este drive não existe mais. <Link href="/drive" className={s.link}>Ver o Drive</Link></p></section>
  if (folderId && (!folder || folder.trashedAt)) return <section className={s.content}><p className={s.empty}>{folder ? 'Esta pasta está na lixeira.' : 'Pasta não encontrada.'} <Link href={folder ? '/drive/lixeira' : `/drive/${drive.id}`} className={s.link}>{folder ? 'Abrir lixeira' : 'Voltar ao drive'}</Link></p></section>

  const path = folderPath(driveState, here)
  const title = folder?.name ?? drive.name
  const dropOn = (target: DFolder | { driveId: string; folderId: string | null }, keys: string[]) => {
    const items = keys.map(k => {
      const id = k.slice(2)
      if (k.startsWith('d:')) { const f = getDriveState().folders.find(x => x.id === id); return f && { type: 'folder' as const, folder: f } }
      const f = getDriveState().files.find(x => x.id === id); return f && { type: 'file' as const, file: f }
    }).filter((i): i is Item => !!i)
    const dest = 'parentId' in target ? { driveId: target.driveId, folderId: target.id } : target
    if (!items.length) return
    const ok = moveItems(items, dest.driveId, dest.folderId)
    act.setToast(ok ? `${items.length === 1 ? 'Item movido' : `${items.length} itens movidos`}.` : 'Uma pasta não pode ir para dentro dela mesma.')
    setSelection([])
  }
  const crumbDrop = (driveIdTo: string, folderIdTo: string | null) => ({
    onDragOver: (ev: React.DragEvent) => { if (ev.dataTransfer.types.includes(ITEMS_MIME)) ev.preventDefault() },
    onDrop: (ev: React.DragEvent) => { const raw = ev.dataTransfer.getData(ITEMS_MIME); if (raw) { ev.preventDefault(); dropOn({ driveId: driveIdTo, folderId: folderIdTo }, JSON.parse(raw)) } },
  })
  const filterMenu = <T extends string>(ev: React.MouseEvent, labels: Record<T, string>, value: T, set: (v: T) => void, first: string) => {
    const r = ev.currentTarget.getBoundingClientRect(), keys = Object.keys(labels) as T[]
    act.showMenu({ clientX: r.left, clientY: r.bottom + 4 }, keys.map((k, i) => ({ label: i === 0 ? first : labels[k], checked: k === value, onClick: () => set(k) })))
  }
  const empty = !folders.length && !files.length

  return <>
    <section className={`${s.content} ${d.page} ${dropping ? d.dropping : ''}`}
      onContextMenu={ev => { if (!(ev.target as HTMLElement).closest('[role=button], tr, button, input')) { ev.preventDefault(); setSelection([]); act.showMenu(ev, act.backgroundMenu(drive.id, here)) } }}
      onClick={() => setSelection([])}
      onDragOver={ev => { if (ev.dataTransfer.types.includes('Files')) { ev.preventDefault(); setDropping(true) } }}
      onDragLeave={ev => { if (ev.currentTarget === ev.target || !ev.currentTarget.contains(ev.relatedTarget as Node)) setDropping(false) }}
      onDrop={ev => { if (ev.dataTransfer.files.length) { ev.preventDefault(); setDropping(false); void act.upload([...ev.dataTransfer.files], drive.id, here) } }}>
      <nav className={d.crumbs} aria-label="Caminho">
        <Link href="/drive"><FolderClosed size={16} />Drive</Link><ChevronRight size={14} />
        <Link href={`/drive/${drive.id}`} {...crumbDrop(drive.id, null)}>{drive.name}</Link>
        {path.map(f => <span key={f.id} className={d.crumbPart}><ChevronRight size={14} /><Link href={`/drive/pastas/${f.id}`} {...crumbDrop(drive.id, f.id)} aria-current={f.id === here ? 'page' : undefined}>{f.name}</Link></span>)}
      </nav>
      <div className={d.head}>
        <button className={d.titleBtn} onClick={ev => { ev.stopPropagation(); const r = ev.currentTarget.getBoundingClientRect(); act.showMenu({ clientX: r.left, clientY: r.bottom + 4 }, folder ? act.itemMenu([{ type: 'folder', folder }]).filter(m => m.label !== 'Abrir') : act.backgroundMenu(drive.id, null)) }}>
          <h1>{title}</h1><ChevronDown size={18} />
        </button>
        <span className={d.grow} />
        <button className={d.newBtn} onClick={ev => { ev.stopPropagation(); const r = ev.currentTarget.getBoundingClientRect(); act.showMenu({ clientX: r.left, clientY: r.bottom + 6 }, act.backgroundMenu(drive.id, here)) }}><Plus size={18} />Novo</button>
      </div>
      {/* The selection bar covers the toolbar instead of pushing the content, so nothing jumps between two clicks. */}
      <div className={d.barSlot}>
      <div className={d.toolbar} style={{ visibility: selected.length ? 'hidden' : 'visible' }} onClick={ev => ev.stopPropagation()}>
        <label className={d.search}><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder={`Buscar em ${title}`} aria-label="Buscar" />{q && <button onClick={() => setQ('')} aria-label="Limpar busca"><X size={14} /></button>}</label>
        <button className={`${d.chip} ${kind !== 'todos' ? d.chipOn : ''}`} onClick={ev => filterMenu(ev, kindLabels, kind, setKind, 'Todos os tipos')}><Shapes size={14} />{kindLabels[kind]}<ChevronDown size={14} /></button>
        <button className={`${d.chip} ${date !== 'qualquer' ? d.chipOn : ''}`} onClick={ev => filterMenu(ev, dateLabels, date, setDate, 'Qualquer data')}><Calendar size={14} />{dateLabels[date]}<ChevronDown size={14} /></button>
        <button className={`${d.chip} ${size !== 'qualquer' ? d.chipOn : ''}`} onClick={ev => filterMenu(ev, sizeLabels, size, setSize, 'Qualquer tamanho')}><Weight size={14} />{sizeLabels[size]}<ChevronDown size={14} /></button>
        {filtered && <button className={d.clear} onClick={() => { setKind('todos'); setDate('qualquer'); setSize('qualquer') }}>Limpar filtros</button>}
        <span className={d.grow} />
        {view === 'grid' && <select className={d.sortSel} value={`${sort.by}:${sort.dir}`} onChange={e => { const [by, dir] = e.target.value.split(':'); setSort({ by: by as Sort['by'], dir: +dir as 1 | -1 }) }} aria-label="Ordenar">
          <option value="nome:1">Nome (A–Z)</option><option value="nome:-1">Nome (Z–A)</option><option value="data:-1">Mais recentes</option><option value="data:1">Mais antigos</option><option value="tamanho:-1">Maiores</option><option value="tamanho:1">Menores</option>
        </select>}
        <div className={s.segment}><button className={view === 'grid' ? s.segOn : ''} onClick={() => setView('grid')} aria-label="Grade" aria-pressed={view === 'grid'}><LayoutGrid size={15} /></button><button className={view === 'list' ? s.segOn : ''} onClick={() => setView('list')} aria-label="Lista" aria-pressed={view === 'list'}><List size={15} /></button></div>
        <button className={`${d.iconBtn} ${info ? d.iconOn : ''}`} onClick={() => setInfo(!info)} aria-label="Detalhes" aria-pressed={info}><Info size={18} /></button>
      </div>

      {selected.length > 0 && <div className={d.bulk} onClick={ev => ev.stopPropagation()}>
        <button className={d.iconBtn} onClick={() => setSelection([])} aria-label="Limpar seleção"><X size={18} /></button>
        <b>{selected.length} {selected.length === 1 ? 'selecionado' : 'selecionados'}</b>
        <span className={d.grow} />
        {act.itemMenu(selected, { siblings: files }).filter(m => !m.divider && m.label !== 'Abrir' && m.label !== 'Renomear').map(m => <button key={m.label} className={`${d.bulkBtn} ${m.danger ? d.bulkDanger : ''}`} onClick={() => { m.onClick?.(); if (m.danger || m.label.startsWith('Mover')) setSelection([]) }} title={m.label} aria-label={m.label}>{m.icon && <m.icon size={16} />}<span>{m.label}</span></button>)}
      </div>}
      </div>

      {searching && <p className={d.resultNote}>{files.length + folders.length} {files.length + folders.length === 1 ? 'resultado' : 'resultados'} para “{q.trim()}” em {title}{here ? ' e subpastas' : ''}</p>}
      <div onClick={ev => ev.stopPropagation()}>
        <Browser folders={folders} files={files} view={view} sort={sort} onSort={setSort} selection={selected.map(itemKey)} onSelection={setSelection}
          onOpen={i => act.open(i, files)} onMenu={(ev, items) => act.showMenu(ev, act.itemMenu(items, { siblings: files }))} onDropOn={(f, keys) => dropOn(f, keys)} showLocation={searching} />
      </div>
      {empty && <div className={d.empty}>
        <FolderUp size={44} strokeWidth={1.2} />
        <b>{searching || filtered ? 'Nada encontrado' : 'Esta pasta está vazia'}</b>
        <span>{searching || filtered ? 'Tente outro termo ou limpe os filtros.' : 'Arraste arquivos para cá ou use o botão “Novo”.'}</span>
        {!searching && !filtered && <div className={s.row}><button className={s.secondary} onClick={ev => { ev.stopPropagation(); act.pickFiles(drive.id, here) }}><Upload size={15} />Enviar arquivos</button><button className={s.secondary} onClick={ev => { ev.stopPropagation(); act.newFolder(drive.id, here) }}><FolderPlus size={15} />Nova pasta</button></div>}
      </div>}
      {dropping && <div className={d.dropOverlay}><Upload size={28} />Solte para enviar para <b>{title}</b></div>}
    </section>
    {info && <InfoPanel selected={selected} folder={folder} driveId={drive.id} onClose={() => setInfo(false)} onFavorite={items => act.favorite(items)} />}
    {act.ui}
  </>
}

const kindName = { video: 'Vídeo', image: 'Imagem', audio: 'Áudio', text: 'Texto' }

function InfoPanel({ selected, folder, driveId, onClose, onFavorite }: { selected: Item[]; folder?: DFolder; driveId: string; onClose: () => void; onFavorite: (items: Item[]) => void }) {
  const driveState = useDriveState()
  const one = selected.length === 1 ? selected[0] : null
  const drive = driveState.drives.find(x => x.id === driveId)!
  const head = <div className={s.infoHead}><h2>{one ? (one.type === 'file' ? one.file.name : one.folder.name) : selected.length > 1 ? `${selected.length} itens` : folder?.name ?? drive.name}</h2><button className={s.iconBtn} onClick={onClose} aria-label="Fechar painel"><X size={18} /></button></div>
  if (selected.length > 1) {
    const size = selected.reduce((v, i) => v + (i.type === 'file' ? i.file.size : folderStats(driveState, i.folder.id).size), 0)
    return <aside className={s.info}>{head}<section className={s.infoSection}><div className={s.props}><div>Itens<b>{selected.length}</b></div><div>Tamanho total<b>{formatSize(size)}</b></div></div></section></aside>
  }
  if (one?.type === 'file') {
    const f = one.file
    return <aside className={s.info}>{head}
      <Thumb file={f} className={d.infoThumb} showKind={false} />
      <section className={s.infoSection}><h3>Detalhes</h3><div className={s.props}>
        <div>Tipo<b>{kindName[f.kind]}</b></div>
        <div>Tamanho<b>{formatSize(f.size)}</b></div>
        {f.duration !== undefined && <div>Duração<b>{formatDuration(f.duration)}</b></div>}
        {f.width > 0 && <div>Dimensões<b>{f.width}×{f.height}</b></div>}
        <div>Local<b>{[drive.name, ...folderPath(driveState, f.folderId).map(x => x.name)].join(' / ')}</b></div>
        <div>Criado em<b>{formatDate(f.createdAt)}</b></div>
        <div>Modificado<b>{formatDateTime(f.updatedAt ?? f.createdAt)}</b></div>
        {f.openedAt && <div>Aberto por você<b>{formatDateTime(f.openedAt)}</b></div>}
      </div></section>
      <button className={d.favBtn} onClick={() => onFavorite([one])}><Star size={15} fill={f.favorite ? 'currentColor' : 'none'} />{f.favorite ? 'Nos favoritos' : 'Adicionar aos favoritos'}</button>
    </aside>
  }
  const target = one?.type === 'folder' ? one.folder : folder
  const stats = target ? folderStats(driveState, target.id) : driveStats(driveState, driveId)
  return <aside className={s.info}>{head}
    <div className={s.statCard}><small>{target ? 'Nesta pasta' : 'Neste drive'}</small><b>{formatSize(stats.size)}</b><span className={s.bar}><i style={{ width: `${Math.max(2, stats.size / STORAGE_LIMIT * 100)}%`, background: 'var(--ink)' }} /></span></div>
    <section className={s.infoSection}><h3>Detalhes</h3><div className={s.props}>
      <div>Arquivos<b>{stats.files}</b></div>
      <div>Pastas<b>{stats.folders}</b></div>
      {target && <><div>Local<b>{[drive.name, ...folderPath(driveState, target.parentId).map(x => x.name)].join(' / ')}</b></div>
        <div>Criada em<b>{formatDate(target.createdAt)}</b></div><div>Modificada<b>{formatDate(target.updatedAt)}</b></div></>}
    </div></section>
    {target?.description && <section className={s.infoSection}><h3>Descrição</h3><p className={s.muted}>{target.description}</p></section>}
    {target && target.tags.length > 0 && <section className={s.infoSection}><h3>Tags</h3><div className={s.tags}>{target.tags.map(t => <span key={t} className={`${s.tag} ${s[`tag_${tagTone[t] ?? 'gray'}`] ?? ''}`}><i />{t}</span>)}</div></section>}
    {one?.type === 'folder' && <button className={d.favBtn} onClick={() => onFavorite([one])}><Star size={15} fill={one.folder.favorite ? 'currentColor' : 'none'} />{one.folder.favorite ? 'Nos favoritos' : 'Adicionar aos favoritos'}</button>}
    <p className={d.hint}>Dica: clique com o botão direito em qualquer item ou no espaço vazio para mais ações.</p>
  </aside>
}
