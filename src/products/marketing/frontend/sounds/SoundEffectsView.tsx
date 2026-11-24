'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownWideNarrow, ArrowLeftRight, AudioLines, Briefcase, Car, Check, ChevronDown, ChevronLeft, CloudRain, Cpu, Download, Dumbbell, Footprints, Ghost,
  Heart, HeartPulse, House, Laugh, Link2, Loader2, Mic, MousePointerClick, Music, PartyPopper, Pause, PawPrint, Play, Plus, Search, Sparkles, Timer,
  TrendingUp, TriangleAlert, Trophy, Trees, Type, UtensilsCrossed, Zap,
} from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { categoryPt, subcategoryPt } from '@/products/marketing/shared/soundTaxonomy'
import { copySoundEffectToDrive, SFX_FOLDER } from './toDrive'
import s from '@/products/editor/frontend/shell/ui.module.css'
import x from './sounds.module.css'

type SoundEffect = {
  id: string; storage_path: string; title: string; category: string; duration_ms: number | null; tags: string[]; url: string | null
  epidemic_category: string | null; epidemic_subcategory: string | null; waveform: number[] | null; favorite: boolean; signedAt: number
}
type Page = { efeitos: Omit<SoundEffect, 'signedAt'>[]; total: number }
type IndexRow = { category: string; subcategory: string; total: number }
/** What the list shows: one of our categories, an Epidemic category/subcategory, the favorites, one effect, or a search. */
type Filter = { category?: string; ecat?: string; esub?: string; favorites?: boolean; id?: string; search?: string }
type Sort = 'nome' | 'curtos' | 'longos' | 'recentes'
type Range = 'todas' | 'ate1' | '1a3' | '3a10' | 'mais10'

/** Our categories (bucket folders), with their card colour and icon, in the order the screen shows them. */
const CATEGORIES: { id: string; name: string; group: 'Edição' | 'Temas'; Icon: typeof Zap; bg: string; fg: string }[] = [
  { id: 'transicoes', name: 'Transições', group: 'Edição', Icon: ArrowLeftRight, bg: '#f9dcd6', fg: '#b4432a' },
  { id: 'impactos', name: 'Impactos', group: 'Edição', Icon: Zap, bg: '#ffe2b8', fg: '#a35b00' },
  { id: 'texto', name: 'Texto e destaque', group: 'Edição', Icon: Type, bg: '#dbe7ff', fg: '#2c55b8' },
  { id: 'interface', name: 'Interface e digital', group: 'Edição', Icon: MousePointerClick, bg: '#e2f4ff', fg: '#1d6f9a' },
  { id: 'comicos', name: 'Cômicos e reações', group: 'Edição', Icon: Laugh, bg: '#fff1a8', fg: '#8a6d00' },
  { id: 'risers', name: 'Risers e tensão', group: 'Edição', Icon: TrendingUp, bg: '#ebe0ff', fg: '#6b3fc4' },
  { id: 'sucesso', name: 'Sucesso e dinheiro', group: 'Edição', Icon: Trophy, bg: '#dcf5dc', fg: '#2f7a39' },
  { id: 'erro', name: 'Erro e alerta', group: 'Edição', Icon: TriangleAlert, bg: '#ffd9d9', fg: '#b42323' },
  { id: 'objetos', name: 'Corpo e objetos', group: 'Edição', Icon: Footprints, bg: '#efe7dc', fg: '#7a5a36' },
  { id: 'ambientes', name: 'Ambientes', group: 'Edição', Icon: Trees, bg: '#dff1e7', fg: '#2c6e4b' },
  { id: 'vozes', name: 'Vozes e reações', group: 'Temas', Icon: Mic, bg: '#fde0ef', fg: '#a4306d' },
  { id: 'natureza', name: 'Natureza e clima', group: 'Temas', Icon: CloudRain, bg: '#dcefff', fg: '#25679c' },
  { id: 'animais', name: 'Animais', group: 'Temas', Icon: PawPrint, bg: '#f6e6d2', fg: '#8c5320' },
  { id: 'veiculos', name: 'Veículos e trânsito', group: 'Temas', Icon: Car, bg: '#ffd8c7', fg: '#b04313' },
  { id: 'comida', name: 'Comida e cozinha', group: 'Temas', Icon: UtensilsCrossed, bg: '#fff0cc', fg: '#946200' },
  { id: 'esporte', name: 'Esporte e fitness', group: 'Temas', Icon: Dumbbell, bg: '#dff4ea', fg: '#22744c' },
  { id: 'casa', name: 'Casa', group: 'Temas', Icon: House, bg: '#e9e6ff', fg: '#4c42b5' },
  { id: 'tecnologia', name: 'Tecnologia e sci-fi', group: 'Temas', Icon: Cpu, bg: '#d9f3f4', fg: '#16717a' },
  { id: 'terror', name: 'Terror e suspense', group: 'Temas', Icon: Ghost, bg: '#e4e2ea', fg: '#463f5c' },
  { id: 'festa', name: 'Festa e celebração', group: 'Temas', Icon: PartyPopper, bg: '#ffe0f4', fg: '#a32c82' },
  { id: 'musicais', name: 'Musicais curtos', group: 'Temas', Icon: Music, bg: '#e6ecff', fg: '#3a4fae' },
  { id: 'beleza', name: 'Beleza e moda', group: 'Temas', Icon: Sparkles, bg: '#fbe3ea', fg: '#a3354f' },
  { id: 'negocios', name: 'Negócios e escritório', group: 'Temas', Icon: Briefcase, bg: '#e5eef0', fg: '#36606a' },
  { id: 'saude', name: 'Saúde e bem-estar', group: 'Temas', Icon: HeartPulse, bg: '#ffe3e3', fg: '#b03a3a' },
]
const byId = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))
const fallback = { name: '', Icon: AudioLines, bg: '#eceef1', fg: '#4b5563' }
const look = (id: string) => byId[id] ?? { ...fallback, name: id }

const RANGES: Record<Range, { label: string; min?: number; max?: number }> = {
  todas: { label: 'Qualquer duração' }, ate1: { label: 'Até 1 s', max: 1000 }, '1a3': { label: '1 a 3 s', min: 1000, max: 3000 },
  '3a10': { label: '3 a 10 s', min: 3000, max: 10000 }, mais10: { label: 'Mais de 10 s', min: 10000 },
}
const SORTS: Record<Sort, string> = { nome: 'Nome', curtos: 'Mais curtos', longos: 'Mais longos', recentes: 'Recentes' }
const URLS_FOR_MS = 50 * 60000 // the server signs the URLs for an hour
const clock = (ms: number | null) => ms == null ? '' : `${Math.floor(ms / 60000)}:${String(Math.round(ms / 1000) % 60).padStart(2, '0')}`

async function api<T>(params: Record<string, string>, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/marketing/sound-effects${init ? '' : `?${new URLSearchParams(params)}`}`, { cache: 'no-store', ...init })
  const body = await response.json().catch(() => ({})) as T & { erro?: string }
  if (!response.ok) throw new Error(body.erro ?? `HTTP ${response.status}`)
  return body
}

/** A small menu under a button. */
function Picker<T extends string>({ value, options, onPick, icon: Icon, align = 'left' }: { value: T; options: Record<T, string | { label: string }>; onPick: (v: T) => void; icon: typeof Timer; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [open])
  const label = (k: T) => { const o = options[k]; return typeof o === 'string' ? o : o.label }
  return <div ref={ref} className={x.pickerWrap}>
    <button type="button" className={x.picker} onClick={() => setOpen(o => !o)} aria-expanded={open}><Icon size={16} />{label(value)}<ChevronDown size={14} /></button>
    {open && <div className={`${x.pickerMenu} ${align === 'right' ? x.pickerRight : ''}`} role="menu">
      {(Object.keys(options) as T[]).map(k => <button key={k} type="button" role="menuitemradio" aria-checked={k === value} onClick={() => { onPick(k); setOpen(false) }}>{label(k)}{k === value && <Check size={14} />}</button>)}
    </div>}
  </div>
}

/** The bars of the waveform; the part already played is darker, and a click jumps there. */
function Waveform({ bars, progress, onSeek }: { bars: number[] | null; progress: number | null; onSeek: (fraction: number) => void }) {
  if (!bars?.length) return <span className={x.waveEmpty} />
  return <button type="button" className={x.wave} aria-label="Ir para um ponto do áudio" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); onSeek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))) }}>
    {bars.map((v, i) => <i key={i} className={progress !== null && i / bars.length < progress ? x.wavePlayed : ''} style={{ height: `${Math.max(6, v)}%` }} />)}
  </button>
}

/** Library of sound effects, like Epidemic's: search, category cards and an index; then a list with waveform and actions. */
export function SoundEffectsView() {
  const { isLoaded, userId } = useAuth()
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [index, setIndex] = useState<IndexRow[]>([])
  const [filter, setFilter] = useState<Filter | null>(null)
  const [query, setQuery] = useState('')
  const [range, setRange] = useState<Range>('todas')
  const [sort, setSort] = useState<Sort>('nome')
  const [items, setItems] = useState<SoundEffect[] | null>(null)
  const [total, setTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [playing, setPlaying] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState<string | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const request = useRef(0)
  const sentinel = useRef<HTMLDivElement | null>(null)

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t) }, [toast])

  // Counts of our categories and the Epidemic index; a shared link (?efeito=) opens that effect.
  useEffect(() => {
    if (!isLoaded) return
    if (!userId) { setCounts({}); return }
    Promise.all([api<{ categorias: { category: string; total: number }[] }>({ categorias: '1' }), api<{ indice: IndexRow[] }>({ indice: '1' })])
      .then(([c, i]) => { setCounts(Object.fromEntries(c.categorias.map(r => [r.category, r.total]))); setIndex(i.indice) },
        e => { console.error('Sound effects: falha ao carregar', e); setError('Não foi possível carregar os efeitos.'); setCounts({}) })
    const shared = new URLSearchParams(window.location.search).get('efeito')
    if (shared) setFilter({ id: shared })
  }, [isLoaded, userId])

  // Typing in the search opens the list of results (after a pause); clearing it goes back to the categories.
  useEffect(() => {
    const t = setTimeout(() => {
      const q = query.trim()
      setFilter(f => q ? (f?.search === q ? f : { search: q }) : f?.search ? null : f)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const params = useMemo(() => {
    if (!filter) return null
    const r = RANGES[range]
    return {
      ...(filter.category ? { categoria: filter.category } : {}), ...(filter.ecat ? { ecat: filter.ecat } : {}), ...(filter.esub ? { esub: filter.esub } : {}),
      ...(filter.favorites ? { favoritos: '1' } : {}), ...(filter.id ? { id: filter.id } : {}), ...(filter.search ? { busca: filter.search } : {}),
      ...(r.min != null ? { min: String(r.min) } : {}), ...(r.max != null ? { max: String(r.max) } : {}), ordem: sort,
    }
  }, [filter, range, sort])

  const load = useCallback(async (offset: number) => {
    if (!params) return
    const id = ++request.current
    setLoadingMore(true)
    try {
      const page = await api<Page>({ ...params, inicio: String(offset) })
      if (id !== request.current) return
      const signedAt = Date.now()
      setItems(prev => [...(offset ? prev ?? [] : []), ...page.efeitos.map(e => ({ ...e, signedAt }))])
      setTotal(page.total); setError('')
    } catch (e) {
      if (id !== request.current) return
      console.error('Sound effects: falha ao carregar', e)
      setError('Não foi possível carregar os efeitos.')
      if (!offset) setItems([])
    } finally { if (id === request.current) setLoadingMore(false) }
  }, [params])

  // A new list starts from its first page.
  useEffect(() => {
    setItems(null)
    if (params) void load(0)
  }, [params, load])

  const loaded = items?.length ?? 0
  useEffect(() => {
    const el = sentinel.current
    if (!el || loadingMore || loaded >= total) return
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) void load(loaded) }, { rootMargin: '400px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [loaded, total, loadingMore, load])

  useEffect(() => () => audio.current?.pause(), [])

  const fresh = async (i: SoundEffect) => {
    if (Date.now() - i.signedAt < URLS_FOR_MS && i.url) return i
    const { efeitos } = await api<Page>({ id: i.id })
    const next = efeitos[0] ? { ...efeitos[0], signedAt: Date.now() } : i
    setItems(prev => prev?.map(e => e.id === i.id ? next : e) ?? prev)
    return next
  }
  const play = async (i: SoundEffect, at?: number) => {
    const a = audio.current ??= new Audio()
    if (playing === i.id && at === undefined) { a.pause(); setPlaying(null); return }
    try {
      if (playing !== i.id) {
        a.pause()
        const url = (await fresh(i)).url
        if (!url) throw new Error('Sem URL')
        a.src = url
        a.onended = () => { setPlaying(null); setProgress(0) }
        a.ontimeupdate = () => setProgress(a.duration ? a.currentTime / a.duration : 0)
        setProgress(0)
      }
      if (at !== undefined) { const set = () => { a.currentTime = at * (a.duration || 0) }; if (a.readyState >= 1) set(); else a.onloadedmetadata = set }
      await a.play()
      setPlaying(i.id)
    } catch (e) { console.error('Sound effects: falha ao tocar', e); setToast('Não foi possível tocar este efeito.') }
  }
  const fileName = (i: SoundEffect) => i.storage_path.split('/').pop() ?? `${i.title}.mp3`
  const download = async (i: SoundEffect) => {
    try {
      const url = (await fresh(i)).url
      if (!url) throw new Error('Sem URL')
      window.location.href = `${url}&download=${encodeURIComponent(fileName(i))}`
    } catch { setToast('Não foi possível baixar este efeito.') }
  }
  const favorite = async (i: SoundEffect) => {
    const next = !i.favorite
    setItems(prev => (prev ?? []).map(e => e.id === i.id ? { ...e, favorite: next } : e).filter(e => !(filter?.favorites && e.id === i.id && !next)))
    try { await api({}, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: i.id, favorito: next }) }) }
    catch { setItems(prev => prev?.map(e => e.id === i.id ? { ...e, favorite: !next } : e) ?? prev); setToast('Não foi possível salvar o favorito.') }
  }
  const toDrive = async (i: SoundEffect) => {
    setBusy(i.id)
    try {
      const url = (await fresh(i)).url
      if (!url) throw new Error('Sem URL')
      await copySoundEffectToDrive(url, fileName(i))
      setToast(`Adicionado ao Drive, na pasta “${SFX_FOLDER}”.`)
    } catch (e) { console.error('Sound effects: Drive', e); setToast('Não foi possível adicionar ao Drive.') }
    finally { setBusy(null) }
  }
  const copyLink = async (i: SoundEffect) => {
    const link = `${window.location.origin}/marketing/sound-effects?efeito=${i.id}`
    try { await navigator.clipboard.writeText(link); setToast('Link copiado.') } catch { setToast(link) }
  }

  const open = (f: Filter) => { setQuery(''); setFilter(f); window.scrollTo({ top: 0 }) }
  const back = () => { setQuery(''); setFilter(null); if (window.location.search) window.history.replaceState(null, '', window.location.pathname) }

  const library = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null
  const grouped = useMemo(() => {
    const map = new Map<string, { total: number; subs: IndexRow[] }>()
    for (const r of index) { const g = map.get(r.category) ?? { total: 0, subs: [] }; g.total += r.total; if (r.subcategory) g.subs.push(r); map.set(r.category, g) }
    return [...map.entries()].sort(([a], [b]) => categoryPt(a).localeCompare(categoryPt(b), 'pt-BR'))
  }, [index])

  const title = !filter ? '' : filter.search ? `Resultados para “${filter.search}”` : filter.favorites ? 'Seus favoritos' : filter.id ? 'Efeito compartilhado'
    : filter.category ? look(filter.category).name : filter.esub ? `${categoryPt(filter.ecat ?? '')} › ${subcategoryPt(filter.esub)}` : categoryPt(filter.ecat ?? '')

  return <section className={`${s.content} ${x.page}`}>
    <label className={x.bigSearch}><Search size={20} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar efeitos sonoros" aria-label="Buscar efeitos sonoros" /></label>
    {error && <p className={x.error} role="alert">{error}</p>}

    {!filter && <>
      <div className={x.homeHead}>
        <h1>Sound effects</h1>
        <span>{library == null ? 'Carregando…' : `${library.toLocaleString('pt-BR')} efeitos`}</span>
        <button type="button" className={x.favLink} onClick={() => open({ favorites: true })}><Heart size={16} />Seus favoritos</button>
      </div>
      {(['Edição', 'Temas'] as const).map(group => {
        const cards = CATEGORIES.filter(c => c.group === group && counts?.[c.id])
        if (!cards.length) return null
        return <div key={group}>
          <h2 className={x.section}>{group === 'Edição' ? 'Categorias de edição' : 'Temas'}</h2>
          <div className={x.cards}>{cards.map(c => <button key={c.id} type="button" className={x.card} style={{ background: c.bg, color: c.fg }} onClick={() => open({ category: c.id })}>
            <c.Icon size={64} strokeWidth={1.5} className={x.cardIcon} />
            <span className={x.cardName}>{c.name}<small>{counts?.[c.id]}</small></span>
          </button>)}</div>
        </div>
      })}
      {grouped.length > 0 && <>
        <h2 className={x.section}>Todas as categorias</h2>
        <div className={x.index}>{grouped.map(([cat, g]) => <div key={cat} className={x.indexGroup}>
          <button type="button" className={x.indexHead} onClick={() => open({ ecat: cat })}>{categoryPt(cat)}<small>{g.total}</small></button>
          {g.subs.map(sub => <button key={sub.subcategory} type="button" className={x.indexSub} onClick={() => open({ ecat: cat, esub: sub.subcategory })}>{subcategoryPt(sub.subcategory)}</button>)}
        </div>)}</div>
      </>}
      {library === 0 && !error && <div className={x.empty}><AudioLines size={40} strokeWidth={1.3} /><b>Nenhum efeito ainda</b><span>{userId ? 'Os efeitos adicionados à biblioteca aparecem aqui.' : 'Entre com sua conta para ver a biblioteca de efeitos.'}</span></div>}
      {library === null && !error && <div className={x.more}><Loader2 size={20} className={x.spin} /></div>}
    </>}

    {filter && <>
      <div className={x.listHead}>
        <button type="button" className={x.back} onClick={back}><ChevronLeft size={16} />Categorias</button>
        <h1>{title}</h1>
        {items && <span>{total.toLocaleString('pt-BR')} {total === 1 ? 'efeito' : 'efeitos'}</span>}
      </div>
      <div className={x.listTools}>
        <Picker value={range} options={RANGES} onPick={setRange} icon={Timer} />
        <Picker value={sort} options={SORTS} onPick={setSort} icon={ArrowDownWideNarrow} align="right" />
      </div>
      {items === null ? <div className={x.more}><Loader2 size={20} className={x.spin} /></div> : items.length ? <ul className={x.rows}>
        {items.map(i => { const c = look(i.category); return <li key={i.id} className={`${x.row} ${playing === i.id ? x.rowOn : ''}`}>
          <button type="button" className={x.art} style={{ background: c.bg, color: c.fg }} onClick={() => void play(i)} aria-label={playing === i.id ? `Pausar ${i.title}` : `Tocar ${i.title}`}>
            <c.Icon size={24} strokeWidth={1.7} className={x.artIcon} />
            <span className={x.artPlay}>{playing === i.id ? <Pause size={20} /> : <Play size={20} />}</span>
          </button>
          <span className={x.rowTitle} title={i.title}>{i.title}</span>
          <Waveform bars={i.waveform} progress={playing === i.id ? progress : null} onSeek={f => void play(i, f)} />
          <span className={x.rowTime}>{clock(i.duration_ms)}</span>
          {i.epidemic_subcategory ? <button type="button" className={x.rowSub} onClick={() => open({ ecat: i.epidemic_category ?? undefined, esub: i.epidemic_subcategory ?? undefined })}>{subcategoryPt(i.epidemic_subcategory)}</button> : <span className={x.rowSub} />}
          <span className={x.actions}>
            <button type="button" onClick={() => void favorite(i)} aria-label={i.favorite ? 'Remover dos favoritos' : 'Favoritar'} title={i.favorite ? 'Remover dos favoritos' : 'Favoritar'} className={i.favorite ? x.faved : ''}><Heart size={18} fill={i.favorite ? 'currentColor' : 'none'} /></button>
            <button type="button" onClick={() => void toDrive(i)} disabled={busy === i.id} aria-label="Adicionar ao Drive" title="Adicionar ao Drive">{busy === i.id ? <Loader2 size={18} className={x.spin} /> : <Plus size={18} />}</button>
            <button type="button" onClick={() => void download(i)} aria-label="Baixar" title="Baixar"><Download size={18} /></button>
            <button type="button" onClick={() => void copyLink(i)} aria-label="Copiar link" title="Copiar link"><Link2 size={18} /></button>
          </span>
        </li> })}
      </ul> : <div className={x.empty}><AudioLines size={40} strokeWidth={1.3} /><b>{filter.favorites ? 'Nenhum favorito ainda' : 'Nenhum efeito encontrado'}</b><span>{filter.favorites ? 'Toque no coração de um efeito para guardá-lo aqui.' : 'Tente outra busca, categoria ou duração.'}</span></div>}
      <div ref={sentinel} className={x.more}>{loadingMore && items !== null ? <Loader2 size={18} className={x.spin} /> : null}</div>
    </>}
    {toast && <div className={x.toast} role="status">{toast}</div>}
  </section>
}
