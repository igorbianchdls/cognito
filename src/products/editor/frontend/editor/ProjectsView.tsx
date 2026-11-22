'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Thumbnail } from '@remotion/player'
import { Plus } from 'lucide-react'
import { formatDateTime } from '@/products/editor/frontend/lib/format'
import { EditorComposition } from './remotion/Composition'
import { projectDuration } from './project/ops'
import { newProjectId, useProjects } from './project/store'
import { templates } from './project/templates'
import { FPS, canvasSize } from './project/types'
import { timecode } from './timeline/Timeline'
import s from '@/products/editor/frontend/shell/ui.module.css'
import e from './editor.module.css'

export function ProjectsView() {
  const router = useRouter()
  const projects = useProjects()
  const create = (modelo?: string) => router.push(`/editor/${newProjectId()}${modelo ? `?modelo=${modelo}` : ''}`)
  return <section className={s.content}>
    <div className={s.pageHead}><div><h1>Editor</h1><p>Monte vídeos com linha do tempo e peça edições para a IA.</p></div><button className={s.primary} onClick={() => create()}><Plus size={16} />Novo projeto</button></div>
    <h2 className={e.sectionTitle}>Começar com um modelo</h2>
    <div className={e.templateGrid}>{templates.map(t => {
      const [w, h] = t.format.split(':').map(Number)
      return <button key={t.id} className={e.templateCard} onClick={() => create(t.id === 'branco' ? undefined : t.id)}>
        <span className={e.ratio} style={{ width: w > h ? 44 : w === h ? 34 : 26, height: w > h ? 26 : w === h ? 34 : 44 }}>{t.format}</span>
        <span><b>{t.label}</b><small>{t.description}</small></span>
      </button>
    })}</div>
    <h2 className={e.sectionTitle}>Seus projetos</h2>
    <div className={e.projectGrid}>
      <button className={e.newProject} onClick={() => create()}><Plus size={22} />Novo projeto</button>
      {!projects.length && <p className={s.muted}>Nenhum projeto ainda. Comece por um modelo ou abra vídeos do Drive no editor.</p>}
      {projects.map(p => {
        const { width, height } = canvasSize[p.format]
        const d = projectDuration(p)
        return <Link key={p.id} href={`/editor/${p.id}`} className={e.projectCard}>
          <span className={e.projectThumb}>
            <Thumbnail component={EditorComposition} inputProps={{ project: p }} compositionWidth={width} compositionHeight={height} durationInFrames={d} fps={FPS} frameToDisplay={Math.min(d - 1, Math.round(FPS * 1.5))} style={{ width: '100%', height: '100%' }} />
            <i>{timecode(d).slice(0, 5)}</i>
          </span>
          <b>{p.name}</b>
          <small>{p.format} · editado em {formatDateTime(p.updatedAt)}</small>
        </Link>
      })}
    </div>
  </section>
}
