'use client'

// Recentes, Favoritos and Lixeira: items from every space in one list.
import { useEffect, useMemo, useState } from 'react'
import { Clock, LayoutGrid, List, Star, Trash2 } from 'lucide-react'
import { fileGone, folderGone, itemKey, trashed, type DFile, type DFolder, type Item } from '../store'
import { useDrive } from '../hooks'
import { Browser, type Sort } from './Browser'
import { sortItems, useViewMode } from './DriveView'
import { useDriveActions } from './actions'
import s from '@/products/editor/frontend/shell/ui.module.css'
import d from './drive.module.css'

type Kind = 'recentes' | 'favoritos' | 'lixeira'
const meta: Record<Kind, { title: string; text: string; Icon: typeof Clock; empty: string }> = {
  recentes: { title: 'Recentes', text: 'Arquivos e pastas que você abriu, enviou ou mudou por último.', Icon: Clock, empty: 'Nada recente ainda. Abra ou envie um arquivo.' },
  favoritos: { title: 'Favoritos', text: 'O que você marcou com estrela, de todos os spaces.', Icon: Star, empty: 'Nenhum favorito. Clique com o botão direito num item e escolha “Adicionar aos favoritos”.' },
  lixeira: { title: 'Lixeira', text: 'Itens apagados. Restaure ou exclua para sempre.', Icon: Trash2, empty: 'A lixeira está vazia.' },
}

export function SpecialView({ kind }: { kind: Kind }) {
  const drive = useDrive()
  const act = useDriveActions()
  const [view, setView] = useViewMode()
  const [sort, setSort] = useState<Sort>({ by: 'data', dir: -1 })
  const [selection, setSelection] = useState<string[]>([])
  const trash = kind === 'lixeira'

  const items: Item[] = useMemo(() => {
    if (trash) return trashed(drive)
    if (kind === 'favoritos') return [
      ...drive.folders.filter(f => f.favorite && !folderGone(drive, f.id)).map(folder => ({ type: 'folder' as const, folder })),
      ...drive.files.filter(f => f.favorite && !fileGone(drive, f)).map(file => ({ type: 'file' as const, file })),
    ]
    // Recentes: the latest opened, uploaded or changed files and opened folders.
    const stamp = (f: DFile) => f.openedAt ?? f.updatedAt ?? ''
    return [
      ...drive.folders.filter(f => f.openedAt && !folderGone(drive, f.id)).map(folder => ({ type: 'folder' as const, folder })),
      ...drive.files.filter(f => stamp(f) && !fileGone(drive, f)).sort((a, b) => stamp(b).localeCompare(stamp(a))).slice(0, 40).map(file => ({ type: 'file' as const, file })),
    ]
  }, [drive, kind, trash])

  const sorted = sortItems(items, sort, i => i.type === 'file' ? i.file.size : 0)
  const folders = sorted.flatMap(i => i.type === 'folder' ? [i.folder] : []) as DFolder[]
  const files = sorted.flatMap(i => i.type === 'file' ? [i.file] : []) as DFile[]
  const byKey = new Map(items.map(i => [itemKey(i), i]))
  const selected = selection.map(k => byKey.get(k)).filter((i): i is Item => !!i)

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (act.busy || (e.target as HTMLElement).closest('input, textarea, select')) return
      if (e.key === 'Escape') setSelection([])
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selected.length) { if (trash) act.destroy(selected); else act.trash(selected); setSelection([]) }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  const { title, text, Icon, empty } = meta[kind]
  return <>
    <section className={`${s.content} ${d.page}`} onClick={() => setSelection([])}>
      <div className={d.head}>
        <div><h1 className={d.plainTitle}><Icon size={22} />{title}</h1><p className={s.muted}>{text}</p></div>
        <span className={d.grow} />
        {trash && items.length > 0 && <button className={s.secondary} onClick={ev => { ev.stopPropagation(); act.clearTrash() }}><Trash2 size={15} />Esvaziar lixeira</button>}
        <div className={s.segment} onClick={ev => ev.stopPropagation()}><button className={view === 'grid' ? s.segOn : ''} onClick={() => setView('grid')} aria-label="Grade"><LayoutGrid size={15} /></button><button className={view === 'list' ? s.segOn : ''} onClick={() => setView('list')} aria-label="Lista"><List size={15} /></button></div>
      </div>
      {trash && items.length > 0 && <p className={d.trashNote}>Itens na lixeira não aparecem nos spaces nem no editor. Restaure para usar de novo.</p>}
      {selected.length > 0 && <div className={d.bulk} onClick={ev => ev.stopPropagation()}>
        <b>{selected.length} {selected.length === 1 ? 'selecionado' : 'selecionados'}</b><span className={d.grow} />
        {act.itemMenu(selected, { trash, siblings: files }).filter(m => !m.divider && m.label !== 'Abrir' && m.label !== 'Renomear').map(m => <button key={m.label} className={`${d.bulkBtn} ${m.danger ? d.bulkDanger : ''}`} onClick={() => { m.onClick?.(); setSelection([]) }} title={m.label} aria-label={m.label}>{m.icon && <m.icon size={16} />}<span>{m.label}</span></button>)}
      </div>}
      <div onClick={ev => ev.stopPropagation()}>
        <Browser folders={folders} files={files} view={view} sort={sort} onSort={setSort} selection={selected.map(itemKey)} onSelection={setSelection} showLocation dimmed={trash}
          onOpen={i => { if (!trash) act.open(i, files) }} onMenu={(ev, its) => act.showMenu(ev, act.itemMenu(its, { trash, siblings: files }))} />
      </div>
      {!items.length && <div className={d.empty}><Icon size={44} strokeWidth={1.2} /><b>{empty}</b></div>}
    </section>
    {act.ui}
  </>
}
