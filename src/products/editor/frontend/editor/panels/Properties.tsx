'use client'

import { AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, AlignHorizontalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignVerticalJustifyStart, BetweenHorizontalStart, ChevronLeft, ChevronRight, ClipboardCopy, Copy, Diamond, FlipHorizontal2, FlipVertical2, Group, Lock, Scissors, Trash2, Ungroup } from 'lucide-react'
import { filterPresets, media, mediaLibrary, neutralFilter, speeds } from '../project/data'
import { clearKeyframes, motionAt, removeKeyframe, setKeyframe, textAt } from '../project/keyframes'
import { clipEnd, findClip, maxDuration, mapClip, projectDuration, setSpeed, updateProps } from '../project/ops'
import { useFrame, type FrameStore } from '../project/useEditor'
import { FPS, kindLabel, visualKinds, type Box, type ClipProps, type Crop, type Filter, type Fit, type Format, type Motion, type Project, type Transition, type TransitionType, type Watermark } from '../project/types'
import { fonts } from '../remotion/animate'
import { useDrive } from '@/products/editor/frontend/spaces/hooks'
import { kindIcon, timecode } from '../timeline/Timeline'
import e from '../editor.module.css'

type Props = {
  project: Project; selectedIds: string[]; frames: FrameStore
  apply: (fn: (p: Project) => Project, key?: string) => void; seek: (frame: number) => void
  onDuplicate: () => void; onSplit: () => void; onDelete: () => void; onRipple: () => void; onCopy: () => void; onGroup: () => void; onUngroup: () => void
}

const textColors = ['#ffffff', '#111827', '#facc15', '#3b82f6', '#f43f5e', '#22c55e']
const backgrounds: (string | undefined)[] = [undefined, '#111827', '#ffffff', '#facc15', 'rgba(17,24,39,.75)']
const fills = ['#3b82f6', '#f43f5e', '#22c55e', '#facc15', '#111827', '#ffffff']
const canvasColors = ['#0b0d12', '#ffffff', '#f4f1ea', '#1e3a8a', '#7c2d12']
const transitionTypes: { id: TransitionType; label: string }[] = [{ id: 'fade', label: 'Fade' }, { id: 'deslizar', label: 'Deslizar' }, { id: 'zoom', label: 'Zoom' }, { id: 'desfoque', label: 'Desfoque' }]
const motionFields: { key: keyof Motion; label: string; min: number; max: number; step: number; show: (v: number) => string }[] = [
  { key: 'dx', label: 'Mover X', min: -100, max: 100, step: 1, show: v => `${Math.round(v)}%` },
  { key: 'dy', label: 'Mover Y', min: -100, max: 100, step: 1, show: v => `${Math.round(v)}%` },
  { key: 'scale', label: 'Escala', min: 0.1, max: 3, step: 0.05, show: v => `${Math.round(v * 100)}%` },
  { key: 'rotation', label: 'Rotação', min: -180, max: 180, step: 1, show: v => `${Math.round(v)}°` },
  { key: 'opacity', label: 'Opacidade', min: 0, max: 1, step: 0.05, show: v => `${Math.round(v * 100)}%` },
]

const aligns: { label: string; Icon: typeof Group; fn: (b: Box) => Box }[] = [
  { label: 'Alinhar à esquerda', Icon: AlignHorizontalJustifyStart, fn: b => ({ ...b, x: 0 }) },
  { label: 'Centralizar na horizontal', Icon: AlignHorizontalJustifyCenter, fn: b => ({ ...b, x: (100 - b.w) / 2 }) },
  { label: 'Alinhar à direita', Icon: AlignHorizontalJustifyEnd, fn: b => ({ ...b, x: 100 - b.w }) },
  { label: 'Alinhar no topo', Icon: AlignVerticalJustifyStart, fn: b => ({ ...b, y: 0 }) },
  { label: 'Centralizar na vertical', Icon: AlignVerticalJustifyCenter, fn: b => ({ ...b, y: (100 - b.h) / 2 }) },
  { label: 'Alinhar embaixo', Icon: AlignVerticalJustifyEnd, fn: b => ({ ...b, y: 100 - b.h }) },
]

const sec = (frames: number) => Math.round(frames / FPS * 10) / 10

export function Properties(props: Props) {
  const { project, selectedIds, apply } = props
  if (selectedIds.length > 1) return <MultiProps {...props} />
  const found = findClip(project, selectedIds[0] ?? null)
  if (!found) return <ProjectProps project={project} apply={apply} />
  return <ClipPanel {...props} found={found} />
}

function ClipPanel({ frames, apply, seek, onDuplicate, onSplit, onDelete, onRipple, found }: Props & { found: NonNullable<ReturnType<typeof findClip>> }) {
  const frame = useFrame(frames)
  const { clip, track } = found
  const p = clip.props
  const set = (patch: Partial<ClipProps>, key: string) => apply(pr => updateProps(pr, clip.id, patch), `${clip.id}:${key}`)
  const Icon = kindIcon[track.kind]
  const m = media(p.fileId)
  const isText = track.kind === 'texto' || track.kind === 'legenda'
  const isMedia = track.kind === 'video' || track.kind === 'imagem'
  const visual = visualKinds.includes(track.kind)
  return <aside className={e.props}>
    <div className={e.propsHead}><Icon size={16} /><b>{kindLabel[track.kind]}</b></div>
    {track.locked && <p className={e.lockNote}><Lock size={14} />Faixa travada. Destrave na linha do tempo para editar.</p>}
    <fieldset className={e.fieldset} disabled={track.locked}>
    {m && <div className={e.fileInfo}><b>{m.name}</b><small>{track.kind === 'imagem' ? 'Imagem' : `Trecho do arquivo ${timecode(clip.trimStart)} – ${timecode(clip.trimStart + Math.round(clip.duration * (clip.speed ?? 1)))}`}</small></div>}

    {isText && <Field label="Texto"><textarea rows={3} value={p.text ?? ''} onChange={ev => set({ text: ev.target.value }, 'text')} /></Field>}

    <div className={e.two}>
      <Field label="Início (s)"><input type="number" step={0.1} min={0} value={sec(clip.start)} onChange={ev => apply(pr => mapClip(pr, clip.id, c => ({ ...c, start: Math.max(0, Math.round(+ev.target.value * FPS)) })), `${clip.id}:start`)} /></Field>
      <Field label="Duração (s)"><input type="number" step={0.1} min={0.2} value={sec(clip.duration)} onChange={ev => apply(pr => mapClip(pr, clip.id, c => ({ ...c, duration: Math.max(5, Math.min(maxDuration(track.kind, c), Math.round(+ev.target.value * FPS))) })), `${clip.id}:dur`)} /></Field>
    </div>

    {(track.kind === 'video' || track.kind === 'audio') && <Field label="Velocidade"><div className={e.seg}>{speeds.map(s => <button key={s} className={(clip.speed ?? 1) === s ? e.segOn : ''} onClick={() => apply(pr => setSpeed(pr, clip.id, s))}>{s}x</button>)}</div></Field>}

    {isText && <Field label="Fonte"><select value={p.font ?? 'geist'} onChange={ev => set({ font: ev.target.value as ClipProps['font'] }, 'font')}>{Object.entries(fonts).map(([id, f]) => <option key={id} value={id}>{f.label}</option>)}</select></Field>}

    {track.kind === 'texto' && <>
      <Field label={`Tamanho · ${p.fontSize ?? 64}`}><input type="range" min={24} max={180} value={p.fontSize ?? 64} onChange={ev => set({ fontSize: +ev.target.value }, 'size')} /></Field>
      <div className={e.two}>
        <Field label="Peso"><select value={p.weight ?? 800} onChange={ev => set({ weight: +ev.target.value as 400 | 600 | 800 }, 'weight')}><option value={400}>Normal</option><option value={600}>Médio</option><option value={800}>Negrito</option></select></Field>
        <Field label="Animação do texto"><select value={p.anim ?? 'nenhuma'} onChange={ev => set({ anim: ev.target.value as ClipProps['anim'] }, 'anim')}><option value="pop">Pop</option><option value="surgir">Surgir</option><option value="digitar">Digitando</option><option value="nenhuma">Nenhuma</option></select></Field>
      </div>
      <Field label="Alinhamento"><div className={e.seg}>{(['left', 'center', 'right'] as const).map(a => <button key={a} className={(p.align ?? 'center') === a ? e.segOn : ''} onClick={() => set({ align: a }, 'align')}>{a === 'left' ? 'Esquerda' : a === 'center' ? 'Centro' : 'Direita'}</button>)}</div></Field>
      <Field label="Cor do texto"><Swatches colors={textColors} value={p.color} onPick={c => set({ color: c }, 'color')} /></Field>
      <Field label="Fundo"><Swatches colors={backgrounds} value={p.bg} onPick={c => set({ bg: c }, 'bg')} /></Field>
      <Field label={`Contorno · ${p.stroke?.width ?? 0}px`}><input type="range" min={0} max={16} value={p.stroke?.width ?? 0} onChange={ev => set({ stroke: { color: p.stroke?.color ?? '#111827', width: +ev.target.value } }, 'strokew')} /></Field>
      {(p.stroke?.width ?? 0) > 0 && <Field label="Cor do contorno"><Swatches colors={textColors} value={p.stroke?.color} onPick={c => set({ stroke: { width: p.stroke?.width ?? 4, color: c ?? '#111827' } }, 'strokec')} /></Field>}
      <Field label={`Sombra · ${Math.round((p.shadow ?? (p.bg ? 0 : 0.45)) * 100)}%`}><input type="range" min={0} max={100} value={Math.round((p.shadow ?? (p.bg ? 0 : 0.45)) * 100)} onChange={ev => set({ shadow: +ev.target.value / 100 }, 'shadow')} /></Field>
    </>}

    {track.kind === 'legenda' && <Field label="Estilo"><div className={e.seg}>{(['amarela', 'branca', 'caixa'] as const).map(s => <button key={s} className={(p.captionStyle ?? 'amarela') === s ? e.segOn : ''} onClick={() => set({ captionStyle: s }, 'cap')}>{s[0].toUpperCase() + s.slice(1)}</button>)}</div></Field>}

    {track.kind === 'forma' && <>
      <Field label="Forma"><div className={e.seg}>{(['retangulo', 'circulo', 'progresso'] as const).map(s => <button key={s} className={(p.shape ?? 'retangulo') === s ? e.segOn : ''} onClick={() => set({ shape: s }, 'shape')}>{s === 'retangulo' ? 'Retângulo' : s === 'circulo' ? 'Círculo' : 'Progresso'}</button>)}</div></Field>
      <Field label="Cor"><Swatches colors={fills} value={p.bg} onPick={c => set({ bg: c }, 'fill')} /></Field>
      {p.shape === 'retangulo' && <Field label={`Cantos · ${p.radius ?? 0}`}><input type="range" min={0} max={120} value={p.radius ?? 0} onChange={ev => set({ radius: +ev.target.value }, 'radius')} /></Field>}
    </>}

    {(track.kind === 'video' || track.kind === 'audio') && <>
      <Field label={`Volume · ${Math.round((p.volume ?? 1) * 100)}%`}><input type="range" min={0} max={100} value={Math.round((p.volume ?? 1) * 100)} onChange={ev => set({ volume: +ev.target.value / 100 }, 'volume')} /></Field>
      <div className={e.two}>
        <Field label={`Som entra · ${sec(p.fadeIn ?? 0)} s`}><input type="range" min={0} max={Math.min(150, Math.floor(clip.duration / 2))} value={p.fadeIn ?? 0} onChange={ev => set({ fadeIn: +ev.target.value }, 'fadein')} /></Field>
        <Field label={`Som sai · ${sec(p.fadeOut ?? 0)} s`}><input type="range" min={0} max={Math.min(150, Math.floor(clip.duration / 2))} value={p.fadeOut ?? 0} onChange={ev => set({ fadeOut: +ev.target.value }, 'fadeout')} /></Field>
      </div>
    </>}

    {isMedia && <FrameSection fit={p.fit} crop={p.crop} flipX={p.flipX} flipY={p.flipY} onChange={(patch, key) => set(patch, key)} />}
    {isMedia && <FilterSection filter={p.filter} onChange={(f, key) => set({ filter: f }, key)} />}

    {visual && <TransitionSection transIn={p.transIn} transOut={p.transOut} max={clip.duration} onChange={(patch, key) => set(patch, key)} />}

    {visual && <MotionSection clipId={clip.id} start={clip.start} duration={clip.duration} frame={frame} keyframes={p.keyframes} apply={apply} seek={seek} text={track.kind === 'texto' ? { color: p.color ?? '#ffffff', fontSize: p.fontSize ?? 64 } : undefined} />}

    {p.box && <Section title="Posição e tamanho (%)" extra={<span className={e.alignRow}>{aligns.map(a => <button key={a.label} onClick={() => set({ box: a.fn(p.box!) }, 'align')} title={a.label} aria-label={a.label}><a.Icon size={14} /></button>)}</span>}><div className={e.four}>{(['x', 'y', 'w', 'h'] as const).map(k => <label key={k}><span>{k === 'w' ? 'L' : k === 'h' ? 'A' : k.toUpperCase()}</span><input type="number" step={1} value={p.box![k]} onChange={ev => set({ box: { ...p.box!, [k]: +ev.target.value } as Box }, `box${k}`)} /></label>)}</div></Section>}

    <div className={e.actions}>
      <button className={e.action} onClick={onSplit}><Scissors size={15} />Dividir</button>
      <button className={e.action} onClick={onDuplicate}><Copy size={15} />Duplicar</button>
      <button className={`${e.action} ${e.danger}`} onClick={onDelete}><Trash2 size={15} />Excluir</button>
    </div>
    <button className={e.wideAction} onClick={onRipple}><BetweenHorizontalStart size={15} />Excluir e fechar o buraco</button>
    </fieldset>
    <p className={e.hint}>Na linha do tempo: de {timecode(clip.start)} até {timecode(clipEnd(clip))}</p>
  </aside>
}

const fits: { id: Fit; label: string }[] = [{ id: 'preencher', label: 'Preencher' }, { id: 'ajustar', label: 'Ajustar' }, { id: 'desfoque', label: 'Fundo desfocado' }]
const noCrop: Crop = { t: 0, r: 0, b: 0, l: 0 }

function FrameSection({ fit, crop, flipX, flipY, onChange }: { fit?: Fit; crop?: Crop; flipX?: boolean; flipY?: boolean; onChange: (patch: Partial<ClipProps>, key: string) => void }) {
  const c = crop ?? noCrop
  return <Section title="Enquadramento">
    <Field label="Encaixe"><div className={e.seg}>{fits.map(f => <button key={f.id} className={(fit ?? 'preencher') === f.id ? e.segOn : ''} onClick={() => onChange({ fit: f.id }, 'fit')}>{f.label}</button>)}</div></Field>
    <Field label="Recortar (%)"><div className={e.four}>{(['t', 'r', 'b', 'l'] as const).map(k => <label key={k}><span>{{ t: '↑', r: '→', b: '↓', l: '←' }[k]}</span><input type="number" min={0} max={45} step={1} value={c[k]} onChange={ev => onChange({ crop: { ...c, [k]: Math.max(0, Math.min(45, +ev.target.value)) } }, `crop${k}`)} /></label>)}</div></Field>
    <div className={e.two}>
      <button className={`${e.toggleBtn} ${flipX ? e.toggleOn : ''}`} onClick={() => onChange({ flipX: !flipX }, 'flipx')} aria-pressed={!!flipX}><FlipHorizontal2 size={15} />Espelhar</button>
      <button className={`${e.toggleBtn} ${flipY ? e.toggleOn : ''}`} onClick={() => onChange({ flipY: !flipY }, 'flipy')} aria-pressed={!!flipY}><FlipVertical2 size={15} />Virar</button>
    </div>
  </Section>
}

function FilterSection({ filter, onChange }: { filter?: Filter; onChange: (f: Filter | undefined, key: string) => void }) {
  const f = filter ?? neutralFilter
  const slider = (key: 'brightness' | 'contrast' | 'saturation', label: string) =>
    <Field label={`${label} · ${Math.round(f[key] * 100)}%`}><input type="range" min={0} max={200} value={Math.round(f[key] * 100)} onChange={ev => onChange({ ...f, preset: undefined, [key]: +ev.target.value / 100 }, `f-${key}`)} /></Field>
  return <Section title="Filtro">
    <div className={e.filterGrid}>{filterPresets.map(fp => <button key={fp.id} className={(filter?.preset ?? (filter ? '' : 'nenhum')) === fp.id ? e.segOn : ''} onClick={() => onChange(fp.filter, 'fpreset')}>{fp.label}</button>)}</div>
    {slider('brightness', 'Brilho')}{slider('contrast', 'Contraste')}{slider('saturation', 'Saturação')}
  </Section>
}

function TransitionSection({ transIn, transOut, max, onChange }: { transIn?: Transition; transOut?: Transition; max: number; onChange: (patch: Partial<ClipProps>, key: string) => void }) {
  const row = (which: 'transIn' | 'transOut', label: string, t?: Transition) => <div className={e.transRow}>
    <Field label={label}><select value={t?.type ?? ''} onChange={ev => onChange({ [which]: ev.target.value ? { type: ev.target.value as TransitionType, frames: t?.frames ?? 12 } : undefined }, which)}>
      <option value="">Nenhuma</option>{transitionTypes.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
    </select></Field>
    {t && <Field label={`Duração · ${sec(t.frames)} s`}><input type="range" min={3} max={Math.max(6, Math.min(45, Math.floor(max / 2)))} value={t.frames} onChange={ev => onChange({ [which]: { ...t, frames: +ev.target.value } }, `${which}-f`)} /></Field>}
  </div>
  return <Section title="Transições">{row('transIn', 'Entrada', transIn)}{row('transOut', 'Saída', transOut)}</Section>
}

/** Sliders show the motion at the playhead; moving one writes a keyframe there, like in CapCut. */
function MotionSection({ clipId, start, duration, frame, keyframes, apply, seek, text }: { clipId: string; start: number; duration: number; frame: number; keyframes?: ClipProps['keyframes']; apply: Props['apply']; seek: (f: number) => void; text?: { color: string; fontSize: number } }) {
  const rel = frame - start
  const inside = rel >= 0 && rel < duration
  const m = motionAt(keyframes, Math.max(0, Math.min(duration - 1, rel)))
  const list = keyframes ?? []
  const onKey = list.some(k => k.frame === rel)
  const prev = [...list].reverse().find(k => k.frame < rel), next = list.find(k => k.frame > rel)
  return <Section title="Movimento (keyframes)" extra={<span className={e.kfNav}>
    <button onClick={() => prev && seek(start + prev.frame)} disabled={!prev} aria-label="Keyframe anterior"><ChevronLeft size={14} /></button>
    <button className={onKey ? e.kfOn : ''} disabled={!inside} onClick={() => apply(p => onKey ? removeKeyframe(p, clipId, rel) : setKeyframe(p, clipId, rel, {}))} aria-label={onKey ? 'Remover keyframe' : 'Adicionar keyframe'} title={onKey ? 'Remover keyframe' : 'Adicionar keyframe na agulha'}><Diamond size={14} /></button>
    <button onClick={() => next && seek(start + next.frame)} disabled={!next} aria-label="Próximo keyframe"><ChevronRight size={14} /></button>
  </span>}>
    {!inside && <p className={e.hint}>Leve a agulha para dentro do clipe para animar.</p>}
    {motionFields.map(f => <Field key={f.key} label={`${f.label} · ${f.show(m[f.key])}`}>
      <input type="range" min={f.min} max={f.max} step={f.step} value={m[f.key]} disabled={!inside} onChange={ev => apply(p => setKeyframe(p, clipId, rel, { [f.key]: +ev.target.value }), `${clipId}:kf:${rel}:${f.key}`)} />
    </Field>)}
    {text && (() => {
      const keyed = textAt(keyframes, Math.max(0, Math.min(duration - 1, rel)))
      const size = Math.round(keyed.fontSize ?? text.fontSize), color = keyed.color ?? text.color
      return <>
        <Field label={`Tamanho do texto · ${size}`}><input type="range" min={24} max={220} value={size} disabled={!inside} onChange={ev => apply(p => setKeyframe(p, clipId, rel, { fontSize: +ev.target.value }), `${clipId}:kf:${rel}:fs`)} /></Field>
        <Field label="Cor do texto animada"><Swatches colors={textColors} value={color.startsWith('#') ? color : undefined} onPick={c => inside && apply(p => setKeyframe(p, clipId, rel, { color: c ?? '#ffffff' }))} /></Field>
      </>
    })()}
    <p className={e.hint}>{list.length ? `${list.length} keyframe${list.length > 1 ? 's' : ''}. Mova a agulha e mude os valores para criar outro.` : 'Mexa num controle para criar o primeiro keyframe na agulha.'}</p>
    {list.length > 0 && <button className={e.linkBtn} onClick={() => apply(p => clearKeyframes(p, clipId))}>Remover todos os keyframes</button>}
  </Section>
}

function MultiProps({ project, selectedIds, onDelete, onRipple, onCopy, onDuplicate, onGroup, onUngroup }: Props) {
  const grouped = project.tracks.some(t => t.clips.some(c => selectedIds.includes(c.id) && c.group))
  return <aside className={e.props}>
    <div className={e.propsHead}><b>{selectedIds.length} clipes selecionados</b></div>
    <p className={e.hint}>Arraste qualquer um deles para mover todos juntos. Shift ou Ctrl + clique adiciona ou tira da seleção.</p>
    <div className={e.actions}>
      <button className={e.action} onClick={onCopy}><ClipboardCopy size={15} />Copiar</button>
      <button className={e.action} onClick={onDuplicate}><Copy size={15} />Duplicar</button>
      <button className={`${e.action} ${e.danger}`} onClick={onDelete}><Trash2 size={15} />Excluir</button>
    </div>
    <button className={e.wideAction} onClick={onRipple}><BetweenHorizontalStart size={15} />Excluir e fechar o buraco</button>
    {grouped ? <button className={e.wideAction} onClick={onUngroup}><Ungroup size={15} />Desagrupar (Ctrl+Shift+G)</button>
      : <button className={e.wideAction} onClick={onGroup}><Group size={15} />Agrupar (Ctrl+G)</button>}
  </aside>
}

function ProjectProps({ project, apply }: { project: Project; apply: Props['apply'] }) {
  const clips = project.tracks.reduce((n, t) => n + t.clips.length, 0)
  return <aside className={e.props}>
    <div className={e.propsHead}><b>Projeto</b></div>
    <Field label="Nome"><input value={project.name} onChange={ev => apply(p => ({ ...p, name: ev.target.value }), 'name')} /></Field>
    <Field label="Formato"><div className={e.seg}>{(['9:16', '1:1', '16:9'] as Format[]).map(f => <button key={f} className={project.format === f ? e.segOn : ''} onClick={() => apply(p => ({ ...p, format: f }))}>{f}</button>)}</div></Field>
    <Field label="Cor de fundo"><Swatches colors={canvasColors} value={project.background} onPick={c => apply(p => ({ ...p, background: c ?? '#0b0d12' }), 'bgc')} /></Field>
    <WatermarkSection mark={project.watermark} onChange={(w, key) => apply(p => ({ ...p, watermark: w }), key)} />
    <Section title="Áudio">
      <label className={e.check}><input type="checkbox" checked={!!project.ducking?.on} onChange={ev => apply(p => ({ ...p, ducking: { level: p.ducking?.level ?? 0.3, on: ev.target.checked } }))} />Abaixar a trilha quando tiver narração</label>
      {project.ducking?.on && <Field label={`Trilha durante a fala · ${Math.round(project.ducking.level * 100)}%`}><input type="range" min={0} max={100} value={Math.round(project.ducking.level * 100)} onChange={ev => apply(p => ({ ...p, ducking: { on: true, level: +ev.target.value / 100 } }), 'duck')} /></Field>}
    </Section>
    {(project.markers?.length ?? 0) > 0 && <Section title="Marcadores"><div className={e.markerList}>{project.markers!.map(m => <span key={m}>{timecode(m)}</span>)}</div><p className={e.hint}>M marca ou desmarca na agulha. Clique duplo no marcador da régua remove.</p></Section>}
    <div className={e.stats}><span>Duração<b>{timecode(projectDuration(project))}</b></span><span>Faixas<b>{project.tracks.length}</b></span><span>Clipes<b>{clips}</b></span></div>
    <div className={e.shortcuts}>
      <b>Atalhos</b>
      <span><kbd>Espaço</kbd>Tocar / pausar</span>
      <span><kbd>← →</kbd>1 quadro (Shift: 1 s)</span>
      <span><kbd>S</kbd>Dividir na agulha · <kbd>M</kbd>Marcador</span>
      <span><kbd>Arrastar no vazio</kbd>Selecionar com caixa</span>
      <span><kbd>Delete</kbd>Excluir · <kbd>⇧ Delete</kbd>fechando o buraco</span>
      <span><kbd>⇧ clique</kbd>Selecionar vários · <kbd>Ctrl A</kbd>todos</span>
      <span><kbd>Ctrl C</kbd>Copiar · <kbd>Ctrl X</kbd>Recortar · <kbd>Ctrl V</kbd>Colar</span>
      <span><kbd>Ctrl D</kbd>Duplicar · <kbd>Ctrl G</kbd>Agrupar</span>
      <span><kbd>J</kbd>Voltar 1 s · <kbd>K</kbd>Pausar · <kbd>L</kbd>Tocar (de novo: 2x, 4x)</span>
      <span><kbd>F</kbd>Tela cheia · <kbd>Ctrl roda</kbd>Zoom da linha do tempo</span>
      <span><kbd>Ctrl Z</kbd>Desfazer · <kbd>Ctrl ⇧ Z</kbd>Refazer</span>
    </div>
    <p className={e.hint}>Clique num clipe na linha do tempo ou direto no vídeo para editar.</p>
  </aside>
}

const corners: { id: Watermark['position']; label: string }[] = [{ id: 'tl', label: '↖' }, { id: 'tr', label: '↗' }, { id: 'bl', label: '↙' }, { id: 'br', label: '↘' }]

function WatermarkSection({ mark, onChange }: { mark?: Watermark; onChange: (w: Watermark | undefined, key: string) => void }) {
  const m: Watermark = mark ?? { position: 'tr', opacity: 0.8 }
  const images = mediaLibrary(useDrive()).filter(x => x.kind === 'imagem')
  return <Section title="Marca d'água">
    <Field label="Texto"><input value={m.text ?? ''} placeholder="@otto.erp" onChange={ev => onChange({ ...m, text: ev.target.value || undefined }, 'wmtext')} /></Field>
    <Field label="Logo"><select value={m.fileId ?? ''} onChange={ev => onChange({ ...m, fileId: ev.target.value || undefined }, 'wmlogo')}><option value="">Sem logo</option>{images.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></Field>
    {(m.text || m.fileId) && <>
      <Field label="Canto"><div className={e.seg}>{corners.map(c => <button key={c.id} className={m.position === c.id ? e.segOn : ''} onClick={() => onChange({ ...m, position: c.id }, 'wmpos')}>{c.label}</button>)}</div></Field>
      <Field label={`Opacidade · ${Math.round(m.opacity * 100)}%`}><input type="range" min={10} max={100} value={Math.round(m.opacity * 100)} onChange={ev => onChange({ ...m, opacity: +ev.target.value / 100 }, 'wmop')} /></Field>
    </>}
  </Section>
}

function Section({ title, extra, children }: { title: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return <section className={e.section}><div className={e.sectionHead}><b>{title}</b>{extra}</div>{children}</section>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className={e.field}><span>{label}</span>{children}</div>
}

function Swatches({ colors, value, onPick }: { colors: (string | undefined)[]; value?: string; onPick: (c: string | undefined) => void }) {
  return <div className={e.swatches}>{colors.map(c => <button key={c ?? 'none'} className={`${e.swatch} ${value === c ? e.swatchOn : ''} ${c ? '' : e.swatchNone}`} style={{ background: c }} onClick={() => onPick(c)} aria-label={c ?? 'Sem fundo'} />)}
    <label className={e.swatchPick} aria-label="Outra cor"><input type="color" value={value && value.startsWith('#') ? value : '#ffffff'} onChange={ev => onPick(ev.target.value)} /></label>
  </div>
}
