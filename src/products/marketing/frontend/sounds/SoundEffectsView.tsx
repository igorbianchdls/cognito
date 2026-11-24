'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioLines, Download, Loader2, Pause, Play, Search } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { remoteMode } from '../lib/sync'
import { supabase } from '../lib/supabase'
import s from '@/products/editor/frontend/shell/ui.module.css'
import x from './sounds.module.css'

const BUCKET = 'sound-effects'

type SoundEffect = { id: string; storage_path: string; title: string; category: string; duration_ms: number | null; tags: string[] }

const categoryNames: Record<string, string> = {
  ambientes: 'Ambientes',
  'comicos-e-reacoes': 'Cômicos e reações',
  impactos: 'Impactos',
  'interface-e-sons-digitais': 'Interface e sons digitais',
  transicoes: 'Transições',
}
const categoryName = (c: string) => categoryNames[c] ?? (c.charAt(0).toUpperCase() + c.slice(1)).replace(/-/g, ' ')
const duration = (ms: number | null) => ms == null ? '' : ms < 60000 ? `${(ms / 1000).toFixed(1).replace('.', ',')} s` : `${Math.floor(ms / 60000)}:${String(Math.round(ms / 1000) % 60).padStart(2, '0')}`

/** Signed URL to play a file (cached for the hour it is valid). */
const playUrls = new Map<string, { url: string; until: number }>()
async function playUrl(path: string) {
  const hit = playUrls.get(path)
  if (hit && hit.until > Date.now()) return hit.url
  const { data, error } = await supabase().storage.from(BUCKET).createSignedUrl(path, 3600)
  if (error || !data) throw error ?? new Error('Sem URL')
  playUrls.set(path, { url: data.signedUrl, until: Date.now() + 55 * 60000 })
  return data.signedUrl
}

/** Library of sound effects (bucket "sound-effects", cataloged in marketing.sound_effects). */
export function SoundEffectsView() {
  const [items, setItems] = useState<SoundEffect[] | null>(remoteMode ? null : [])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('todas')
  const [playing, setPlaying] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)

  // Loads once Clerk knows the person. The library is the same for every company: RLS only checks that the
  // person is an active member of some company (marketing.can_use_sound_effects).
  const { isLoaded, userId } = useAuth()
  useEffect(() => {
    if (!remoteMode || !isLoaded) return
    if (!userId) { setItems([]); return }
    let live = true
    void (async () => {
      try {
        const { data, error } = await supabase().from('sound_effects').select('id, storage_path, title, category, duration_ms, tags').order('category').order('title')
        if (error) throw error
        if (live) { setError(''); setItems(data ?? []) }
      } catch (e) {
        console.error('Sound effects: falha ao carregar', e)
        if (live) { setError('Não foi possível carregar os efeitos.'); setItems([]) }
      }
    })()
    return () => { live = false }
  }, [isLoaded, userId])
  useEffect(() => () => audio.current?.pause(), [])

  const categories = useMemo(() => [...new Set((items ?? []).map(i => i.category))], [items])
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (items ?? []).filter(i => (category === 'todas' || i.category === category)
      && (!q || i.title.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q))))
  }, [items, query, category])
  const byCategory = list.reduce<Record<string, SoundEffect[]>>((acc, i) => { (acc[i.category] ??= []).push(i); return acc }, {})

  const toggle = async (i: SoundEffect) => {
    const a = audio.current ??= new Audio()
    if (playing === i.id) { a.pause(); setPlaying(null); return }
    setLoading(i.id)
    try {
      a.pause()
      a.src = await playUrl(i.storage_path)
      a.onended = () => setPlaying(null)
      await a.play()
      setPlaying(i.id)
    } catch (e) { console.error('Sound effects: falha ao tocar', e); setError('Não foi possível tocar este efeito.') }
    finally { setLoading(null) }
  }
  const download = async (i: SoundEffect) => {
    const name = i.storage_path.split('/').pop() ?? `${i.title}.mp3`
    const { data, error } = await supabase().storage.from(BUCKET).createSignedUrl(i.storage_path, 60, { download: name })
    if (error || !data) { setError('Não foi possível baixar este efeito.'); return }
    window.location.href = data.signedUrl
  }

  return <section className={s.content}>
    <div className={s.pageHead}>
      <div><h1>Sound effects</h1><p>{items ? `${items.length} ${items.length === 1 ? 'efeito' : 'efeitos'} para usar nos seus vídeos e posts.` : 'Carregando…'}</p></div>
    </div>
    <div className={s.toolbar}>
      <label className={s.search}><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar efeito ou tag" /></label>
      {categories.length > 1 && <div className={x.chips}>
        {['todas', ...categories].map(c => <button key={c} className={category === c ? x.chipOn : ''} onClick={() => setCategory(c)}>{c === 'todas' ? 'Todas' : categoryName(c)}</button>)}
      </div>}
    </div>
    {error && <p className={x.error} role="alert">{error}</p>}

    {Object.entries(byCategory).map(([c, sounds]) => <div key={c} className={x.block}>
      <h3>{categoryName(c)}</h3>
      <ul className={x.list}>{sounds.map(i => <li key={i.id} className={`${x.item} ${playing === i.id ? x.on : ''}`}>
        <button className={x.play} onClick={() => void toggle(i)} aria-label={playing === i.id ? `Pausar ${i.title}` : `Tocar ${i.title}`}>
          {loading === i.id ? <Loader2 size={16} className={x.spin} /> : playing === i.id ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <span className={x.text}><b>{i.title}</b>{i.tags.length > 0 && <small>{i.tags.join(' · ')}</small>}</span>
        <span className={x.time}>{duration(i.duration_ms)}</span>
        <button className={s.iconBtn} onClick={() => void download(i)} aria-label={`Baixar ${i.title}`}><Download size={16} /></button>
      </li>)}</ul>
    </div>)}

    {items && !list.length && <div className={x.empty}><AudioLines size={40} strokeWidth={1.3} />
      <b>{items.length ? 'Nenhum efeito encontrado' : 'Nenhum efeito ainda'}</b>
      <span>{items.length ? 'Tente outra busca ou categoria.' : remoteMode ? 'Os efeitos adicionados à biblioteca aparecem aqui.' : 'Entre com sua conta para ver a biblioteca de efeitos.'}</span>
    </div>}
  </section>
}
