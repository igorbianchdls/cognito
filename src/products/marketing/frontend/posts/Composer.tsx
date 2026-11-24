'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AlertTriangle, Check, CircleX, Hash, Lightbulb, Send, Trash2 } from 'lucide-react'
import { folderLabel, liveFiles, liveFolders } from '@/products/drive/frontend/store'
import { useDriveState } from '@/products/drive/frontend/hooks'
import { Thumb } from '@/products/drive/frontend/Thumb'
import { NetworkIcon } from './badges'
import { useAccounts } from './accounts'
import { formatLabel, networkLabel, type Post, type PostFormat, type PostStatus } from './data'
import { checkPost, hashtags, limits, networksOf } from './rules'
import { PostPreview } from './Preview'
import { deletePost, getPosts, newPostId, nowStamp, savePost, usePosts } from './store'
import { getSettings, useSettings } from '@/products/marketing/frontend/settings/store'
import { notify } from '@/products/marketing/frontend/notifications/store'
import s from '@/products/editor/frontend/shell/ui.module.css'
import p from './posts.module.css'

/** Next time the default posting hour comes around (Configurações → Publicação). */
function nextDefaultTime() {
  const [h, m] = getSettings().posting.time.split(':').map(Number)
  const d = new Date(); d.setHours(h, m, 0, 0)
  if (d.getTime() < Date.now() + 15 * 60e3) d.setDate(d.getDate() + 1)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function Composer({ initialFiles, editId }: { initialFiles: string[]; editId?: string }) {
  const router = useRouter()
  const driveState = useDriveState()
  const accountList = useAccounts()
  const files = liveFiles(driveState)
  const [editing, setEditing] = useState<Post | null>(null)
  const [chosenFolder, setFolderId] = useState<string | null>(null)
  const [pickedRaw, setPicked] = useState<string[]>(initialFiles)
  // Uploaded files only exist in this browser, so the list is checked on every render, not only on the server.
  const picked = pickedRaw.filter(id => files.some(f => f.id === id))
  const pickedFiles = picked.map(id => files.find(f => f.id === id)!)
  const folderId = chosenFolder ?? files.find(f => f.id === picked[0])?.folderId ?? liveFolders(driveState)[0]?.id ?? null
  const [caption, setCaption] = useState('')
  const { posting: postingPrefs } = useSettings()
  // Until the person picks, new posts go to the default accounts from Configurações (or the first connected one).
  const [chosenAccounts, setAccountIds] = useState<string[] | null>(null)
  const preferred = postingPrefs.accountIds.filter(id => accountList.some(a => a.id === id && a.connected))
  const accountIds = (chosenAccounts ?? (preferred.length ? preferred : accountList.filter(a => a.status === 'conectada').slice(0, 1).map(a => a.id)))
    .filter(id => accountList.some(a => a.id === id))
  const [format, setFormat] = useState<PostFormat>('reel')
  const [when, setWhen] = useState<'agora' | 'agendar'>('agora')
  const [date, setDate] = useState('')
  const [toast, setToast] = useState('')

  // Editing: load the post once it is on the client (it may still be coming from the database).
  const { posts: allPosts } = usePosts()
  const editLoaded = !!editId && allPosts.some(x => x.id === editId)
  useEffect(() => {
    if (!editId) return
    const post = getPosts().find(x => x.id === editId)
    if (!post) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setEditing(post); setPicked(post.fileIds); setCaption(post.caption); setAccountIds(post.accountIds); setFormat(post.format)
    setWhen(post.status === 'agendado' || post.status === 'rascunho' ? 'agendar' : 'agora'); setDate(post.date)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [editId, editLoaded])
  useEffect(() => { if (!date) setDate(nextDefaultTime()) }, [date]) // eslint-disable-line react-hooks/set-state-in-effect
  // New posts start with the default accounts and format from Configurações.
  useEffect(() => {
    if (editId) return
    const { posting } = getSettings()
    /* eslint-disable react-hooks/set-state-in-effect */
    setFormat(posting.format)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [editId])

  const pool = files.filter(f => f.folderId === folderId && (f.kind === 'video' || f.kind === 'image'))
  const toggle = <T,>(list: T[], v: T) => list.includes(v) ? list.filter(x => x !== v) : [...list, v]
  const issues = checkPost({ caption, accountIds, format, files: pickedFiles })
  const stale = accountList.filter(a => accountIds.includes(a.id) && a.status === 'reconectar')
  if (stale.length) issues.unshift({ level: 'erro', text: `${stale.map(a => a.handle).join(', ')} precisa ser reconectado em Contas antes de publicar.` })
  const blocked = issues.some(i => i.level === 'erro')
  const nets = networksOf(accountIds)
  const tags = hashtags(caption)
  const ready = picked.length > 0 && accountIds.length > 0 && caption.trim().length > 0 && !blocked
  const published = editing?.status === 'publicado'
  const pastDate = when === 'agendar' && !!date && date < nowStamp()

  function submit(status: PostStatus) {
    if (status === 'publicado' && postingPrefs.confirm && !window.confirm(`Publicar agora em ${nets.length} ${nets.length === 1 ? 'rede' : 'redes'}?`)) return
    const base = editing ?? { id: newPostId() }
    savePost({ ...base, fileIds: picked, caption: caption.trim(), accountIds, format, date: status === 'agendado' || status === 'rascunho' ? date : nowStamp(), status } as Post)
    if (status !== 'rascunho') notify({ kind: status === 'agendado' ? 'agendado' : 'publicado', title: status === 'agendado' ? `Post agendado para ${date.slice(8, 10)}/${date.slice(5, 7)} às ${date.slice(11, 16)}` : 'Post enviado para publicação', text: caption.trim().slice(0, 120), href: `/marketing/posts?post=${base.id}`, action: 'Ver post' })
    setToast(status === 'rascunho' ? 'Rascunho salvo.' : status === 'agendado' ? (editing ? 'Agendamento atualizado.' : 'Post agendado.') : 'Post enviado para publicação (demonstração).')
    setTimeout(() => router.push('/marketing/posts'), 900)
  }

  return <section className={s.content}>
    <div className={s.pageHead}><div><h1>{editing ? (published ? 'Post publicado' : 'Editar post') : 'Postar'}</h1><p>{published ? 'Este post já foi ao ar. Duplique na tela de posts para publicar de novo.' : 'Escolha os arquivos do seu Drive, escreva a legenda e publique ou agende.'}</p></div>
      {editing && !published && <button className={s.ghost} onClick={() => { deletePost(editing.id); router.push('/marketing/posts') }}><Trash2 size={15} />Excluir post</button>}
    </div>
    <div className={s.composer}>
      <fieldset className={p.fieldset} disabled={published}>
        <div className={`${s.card} ${s.step}`}>
          <span className={s.stepTitle}><i>1</i>Mídia</span>
          <div className={s.row}><select className={s.selectEl} value={folderId ?? ''} onChange={e => setFolderId(e.target.value)} aria-label="Pasta">{liveFolders(driveState).map(f => <option key={f.id} value={f.id}>{driveState.drives.find(x => x.id === f.driveId)?.name} / {folderLabel(driveState, f.id)}</option>)}</select><span className={s.muted}>{picked.length ? `${picked.length} selecionado${picked.length > 1 ? 's' : ''}${picked.length > 1 && format === 'feed' ? ' · vira carrossel' : ''}` : 'Selecione um ou mais arquivos'}</span></div>
          {pickedFiles.length > 0 && <div className={p.pickedRow}>{pickedFiles.map((f, i) => <span key={f.id} className={p.picked} title={f.name}><Thumb file={f} showKind={false} className={p.pickedThumb} /><i>{i + 1}</i><button onClick={() => setPicked(picked.filter(x => x !== f.id))} aria-label={`Tirar ${f.name}`}>×</button></span>)}</div>}
          <div className={s.pickGrid}>{pool.map(f => { const on = picked.includes(f.id); return <button key={f.id} className={`${s.pick} ${on ? s.pickOn : ''}`} onClick={() => setPicked(toggle(picked, f.id))} aria-pressed={on} title={f.name}>
            <span className={`${s.check} ${on ? s.checkOn : ''}`} style={{ top: 6, left: 6 }}>{on && <Check size={14} strokeWidth={3} />}</span><Thumb file={f} showKind={false} /><span className={s.pickName}>{f.name}</span>
          </button> })}{!pool.length && <p className={s.muted}>Nenhum vídeo ou imagem nesta pasta.</p>}</div>
        </div>
        <div className={`${s.card} ${s.step}`}>
          <span className={s.stepTitle}><i>2</i>Onde e como</span>
          <div className={s.choices}>{accountList.map(a => { const on = accountIds.includes(a.id); return <button key={a.id} className={`${s.choice} ${on ? s.choiceOn : ''}`} disabled={!a.connected} onClick={() => setAccountIds(toggle(accountIds, a.id))} aria-pressed={on} title={a.connected ? (a.status === 'reconectar' ? 'Reconecte esta conta em Contas antes de publicar' : '') : 'Conecte esta conta em Contas'}>
            <NetworkIcon network={a.network} size={24} />{a.handle || networkLabel[a.network]}<small>{a.status === 'reconectar' ? 'reconectar' : a.connected ? '' : 'não conectada'}</small>
          </button> })}</div>
          <div className={s.choices}>{(['reel', 'story', 'feed'] as const).map(fm => <button key={fm} className={`${s.choice} ${format === fm ? s.choiceOn : ''}`} onClick={() => setFormat(fm)} aria-pressed={format === fm} style={{ paddingLeft: 14 }}>{formatLabel[fm]}</button>)}</div>
        </div>
        <div className={`${s.card} ${s.step}`}>
          <span className={s.stepTitle}><i>3</i>Legenda</span>
          <textarea className={s.textarea} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Escreva a legenda, com emojis e hashtags…" aria-label="Legenda" />
          <div className={p.counters}>
            {nets.map(n => { const l = limits[n], over = caption.length > l.chars; return <span key={n} className={`${p.counterChip} ${over ? p.over : caption.length > l.chars * 0.9 ? p.near : ''}`}><NetworkIcon network={n} size={16} />{caption.length.toLocaleString('pt-BR')}/{l.chars.toLocaleString('pt-BR')}</span> })}
            <span className={`${p.counterChip} ${nets.includes('instagram') && tags.length > 30 ? p.over : ''}`}><Hash size={13} />{tags.length} {tags.length === 1 ? 'hashtag' : 'hashtags'}{nets.includes('instagram') ? ' de 30' : ''}</span>
          </div>
          {postingPrefs.hashtags.trim() && !caption.includes(postingPrefs.hashtags.trim()) && <button className={p.addTags} onClick={() => setCaption(c => `${c.trimEnd()}${c.trim() ? '\n\n' : ''}${postingPrefs.hashtags.trim()}`)}><Hash size={13} />Inserir hashtags padrão: {postingPrefs.hashtags.trim()}</button>}
          {tags.length > 0 && <div className={p.tags}>{[...new Set(tags)].map(t => <span key={t}>{t}</span>)}</div>}
        </div>
        <div className={`${s.card} ${s.step}`}>
          <span className={s.stepTitle}><i>4</i>Quando</span>
          <div className={s.row}>
            <div className={s.segment}><button className={when === 'agora' ? s.segOn : ''} onClick={() => setWhen('agora')}>Publicar agora</button><button className={when === 'agendar' ? s.segOn : ''} onClick={() => setWhen('agendar')}>Agendar</button></div>
            {when === 'agendar' && <input className={s.input} type="datetime-local" value={date} onChange={e => setDate(e.target.value)} aria-label="Data e hora" />}
          </div>
          {pastDate && <p className={p.warn}><AlertTriangle size={14} />Essa data já passou. Escolha um horário no futuro.</p>}
          {issues.length > 0 && <ul className={p.issues}>{issues.map(i => <li key={i.text} className={p[`is_${i.level}`]}>{i.level === 'erro' ? <CircleX size={15} /> : i.level === 'aviso' ? <AlertTriangle size={15} /> : <Lightbulb size={15} />}{i.text}</li>)}</ul>}
          <div className={s.row} style={{ justifyContent: 'flex-end' }}>
            <button className={s.secondary} disabled={!picked.length} onClick={() => submit('rascunho')}>{editing?.status === 'rascunho' ? 'Salvar rascunho' : 'Salvar como rascunho'}</button>
            <button className={s.primary} disabled={!ready || pastDate} onClick={() => submit(when === 'agora' ? 'publicado' : 'agendado')}><Send size={15} />{when === 'agora' ? 'Publicar agora' : editing?.status === 'agendado' ? 'Salvar agendamento' : 'Agendar post'}</button>
          </div>
          {!ready && picked.length > 0 && !blocked && <p className={s.muted} style={{ textAlign: 'right' }}>{!caption.trim() ? 'Falta a legenda.' : !accountIds.length ? 'Escolha ao menos uma conta.' : ''}</p>}
        </div>
      </fieldset>
      <aside className={s.preview} aria-label="Prévia">
        <PostPreview files={pickedFiles} caption={caption} accountIds={accountIds} format={format} />
        <p className={s.note}>Prévia aproximada de {nets.length ? nets.map(n => networkLabel[n]).join(' e ') : 'cada rede'}. Nesta versão de demonstração nada é publicado de verdade. <Link href="/marketing/conectores?aba=redes" className={s.link}>Ver conectores</Link></p>
      </aside>
    </div>
    {toast && <div className={s.toast} role="status"><Check size={15} />{toast}</div>}
  </section>
}
