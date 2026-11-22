'use client'

// Folders and files in grid or list, with selection (click, Ctrl, Shift), drag to move and context menus.
import { useRef } from 'react'
import { ArrowDown, ArrowUp, Check, FileText, Film, Folder, Image as ImageIcon, MoreVertical, Music, Star } from 'lucide-react'
import { formatDate, formatSize } from '@/products/editor/frontend/lib/format'
import { folderLabel, folderStats, itemKey, type DFile, type DFolder, type Item } from '../store'
import { useDriveState } from '../hooks'
import { Thumb } from '../Thumb'
import d from './drive.module.css'

export type SortBy = 'nome' | 'data' | 'tamanho'
export type Sort = { by: SortBy; dir: 1 | -1 }
export const ITEMS_MIME = 'application/x-otto-editor-items'
const kindIcon = { video: Film, image: ImageIcon, audio: Music, text: FileText }
const kindName = { video: 'Vídeo', image: 'Imagem', audio: 'Áudio', text: 'Texto' }

export const modifiedOf = (i: Item) => i.type === 'file' ? i.file.updatedAt ?? i.file.createdAt : i.folder.updatedAt

type Props = {
  folders: DFolder[]; files: DFile[]; view: 'grid' | 'list'; sort: Sort; onSort: (s: Sort) => void
  selection: string[]; onSelection: (keys: string[]) => void
  onOpen: (item: Item) => void; onMenu: (ev: React.MouseEvent, items: Item[]) => void
  onDropOn?: (folder: DFolder, keys: string[]) => void
  showLocation?: boolean; dimmed?: boolean
}

export function Browser({ folders, files, view, sort, onSort, selection, onSelection, onOpen, onMenu, onDropOn, showLocation, dimmed }: Props) {
  const driveState = useDriveState()
  const anchor = useRef<string | null>(null)
  const items: Item[] = [...folders.map(folder => ({ type: 'folder' as const, folder })), ...files.map(file => ({ type: 'file' as const, file }))]
  const keys = items.map(itemKey)
  const byKey = new Map(items.map(i => [itemKey(i), i]))
  const picked = (k: string) => selection.includes(k)

  const click = (ev: React.MouseEvent, k: string) => {
    ev.stopPropagation()
    if (ev.shiftKey && anchor.current && keys.includes(anchor.current)) {
      const [a, b] = [keys.indexOf(anchor.current), keys.indexOf(k)].sort((x, y) => x - y)
      onSelection([...new Set([...(ev.ctrlKey || ev.metaKey ? selection : []), ...keys.slice(a, b + 1)])])
      return
    }
    anchor.current = k
    if (ev.ctrlKey || ev.metaKey) onSelection(picked(k) ? selection.filter(x => x !== k) : [...selection, k])
    else onSelection([k])
  }
  const check = (ev: React.MouseEvent, k: string) => { ev.stopPropagation(); anchor.current = k; onSelection(picked(k) ? selection.filter(x => x !== k) : [...selection, k]) }
  const menu = (ev: React.MouseEvent, k: string) => {
    ev.preventDefault(); ev.stopPropagation()
    const keysNow = picked(k) ? selection : [k]
    if (!picked(k)) onSelection([k])
    onMenu(ev, keysNow.map(x => byKey.get(x)!).filter(Boolean))
  }
  const dragStart = (ev: React.DragEvent, k: string) => {
    const moving = picked(k) ? selection : [k]
    if (!picked(k)) onSelection([k])
    ev.dataTransfer.setData(ITEMS_MIME, JSON.stringify(moving))
    ev.dataTransfer.effectAllowed = 'move'
  }
  const dropProps = (folder: DFolder) => onDropOn ? {
    onDragOver: (ev: React.DragEvent) => { if (ev.dataTransfer.types.includes(ITEMS_MIME)) { ev.preventDefault(); ev.currentTarget.classList.add(d.dropHover) } },
    onDragLeave: (ev: React.DragEvent) => ev.currentTarget.classList.remove(d.dropHover),
    onDrop: (ev: React.DragEvent) => {
      ev.currentTarget.classList.remove(d.dropHover)
      const raw = ev.dataTransfer.getData(ITEMS_MIME)
      if (!raw) return
      ev.preventDefault(); ev.stopPropagation()
      const moving: string[] = JSON.parse(raw)
      if (!moving.includes(`d:${folder.id}`)) onDropOn(folder, moving)
    },
  } : {}
  const where = (i: Item) => {
    const driveId = i.type === 'file' ? i.file.driveId : i.folder.driveId
    const parent = i.type === 'file' ? i.file.folderId : i.folder.parentId
    return [driveState.drives.find(s => s.id === driveId)?.name, folderLabel(driveState, parent)].filter(Boolean).join(' / ')
  }
  const more = (k: string) => <button className={d.more} onClick={ev => menu(ev, k)} aria-label="Mais ações"><MoreVertical size={16} /></button>

  if (view === 'list') {
    const head = (by: SortBy, text: string, cls = '') => <th className={cls}><button onClick={() => onSort({ by, dir: sort.by === by ? (-sort.dir as 1 | -1) : by === 'nome' ? 1 : -1 })}>{text}{sort.by === by && (sort.dir === 1 ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th>
    return <table className={`${d.table} ${dimmed ? d.dimmed : ''}`}>
      <thead><tr><th className={d.checkCol} />{head('nome', 'Nome')}{showLocation && <th>Local</th>}{head('data', 'Modificado')}{head('tamanho', 'Tamanho', d.num)}<th className={d.moreCol} /></tr></thead>
      <tbody>{items.map(i => {
        const k = itemKey(i), on = picked(k)
        const size = i.type === 'file' ? i.file.size : folderStats(driveState, i.folder.id).size
        return <tr key={k} className={on ? d.rowOn : ''} onClick={ev => click(ev, k)} onDoubleClick={() => onOpen(i)} onContextMenu={ev => menu(ev, k)} draggable onDragStart={ev => dragStart(ev, k)} {...(i.type === 'folder' ? dropProps(i.folder) : {})}>
          <td className={d.checkCol}><button className={`${d.check} ${on ? d.checkOn : ''}`} onClick={ev => check(ev, k)} aria-label="Selecionar" aria-pressed={on}>{on && <Check size={12} />}</button></td>
          <td><span className={d.nameCell}>
            {i.type === 'folder' ? <Folder size={18} className={d.folderIcon} /> : <Thumb file={i.file} className={d.rowThumb} showKind={false} />}
            <span className={d.nameText}>{i.type === 'folder' ? i.folder.name : i.file.name}</span>
            {(i.type === 'folder' ? i.folder.favorite : i.file.favorite) && <Star size={13} className={d.star} fill="currentColor" />}
          </span></td>
          {showLocation && <td className={d.muted}>{where(i)}</td>}
          <td className={d.muted}>{formatDate(modifiedOf(i).slice(0, 10))}</td>
          <td className={`${d.muted} ${d.num}`}>{i.type === 'folder' ? '—' : formatSize(size)}</td>
          <td className={d.moreCol}>{more(k)}</td>
        </tr>
      })}</tbody>
    </table>
  }

  return <div className={dimmed ? d.dimmed : ''}>
    {folders.length > 0 && <section className={d.section}>
      <h3>Pastas</h3>
      <div className={d.folderGrid}>{folders.map(f => {
        const k = `d:${f.id}`, on = picked(k)
        const stats = folderStats(driveState, f.id)
        return <div key={k} className={`${d.folderChip} ${on ? d.on : ''}`} onClick={ev => click(ev, k)} onDoubleClick={() => onOpen({ type: 'folder', folder: f })} onContextMenu={ev => menu(ev, k)}
          draggable onDragStart={ev => dragStart(ev, k)} {...dropProps(f)} title={f.name} role="button" tabIndex={0} aria-pressed={on}>
          <Folder size={20} className={d.folderIcon} fill="currentColor" />
          <span className={d.chipText}><b>{f.name}</b><small>{showLocation ? where({ type: 'folder', folder: f }) : `${stats.files} ${stats.files === 1 ? 'arquivo' : 'arquivos'}${stats.folders ? ` · ${stats.folders} ${stats.folders === 1 ? 'pasta' : 'pastas'}` : ''}`}</small></span>
          {f.favorite && <Star size={13} className={d.star} fill="currentColor" />}
          {more(k)}
        </div>
      })}</div>
    </section>}
    {files.length > 0 && <section className={d.section}>
      <h3>Arquivos</h3>
      <div className={d.fileGrid}>{files.map(f => {
        const k = `f:${f.id}`, on = picked(k)
        const Icon = kindIcon[f.kind]
        return <div key={k} className={`${d.fileTile} ${on ? d.on : ''}`} onClick={ev => click(ev, k)} onDoubleClick={() => onOpen({ type: 'file', file: f })} onContextMenu={ev => menu(ev, k)}
          draggable onDragStart={ev => dragStart(ev, k)} title={f.name} role="button" tabIndex={0} aria-pressed={on}>
          <div className={d.tileHead}><Icon size={16} className={d[`k_${f.kind}`]} /><span className={d.nameText}>{f.name}</span>{more(k)}</div>
          <div className={d.tileThumb}>
            <Thumb file={f} className={d.tileImg} showKind={false} />
            <button className={`${d.check} ${d.tileCheck} ${on ? d.checkOn : ''}`} onClick={ev => check(ev, k)} aria-label="Selecionar" aria-pressed={on}>{on && <Check size={12} />}</button>
            {f.favorite && <Star size={14} className={d.tileStar} fill="currentColor" />}
          </div>
          <small className={d.tileMeta}>{showLocation ? where({ type: 'file', file: f }) : `${kindName[f.kind]} · ${formatSize(f.size)}`}</small>
        </div>
      })}</div>
    </section>}
  </div>
}
