'use client'

// Everything you can do to files and folders, shared by the explorer, Recentes, Favoritos and Lixeira.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Clapperboard, Copy, Download, Eye, FolderInput, FolderOpen, FolderPlus, FolderUp, Pencil, RotateCcw, Send, Star, StarOff, Trash2, Upload } from 'lucide-react'
import { downloadBlob } from '../blobs'
import { downloadObject, onRemoteError } from '../remote'
import { notify } from '@/products/editor/frontend/lib/notify'
import { newProjectId } from '@/products/editor/frontend/editor/project/store'
import { createFolder, deleteForever, remoteDrive, duplicateFiles, emptyTrash, getDriveState, isFavorite, markOpened, moveItems, rename, restoreItems, setFavorite, trashItems, uploadFiles, type DFile, type Item } from '../store'
import { useDriveState } from '../hooks'
import { ConfirmDialog, ContextMenu, MoveDialog, NameDialog, type MenuItem, type MenuState } from './ui'
import { Viewer } from './Viewer'
import d from './drive.module.css'

type Dialog =
  | { kind: 'name'; title: string; initial: string; confirm: string; submit: (name: string) => void }
  | { kind: 'confirm'; title: string; text: string; confirm: string; danger?: boolean; run: () => void }
  | { kind: 'move'; items: Item[] }
  | null

const files = (items: Item[]) => items.flatMap(i => i.type === 'file' ? [i.file] : [])
const label = (items: Item[]) => items.length === 1 ? `“${items[0].type === 'file' ? items[0].file.name : items[0].folder.name}”` : `${items.length} itens`

/** `where` is the folder on screen: uploads go there unless a menu picked another target. */
export function useDriveActions(where?: { driveId: string; folderId: string | null }) {
  const router = useRouter()
  const driveState = useDriveState()
  const [menu, setMenu] = useState<MenuState>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [viewer, setViewer] = useState<{ files: DFile[]; index: number } | null>(null)
  const [toast, setToast] = useState('')
  const [uploading, setUploading] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const uploadTarget = useRef<{ driveId: string; folderId: string | null }>({ driveId: '', folderId: null })

  useEffect(() => onRemoteError(() => setToast('Não foi possível salvar a última mudança. Atualizando a lista…')), [])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2800); return () => clearTimeout(t) }, [toast])
  // webkitdirectory isn't in React's input props.
  useEffect(() => { folderInput.current?.setAttribute('webkitdirectory', '') }, [])
  useEffect(() => { if (where) uploadTarget.current = where }, [where?.driveId, where?.folderId]) // eslint-disable-line react-hooks/exhaustive-deps

  const upload = useCallback(async (list: File[], driveId: string, folderId: string | null) => {
    if (!list.length) return
    setUploading(n => n + list.length)
    try {
      const ids = await uploadFiles(list, driveId, folderId)
      setToast(`${ids.length} ${ids.length === 1 ? 'arquivo enviado' : 'arquivos enviados'}.`)
      notify({ kind: 'arquivos', title: `${ids.length} ${ids.length === 1 ? 'arquivo enviado' : 'arquivos enviados'}`, text: list.slice(0, 3).map(f => f.name).join(', ') + (list.length > 3 ? '…' : ''), href: folderId ? `/drive/pastas/${folderId}` : `/drive/${driveId}`, action: 'Abrir pasta' })
    } catch {
      setToast(remoteDrive ? 'Não foi possível enviar. Confira sua conexão e tente de novo.' : 'Não foi possível enviar. O navegador pode estar sem espaço.')
    } finally { setUploading(n => Math.max(0, n - list.length)) }
  }, [])

  const pickFiles = (driveId: string, folderId: string | null, folderMode = false) => {
    uploadTarget.current = { driveId, folderId }
    ;(folderMode ? folderInput : fileInput).current?.click()
  }

  const open = useCallback((item: Item, siblings?: DFile[]) => {
    markOpened(item)
    if (item.type === 'folder') return router.push(`/drive/pastas/${item.folder.id}`)
    const list = siblings?.length ? siblings : [item.file]
    setViewer({ files: list, index: Math.max(0, list.findIndex(f => f.id === item.file.id)) })
  }, [router])

  const download = async (list: DFile[]) => {
    let got = 0
    for (const f of list) if (f.uploaded && await (remoteDrive ? !!f.storagePath && downloadObject(f.storagePath, f.name) : downloadBlob(f.id, f.name))) got++
    setToast(got ? `Baixando ${got} ${got === 1 ? 'arquivo' : 'arquivos'}.` : 'Arquivos de exemplo não têm conteúdo para baixar.')
  }
  const post = (list: DFile[]) => { const ok = list.filter(f => f.kind === 'video' || f.kind === 'image'); if (ok.length) router.push(`/marketing/postar?arquivos=${ok.map(f => f.id).join(',')}`) }
  const edit = (list: DFile[]) => { const ok = list.filter(f => f.kind !== 'text'); if (ok.length) router.push(`/editor/${newProjectId()}?arquivos=${ok.map(f => f.id).join(',')}`) }
  const trash = (items: Item[]) => { trashItems(items); setToast(`${label(items)} ${items.length === 1 ? 'foi para' : 'foram para'} a lixeira.`) }
  const favorite = (items: Item[]) => { const on = !items.every(isFavorite); setFavorite(items, on); setToast(on ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.') }

  const newFolder = (driveId: string, parentId: string | null) => setDialog({ kind: 'name', title: 'Nova pasta', initial: 'Pasta sem título', confirm: 'Criar', submit: name => createFolder(driveId, parentId, name) })
  const renameItem = (item: Item) => setDialog({ kind: 'name', title: 'Renomear', initial: item.type === 'file' ? item.file.name : item.folder.name, confirm: 'Salvar', submit: name => rename(item, name) })
  const move = (items: Item[]) => setDialog({ kind: 'move', items })
  const destroy = (items: Item[]) => setDialog({ kind: 'confirm', title: 'Excluir para sempre?', text: `${label(items)} ${items.length === 1 ? 'será excluído' : 'serão excluídos'} para sempre. Não dá para desfazer.`, confirm: 'Excluir para sempre', danger: true, run: () => deleteForever(items) })
  const clearTrash = () => setDialog({ kind: 'confirm', title: 'Esvaziar a lixeira?', text: 'Todos os itens da lixeira serão excluídos para sempre. Não dá para desfazer.', confirm: 'Esvaziar lixeira', danger: true, run: emptyTrash })

  /** Menu for one or more items (right-click or ⋮). In the trash only restore and delete apply. */
  const itemMenu = (items: Item[], opts: { trash?: boolean; siblings?: DFile[] } = {}): MenuItem[] => {
    if (opts.trash) return [
      { label: 'Restaurar', icon: RotateCcw, onClick: () => { restoreItems(items); setToast('Restaurado.') } },
      { label: 'Excluir para sempre', icon: Trash2, danger: true, onClick: () => destroy(items) },
    ]
    const one = items.length === 1 ? items[0] : null
    const fs = files(items)
    const fav = items.every(isFavorite)
    return [
      ...(one ? [{ label: 'Abrir', icon: one.type === 'folder' ? FolderOpen : Eye, onClick: () => open(one, opts.siblings), shortcut: 'Enter' }] : []),
      ...(fs.length && fs.length === items.length && fs.some(f => f.kind === 'video' || f.kind === 'image') ? [{ label: fs.length > 1 ? `Postar ${fs.length} arquivos` : 'Postar', icon: Send, onClick: () => post(fs) }] : []),
      ...(fs.length && fs.length === items.length && fs.some(f => f.kind !== 'text') ? [{ label: 'Abrir no editor', icon: Clapperboard, onClick: () => edit(fs) }] : []),
      { label: '', divider: true },
      ...(one ? [{ label: 'Renomear', icon: Pencil, onClick: () => renameItem(one), shortcut: 'F2' }] : []),
      { label: 'Mover para…', icon: FolderInput, onClick: () => move(items) },
      ...(fs.length === items.length ? [{ label: 'Fazer uma cópia', icon: Copy, onClick: () => { const ids = duplicateFiles(fs.map(f => f.id)); setToast(`${ids.length} ${ids.length === 1 ? 'cópia criada' : 'cópias criadas'}.`) } }] : []),
      ...(fs.length === items.length ? [{ label: 'Baixar', icon: Download, onClick: () => download(fs) }] : []),
      { label: fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos', icon: fav ? StarOff : Star, onClick: () => favorite(items) },
      { label: '', divider: true },
      { label: 'Mover para a lixeira', icon: Trash2, danger: true, onClick: () => trash(items), shortcut: 'Delete' },
    ]
  }

  const backgroundMenu = (driveId: string, folderId: string | null): MenuItem[] => [
    { label: 'Nova pasta', icon: FolderPlus, onClick: () => newFolder(driveId, folderId) },
    { label: '', divider: true },
    { label: 'Enviar arquivos', icon: Upload, onClick: () => pickFiles(driveId, folderId) },
    { label: 'Enviar pasta', icon: FolderUp, onClick: () => pickFiles(driveId, folderId, true) },
  ]

  const showMenu = (ev: { clientX: number; clientY: number }, items: MenuItem[]) => setMenu({ x: ev.clientX, y: ev.clientY, items })

  const ui = <>
    <input ref={fileInput} type="file" multiple hidden onChange={e => { void upload([...(e.target.files ?? [])], uploadTarget.current.driveId, uploadTarget.current.folderId); e.target.value = '' }} />
    <input ref={folderInput} type="file" multiple hidden onChange={e => { void upload([...(e.target.files ?? [])], uploadTarget.current.driveId, uploadTarget.current.folderId); e.target.value = '' }} />
    <ContextMenu menu={menu} onClose={() => setMenu(null)} />
    {dialog?.kind === 'name' && <NameDialog title={dialog.title} initial={dialog.initial} confirm={dialog.confirm} onSubmit={dialog.submit} onClose={() => setDialog(null)} />}
    {dialog?.kind === 'confirm' && <ConfirmDialog title={dialog.title} text={dialog.text} confirm={dialog.confirm} danger={dialog.danger} onConfirm={dialog.run} onClose={() => setDialog(null)} />}
    {dialog?.kind === 'move' && <MoveDialog driveState={driveState} count={dialog.items.length} blocked={dialog.items.flatMap(i => i.type === 'folder' ? [i.folder.id] : [])}
      onMove={(driveId, folderId) => { const ok = moveItems(dialog.items, driveId, folderId); setToast(ok ? `${label(dialog.items)} ${dialog.items.length === 1 ? 'movido' : 'movidos'}.` : 'Uma pasta não pode ir para dentro dela mesma.') }} onClose={() => setDialog(null)} />}
    {viewer && <Viewer files={viewer.files} index={viewer.index} onIndex={i => setViewer(v => v && { ...v, index: Math.max(0, Math.min(v.files.length - 1, i)) })} onClose={() => setViewer(null)}
      onDownload={f => download([f])} onPost={f => post([f])} onEdit={f => edit([f])}
      onFavorite={f => favorite([{ type: 'file', file: getDriveState().files.find(x => x.id === f.id) ?? f }])}
      onTrash={f => { trash([{ type: 'file', file: f }]); setViewer(v => { if (!v) return v; const rest = v.files.filter(x => x.id !== f.id); return rest.length ? { files: rest, index: Math.min(v.index, rest.length - 1) } : null }) }} />}
    {uploading > 0 && <div className={d.toast} role="status"><span className={d.spinner} />Enviando {uploading} {uploading === 1 ? 'arquivo' : 'arquivos'}…</div>}
    {!uploading && toast && <div className={d.toast} role="status"><Check size={15} />{toast}</div>}
  </>

  return {
    ui, busy: !!(menu || dialog || viewer), showMenu, itemMenu, backgroundMenu, open, upload, pickFiles,
    newFolder, renameItem, move, trash, destroy, clearTrash, favorite, download, post, edit, setToast,
  }
}
