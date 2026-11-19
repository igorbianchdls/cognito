'use client'

// Small building blocks for the file explorer: context menu and dialogs.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronRight, Folder, FolderClosed, X } from 'lucide-react'
import { childFolders, descendants, type Drive } from '../store'
import d from './drive.module.css'

export type MenuItem = { label: string; icon?: typeof X; onClick?: () => void; danger?: boolean; disabled?: boolean; shortcut?: string; divider?: boolean; checked?: boolean }
export type MenuState = { x: number; y: number; items: MenuItem[] } | null

/** Menu at a screen point, kept inside the window; closes on outside click, Escape or scroll. */
export function ContextMenu({ menu, onClose }: { menu: MenuState; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useLayoutEffect(() => {
    if (!menu || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos({ x: Math.min(menu.x, window.innerWidth - r.width - 8), y: Math.min(menu.y, window.innerHeight - r.height - 8) })
  }, [menu])
  useEffect(() => {
    if (!menu) return
    const close = (e: Event) => { if (!(e.target instanceof Node && ref.current?.contains(e.target))) onClose() }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('pointerdown', close, true)
    window.addEventListener('keydown', key)
    window.addEventListener('scroll', onClose, true)
    return () => { window.removeEventListener('pointerdown', close, true); window.removeEventListener('keydown', key); window.removeEventListener('scroll', onClose, true) }
  }, [menu, onClose])
  if (!menu) return null
  return <div ref={ref} className={d.menu} style={{ left: pos.x, top: pos.y }} role="menu" onContextMenu={e => e.preventDefault()}>
    {menu.items.map((it, i) => it.divider ? <hr key={i} /> : <button key={i} role="menuitem" disabled={it.disabled} className={`${it.danger ? d.menuDanger : ''} ${it.checked ? d.menuChecked : ''}`} onClick={() => { onClose(); it.onClick?.() }}>
      {it.icon && <it.icon size={16} />}<span>{it.label}</span>{it.shortcut && <kbd>{it.shortcut}</kbd>}
    </button>)}
  </div>
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onClose])
  return <div className={d.backdrop} onPointerDown={e => { if (e.target === e.currentTarget) onClose() }}>
    <div className={`${d.dialog} ${wide ? d.dialogWide : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className={d.dialogHead}><h2>{title}</h2><button className={d.iconBtn} onClick={onClose} aria-label="Fechar"><X size={18} /></button></div>
      {children}
    </div>
  </div>
}

export function NameDialog({ title, initial, confirm, onSubmit, onClose }: { title: string; initial: string; confirm: string; onSubmit: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState(initial)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    // Select the name without the extension, like Drive.
    const dot = initial.lastIndexOf('.')
    el.setSelectionRange(0, dot > 0 ? dot : initial.length)
  }, [initial])
  const ok = name.trim().length > 0
  return <Modal title={title} onClose={onClose}>
    <form onSubmit={e => { e.preventDefault(); if (ok) { onSubmit(name.trim()); onClose() } }}>
      <input ref={ref} className={d.input} value={name} onChange={e => setName(e.target.value)} aria-label="Nome" />
      <div className={d.dialogActions}><button type="button" className={d.btn} onClick={onClose}>Cancelar</button><button className={d.btnPrimary} disabled={!ok}>{confirm}</button></div>
    </form>
  </Modal>
}

export function ConfirmDialog({ title, text, confirm, danger, onConfirm, onClose }: { title: string; text: string; confirm: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return <Modal title={title} onClose={onClose}>
    <p className={d.dialogText}>{text}</p>
    <div className={d.dialogActions}><button className={d.btn} onClick={onClose}>Cancelar</button><button className={danger ? d.btnDanger : d.btnPrimary} onClick={() => { onConfirm(); onClose() }} autoFocus>{confirm}</button></div>
  </Modal>
}

/** Pick a space root or folder. Folders being moved (and what is inside them) can't be picked. */
export function MoveDialog({ drive, count, blocked, onMove, onClose }: { drive: Drive; count: number; blocked: string[]; onMove: (spaceId: string, folderId: string | null) => void; onClose: () => void }) {
  const [target, setTarget] = useState<{ spaceId: string; folderId: string | null } | null>(null)
  const [open, setOpen] = useState<Set<string>>(new Set(drive.spaces.map(s => s.id)))
  const block = new Set(blocked.flatMap(id => descendants(drive, id)))
  const toggle = (k: string) => setOpen(o => { const n = new Set(o); if (n.has(k)) n.delete(k); else n.add(k); return n })
  const branch = (spaceId: string, parentId: string | null, depth: number): React.ReactNode =>
    childFolders(drive, spaceId, parentId).filter(f => !block.has(f.id)).map(f => {
      const kids = childFolders(drive, spaceId, f.id).filter(x => !block.has(x.id)).length > 0
      const on = target?.folderId === f.id
      return <div key={f.id}>
        <div className={`${d.treeRow} ${on ? d.treeOn : ''}`} style={{ paddingLeft: 10 + depth * 18 }} onClick={() => setTarget({ spaceId, folderId: f.id })} onDoubleClick={() => toggle(f.id)}>
          <button className={`${d.treeCaret} ${open.has(f.id) ? d.treeOpen : ''}`} onClick={e => { e.stopPropagation(); toggle(f.id) }} style={{ visibility: kids ? 'visible' : 'hidden' }} aria-label="Expandir"><ChevronRight size={14} /></button>
          <Folder size={16} />{f.name}
        </div>
        {open.has(f.id) && branch(spaceId, f.id, depth + 1)}
      </div>
    })
  return <Modal title={`Mover ${count} ${count === 1 ? 'item' : 'itens'}`} onClose={onClose} wide>
    <div className={d.tree}>{drive.spaces.map(s => <div key={s.id}>
      <div className={`${d.treeRow} ${d.treeSpace} ${target && target.spaceId === s.id && !target.folderId ? d.treeOn : ''}`} onClick={() => setTarget({ spaceId: s.id, folderId: null })}>
        <button className={`${d.treeCaret} ${open.has(s.id) ? d.treeOpen : ''}`} onClick={e => { e.stopPropagation(); toggle(s.id) }} aria-label="Expandir"><ChevronRight size={14} /></button>
        <FolderClosed size={16} />{s.name}
      </div>
      {open.has(s.id) && branch(s.id, null, 1)}
    </div>)}</div>
    <div className={d.dialogActions}><button className={d.btn} onClick={onClose}>Cancelar</button><button className={d.btnPrimary} disabled={!target} onClick={() => { if (target) { onMove(target.spaceId, target.folderId); onClose() } }}>Mover aqui</button></div>
  </Modal>
}
