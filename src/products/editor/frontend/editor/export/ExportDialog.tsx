'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, CheckCircle2, Download, FolderOpen, RotateCcw, Send, X } from 'lucide-react'
import { formatDuration, formatSize } from '@/products/editor/frontend/lib/format'
import { useDriveState } from '@/products/drive/frontend/hooks'
import { childFolders, createFolder, getDriveState, uploadFiles } from '@/products/drive/frontend/store'
import { projectDuration } from '../project/ops'
import { FPS, type Project } from '../project/types'
import { downloadBlob, estimateBytes, exportBlocker, exportProject, fileName, outputSize, type ExportSettings, type Quality, type Resolution } from './render'
import x from './export.module.css'

const PREFS = 'otto-editor-export-v1'
const FOLDER = 'Exportados'
type Prefs = { resolution: Resolution; quality: Quality; saveToDrive: boolean; driveId: string | null }
const defaults: Prefs = { resolution: '1080p', quality: 'recomendada', saveToDrive: true, driveId: null }
function readPrefs(): Prefs {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(PREFS) ?? '{}') } } catch { return defaults }
}

type Stage =
  | { kind: 'config' }
  | { kind: 'running'; progress: number; secondsLeft: number | null; step: 'preparando' | 'gerando' | 'salvando' }
  | { kind: 'done'; name: string; size: number; fileId?: string; folderId?: string | null; driveName?: string; saveError?: boolean }
  | { kind: 'error'; message: string }

/**
 * Export, CapCut style: settings, then a 0–100% count while the video is made in this browser, then the
 * download starts by itself (and the file is saved to the Drive when asked).
 */
export function ExportDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const driveState = useDriveState()
  const [prefs, setPrefs] = useState<Prefs>(readPrefs)
  const [name, setName] = useState(project.name || 'Vídeo')
  const [stage, setStage] = useState<Stage>({ kind: 'config' })
  const [blocker, setBlocker] = useState<string | null>(null)
  const abort = useRef<AbortController | null>(null)
  const preview = useRef<HTMLCanvasElement>(null)

  // The drive it goes to: the last one chosen, else the one the project's first file is in, else the first.
  const firstFileDrive = useMemo(() => {
    const id = project.tracks.flatMap(t => t.clips).map(c => c.props.fileId).find(Boolean)
    return driveState.files.find(f => f.id === id)?.driveId
  }, [project, driveState.files])
  const driveId = (prefs.driveId && driveState.drives.some(s => s.id === prefs.driveId) ? prefs.driveId : null) ?? firstFileDrive ?? driveState.drives[0]?.id ?? null

  const update = (p: Partial<Prefs>) => setPrefs(cur => {
    const next = { ...cur, ...p }
    try { localStorage.setItem(PREFS, JSON.stringify(next)) } catch { /* only a convenience */ }
    return next
  })

  useEffect(() => {
    let gone = false
    void exportBlocker(project, prefs.resolution).then(b => { if (!gone) setBlocker(b) })
    return () => { gone = true }
  }, [project, prefs.resolution])

  // Closing the tab mid-export loses the video: the browser asks first.
  const running = stage.kind === 'running'
  useEffect(() => {
    if (!running) return
    const warn = (ev: BeforeUnloadEvent) => { ev.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [running])
  useEffect(() => () => abort.current?.abort(), [])

  const { outWidth, outHeight } = outputSize(project, prefs.resolution)
  const seconds = projectDuration(project) / FPS

  const start = async () => {
    const settings: ExportSettings = { name, resolution: prefs.resolution, quality: prefs.quality }
    const ctrl = new AbortController()
    abort.current = ctrl
    setStage({ kind: 'running', progress: 0, secondsLeft: null, step: 'preparando' })
    let blob: Blob
    try {
      blob = await exportProject(project, settings, {
        signal: ctrl.signal,
        onProgress: p => setStage(s => s.kind === 'running' ? { ...s, step: 'gerando', progress: p.progress, secondsLeft: p.secondsLeft } : s),
        onPreview: bitmap => {
          const c = preview.current?.getContext('2d')
          if (c && preview.current) c.drawImage(bitmap, 0, 0, preview.current.width, preview.current.height)
          bitmap.close()
        },
      })
    } catch (e) {
      if (ctrl.signal.aborted) { setStage({ kind: 'config' }); return }
      console.error('exportar: falhou', e)
      setStage({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
      return
    }
    const file = fileName(name)
    downloadBlob(blob, file)
    if (!prefs.saveToDrive || !driveId) { setStage({ kind: 'done', name: file, size: blob.size }); return }
    setStage(s => s.kind === 'running' ? { ...s, step: 'salvando', progress: 1, secondsLeft: null } : s)
    try {
      const folderId = childFolders(getDriveState(), driveId, null).find(f => f.name === FOLDER && !f.trashedAt)?.id ?? createFolder(driveId, null, FOLDER)
      const [fileId] = await uploadFiles([new File([blob], file, { type: 'video/mp4' })], driveId, folderId)
      setStage({ kind: 'done', name: file, size: blob.size, fileId, folderId, driveName: driveState.drives.find(s => s.id === driveId)?.name })
    } catch (e) {
      console.error('exportar: não salvou no Drive', e)
      setStage({ kind: 'done', name: file, size: blob.size, saveError: true })
    }
  }

  const close = () => { if (!running) onClose() }

  return <div className={x.backdrop} onPointerDown={ev => { if (ev.target === ev.currentTarget) close() }}>
    <div className={x.dialog} role="dialog" aria-modal="true" aria-label="Exportar vídeo">
      {!running && <button className={x.close} onClick={close} aria-label="Fechar"><X size={18} /></button>}

      {stage.kind === 'config' && <>
        <h2>Exportar</h2>
        <div className={x.summary}>
          <span className={x.thumb} style={{ aspectRatio: `${outWidth} / ${outHeight}`, background: project.background }} />
          <span><b>{project.format}</b><small>{formatDuration(seconds)} · {outWidth}×{outHeight} · 30 fps</small></span>
        </div>
        <label className={x.field}>Nome<input value={name} onChange={e => setName(e.target.value)} maxLength={80} /></label>
        <div className={x.field}>Resolução
          <div className={x.seg}>{(['720p', '1080p'] as Resolution[]).map(r => <button key={r} className={prefs.resolution === r ? x.segOn : ''} onClick={() => update({ resolution: r })}>{r}</button>)}</div>
        </div>
        <div className={x.field}>Qualidade
          <div className={x.seg}>{([['menor', 'Menor arquivo'], ['recomendada', 'Recomendada'], ['alta', 'Alta']] as [Quality, string][]).map(([q, label]) => <button key={q} className={prefs.quality === q ? x.segOn : ''} onClick={() => update({ quality: q })}>{label}</button>)}</div>
        </div>
        <div className={x.row}><span>Taxa de quadros</span><b>30 fps</b></div>
        <div className={x.row}><span>Formato</span><b>MP4 (H.264)</b></div>
        <label className={x.toggleRow}>
          <input type="checkbox" checked={prefs.saveToDrive} onChange={e => update({ saveToDrive: e.target.checked })} />
          <span>Salvar também no Drive</span>
          {prefs.saveToDrive && driveState.drives.length > 0 && <select value={driveId ?? ''} onChange={e => update({ driveId: e.target.value })} aria-label="Drive">
            {driveState.drives.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>}
        </label>
        {prefs.saveToDrive && <p className={x.hint}>Vai para a pasta “{FOLDER}”, pronto para postar.</p>}
        {blocker && <p className={x.blocker}><AlertTriangle size={15} />{blocker}</p>}
        <footer className={x.footer}>
          <span className={x.estimate}>Tamanho estimado: <b>{formatSize(estimateBytes(project, prefs))}</b></span>
          <button className={x.primary} onClick={() => void start()} disabled={!!blocker || !name.trim()}><Download size={16} />Exportar</button>
        </footer>
      </>}

      {stage.kind === 'running' && <div className={x.running}>
        <canvas ref={preview} className={x.preview} width={240} height={Math.round(240 * outHeight / outWidth)} style={{ background: project.background }} />
        <div className={x.percent}>{Math.floor(stage.progress * 100)}%</div>
        <div className={x.bar}><i style={{ width: `${stage.progress * 100}%` }} /></div>
        <p className={x.status}>
          {stage.step === 'preparando' ? 'Preparando os arquivos…'
            : stage.step === 'salvando' ? 'Salvando no Drive…'
            : stage.secondsLeft ? `Gerando o vídeo · falta ${stage.secondsLeft < 60 ? `${stage.secondsLeft} s` : `cerca de ${Math.ceil(stage.secondsLeft / 60)} min`}` : 'Gerando o vídeo…'}
        </p>
        <p className={x.hint}>Mantenha esta aba aberta até terminar.</p>
        {stage.step !== 'salvando' && <button className={x.secondary} onClick={() => abort.current?.abort()}>Cancelar</button>}
      </div>}

      {stage.kind === 'done' && <div className={x.running}>
        <CheckCircle2 size={44} className={x.ok} />
        <h2>Pronto!</h2>
        <p className={x.status}>{stage.name} · {formatSize(stage.size)}. O download começou.</p>
        {stage.fileId && <p className={x.hint}>Salvo em {stage.driveName ?? 'Drive'} / {FOLDER}.</p>}
        {stage.saveError && <p className={x.blocker}><AlertTriangle size={15} />O download funcionou, mas não deu para salvar no Drive. Você pode enviar o arquivo por lá.</p>}
        <div className={x.doneActions}>
          {stage.fileId && <Link className={x.primary} href={`/marketing/postar?arquivos=${stage.fileId}`}><Send size={15} />Postar agora</Link>}
          {stage.folderId && <Link className={x.secondary} href={`/drive/pastas/${stage.folderId}`}><FolderOpen size={15} />Ver no Drive</Link>}
          <button className={x.secondary} onClick={() => setStage({ kind: 'config' })}><RotateCcw size={15} />Exportar de novo</button>
        </div>
      </div>}

      {stage.kind === 'error' && <div className={x.running}>
        <AlertTriangle size={40} className={x.warn} />
        <h2>Não deu para exportar</h2>
        <p className={x.status}>Algo falhou ao gerar o vídeo. Tente de novo; se continuar, exporte em 720p ou use o Google Chrome.</p>
        <details className={x.details}><summary>Detalhes</summary><code>{stage.message}</code></details>
        <div className={x.doneActions}><button className={x.primary} onClick={() => setStage({ kind: 'config' })}><Check size={15} />Voltar</button></div>
      </div>}
    </div>
  </div>
}
