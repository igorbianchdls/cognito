'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Clapperboard, Download, Send, Star, Trash2, X } from 'lucide-react'
import { formatDateTime, formatDuration, formatSize } from '@/products/editor/frontend/lib/format'
import { folderLabel, type DFile } from '../store'
import { readText, useDrive, useFileUrl } from '../hooks'
import { Thumb } from '../Thumb'
import d from './drive.module.css'

const kindName = { video: 'Vídeo', image: 'Imagem', audio: 'Áudio', text: 'Texto' }

type Props = {
  files: DFile[]; index: number; onIndex: (i: number) => void; onClose: () => void
  onDownload: (f: DFile) => void; onPost: (f: DFile) => void; onEdit: (f: DFile) => void; onFavorite: (f: DFile) => void; onTrash: (f: DFile) => void
}

/** Full-screen preview with arrows to browse the folder, like Drive. */
export function Viewer({ files, index, onIndex, onClose, ...act }: Props) {
  const drive = useDrive()
  const file = drive.files.find(f => f.id === files[index]?.id) ?? files[index]
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && index < files.length - 1) onIndex(index + 1)
      if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [index, files.length, onIndex, onClose])
  if (!file) return null
  const space = drive.spaces.find(s => s.id === file.spaceId)
  return <div className={d.viewer} role="dialog" aria-modal="true" aria-label={file.name}>
    <header className={d.viewerTop}>
      <button className={d.viewerBtn} onClick={onClose} aria-label="Fechar"><X size={20} /></button>
      <b>{file.name}</b>
      <span className={d.grow} />
      <button className={d.viewerBtn} onClick={() => act.onFavorite(file)} aria-label={file.favorite ? 'Remover dos favoritos' : 'Favoritar'}><Star size={18} fill={file.favorite ? 'currentColor' : 'none'} /></button>
      <button className={d.viewerBtn} onClick={() => act.onDownload(file)} aria-label="Baixar"><Download size={18} /></button>
      {file.kind !== 'text' && file.kind !== 'audio' && <button className={d.viewerBtn} onClick={() => act.onPost(file)} aria-label="Postar"><Send size={18} /></button>}
      {file.kind !== 'text' && <button className={d.viewerBtn} onClick={() => act.onEdit(file)} aria-label="Abrir no editor"><Clapperboard size={18} /></button>}
      <button className={d.viewerBtn} onClick={() => act.onTrash(file)} aria-label="Mover para a lixeira"><Trash2 size={18} /></button>
    </header>
    <div className={d.viewerBody}>
      <button className={`${d.viewerNav} ${d.viewerPrev}`} onClick={() => onIndex(index - 1)} disabled={index === 0} aria-label="Anterior"><ChevronLeft size={26} /></button>
      <div className={d.viewerStage}><Content file={file} /></div>
      <button className={`${d.viewerNav} ${d.viewerNext}`} onClick={() => onIndex(index + 1)} disabled={index >= files.length - 1} aria-label="Próximo"><ChevronRight size={26} /></button>
      <aside className={d.viewerInfo}>
        <h3>Detalhes</h3>
        <dl>
          <dt>Tipo</dt><dd>{kindName[file.kind]}</dd>
          <dt>Tamanho</dt><dd>{formatSize(file.size)}</dd>
          {file.duration !== undefined && <><dt>Duração</dt><dd>{formatDuration(file.duration)}</dd></>}
          {file.width > 0 && <><dt>Dimensões</dt><dd>{file.width}×{file.height}</dd></>}
          <dt>Local</dt><dd>{[space?.name, folderLabel(drive, file.folderId)].filter(Boolean).join(' / ')}</dd>
          <dt>Modificado</dt><dd>{formatDateTime(file.updatedAt ?? file.createdAt)}</dd>
          {file.openedAt && <><dt>Aberto</dt><dd>{formatDateTime(file.openedAt)}</dd></>}
        </dl>
        {!file.uploaded && <p className={d.note}>Arquivo de exemplo: a prévia real aparece nos arquivos que você enviar.</p>}
        <p className={d.counter}>{index + 1} de {files.length}</p>
      </aside>
    </div>
  </div>
}

function Content({ file }: { file: DFile }) {
  const url = useFileUrl(file, !!file.uploaded && file.kind !== 'text')?.url
  const [text, setText] = useState<{ id: string; text: string } | null>(null)
  useEffect(() => {
    if (!file.uploaded || file.kind !== 'text') return
    let live = true
    readText(file).then(t => { if (live && t !== undefined) setText({ id: file.id, text: t }) })
    return () => { live = false }
  }, [file])
  if (url && file.kind === 'image') return <img src={url} alt={file.name} className={d.viewerMedia} /> // eslint-disable-line @next/next/no-img-element
  if (url && file.kind === 'video') return <video src={url} controls autoPlay className={d.viewerMedia} />
  if (url && file.kind === 'audio') return <audio src={url} controls autoPlay />
  if (text?.id === file.id) return <pre className={d.viewerText}>{text.text}</pre>
  return <Thumb file={file} className={d.viewerThumb} showKind={false} />
}
