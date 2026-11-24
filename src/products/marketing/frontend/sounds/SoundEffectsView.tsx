'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AudioLines, Download, Loader2, Pause, Play, Search } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import s from '@/products/editor/frontend/shell/ui.module.css'
import x from './sounds.module.css'

type SoundEffect = { id: string; storage_path: string; title: string; category: string; duration_ms: number | null; tags: string[]; url: string | null; signedAt: number }
type Page = { efeitos: Omit<SoundEffect, 'signedAt'>[]; total: number }

/** Bucket folders, grouped and in the order the screen shows them (most used in Reels first). */
const GROUPS: { label: string; categories: Record<string, string> }[] = [
  {
    label: 'Edição',
    categories: {
      transicoes: 'Transições', impactos: 'Impactos', texto: 'Texto e destaque', interface: 'Interface e digital',
      comicos: 'Cômicos e reações', risers: 'Risers e tensão', sucesso: 'Sucesso e dinheiro', erro: 'Erro e alerta',
      objetos: 'Corpo e objetos', ambientes: 'Ambientes',
    },
  },
  {
    label: 'Temas',
    categories: {
      vozes: 'Vozes e reações', natureza: 'Natureza e clima', animais: 'Animais', veiculos: 'Veículos e trânsito',
      comida: 'Comida e cozinha', esporte: 'Esporte e fitness', casa: 'Casa', tecnologia: 'Tecnologia e sci-fi',
      terror: 'Terror e suspense', festa: 'Festa e celebração', musicais: 'Musicais curtos', beleza: 'Beleza e moda',
      negocios: 'Negócios e escritório', saude: 'Saúde e bem-estar',
    },
  },
]
const categoryNames: Record<string, string> = Object.assign({}, ...GROUPS.map(g => g.categories))
const categoryName = (c: string) => categoryNames[c] ?? (c.charAt(0).toUpperCase() + c.slice(1)).replace(/-/g, ' ')
const duration = (ms: number | null) => ms == null ? '' : ms < 60000 ? `${(ms / 1000).toFixed(1).replace('.', ',')} s` : `${Math.floor(ms / 60000)}:${String(Math.round(ms / 1000) % 60).padStart(2, '0')}`
const URLS_FOR_MS = 50 * 60000 // the server signs the URLs for an hour
const ALL = 'todas'

async function api<T>(params: Record<string, string>): Promise<T> {
  const response = await fetch(`/api/marketing/sound-effects?${new URLSearchParams(params)}`, { cache: 'no-store' })
  const body = await response.json().catch(() => ({})) as T & { erro?: string }
  if (!response.ok) throw new Error(body.erro ?? `HTTP ${response.status}`)
  return body
}

/** Library of sound effects (bucket "sound-effects", cataloged in marketing.sound_effects), read through the server page by page. */
export function SoundEffectsView() {
  const { isLoaded, userId } = useAuth()
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [category, setCategory] = useState('transicoes')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<SoundEffect[] | null>(null)
  const [total, setTotal] = useState(0)
  const [more, setMore] = useState(false)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const request = useRef(0)
  const sentinel = useRef<HTMLDivElement | null>(null)

  // Categories and how many effects each has.
  useEffect(() => {
    if (!isLoaded) return
    if (!userId) { setCounts({}); setItems([]); return }
    api<{ categorias: { category: string; total: number }[] }>({ categorias: '1' }).then(({ categorias }) => {
      const next = Object.fromEntries(categorias.map(c => [c.category, c.total]))
      setCounts(next)
      setCategory(current => next[current] ? current : (Object.keys(categoryNames).find(c => next[c]) ?? ALL))
    }, e => { console.error('Sound effects: falha ao carregar', e); setError('Não foi possível carregar os efeitos.'); setCounts({}); setItems([]) })
  }, [isLoaded, userId])

  // The search waits for a pause in typing.
  useEffect(() => { const t = setTimeout(() => setSearch(query.trim()), 300); return () => clearTimeout(t) }, [query])

  const load = useCallback(async (offset: number) => {
    const id = ++request.current
    setMore(true)
    try {
      const page = await api<Page>({ ...(category === ALL ? {} : { categoria: category }), ...(search ? { busca: search } : {}), inicio: String(offset) })
      if (id !== request.current) return
      const signedAt = Date.now()
      setItems(prev => [...(offset ? prev ?? [] : []), ...page.efeitos.map(e => ({ ...e, signedAt }))])
      setTotal(page.total)
      setError('')
    } catch (e) {
      if (id !== request.current) return
      console.error('Sound effects: falha ao carregar', e)
      setError('Não foi possível carregar os efeitos.')
      if (!offset) setItems([])
    } finally {
      if (id === request.current) setMore(false)
    }
  }, [category, search])

  // A new category or search starts from the first page.
  useEffect(() => {
    if (!counts || !userId) return
    setItems(null)
    void load(0)
  }, [counts, userId, load])

  // The next page loads when the end of the list comes into view.
  const loaded = items?.length ?? 0
  useEffect(() => {
    const el = sentinel.current
    if (!el || more || loaded >= total) return
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) void load(loaded) }, { rootMargin: '400px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [loaded, total, more, load])

  useEffect(() => () => audio.current?.pause(), [])

  /** The effect with a URL that is still valid (signs it again when it is about to expire). */
  const fresh = async (i: SoundEffect) => {
    if (Date.now() - i.signedAt < URLS_FOR_MS && i.url) return i
    const { efeitos } = await api<Page>({ id: i.id })
    const next = efeitos[0] ? { ...efeitos[0], signedAt: Date.now() } : i
    setItems(prev => prev?.map(e => e.id === i.id ? next : e) ?? prev)
    return next
  }

  const toggle = async (i: SoundEffect) => {
    const a = audio.current ??= new Audio()
    if (playing === i.id) { a.pause(); setPlaying(null); return }
    setLoading(i.id)
    try {
      a.pause()
      const url = (await fresh(i)).url
      if (!url) throw new Error('Sem URL')
      a.src = url
      a.onended = () => setPlaying(null)
      await a.play()
      setPlaying(i.id)
    } catch (e) { console.error('Sound effects: falha ao tocar', e); setError('Não foi possível tocar este efeito.') }
    finally { setLoading(null) }
  }
  const download = async (i: SoundEffect) => {
    try {
      const url = (await fresh(i)).url
      if (!url) throw new Error('Sem URL')
      const name = i.storage_path.split('/').pop() ?? `${i.title}.mp3`
      window.location.href = `${url}&download=${encodeURIComponent(name)}`
    } catch (e) { console.error('Sound effects: falha ao baixar', e); setError('Não foi possível baixar este efeito.') }
  }

  const library = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null
  const showCategory = category === ALL
  const others = counts ? Object.keys(counts).filter(c => !categoryNames[c]) : []

  return <section className={s.content}>
    <div className={s.pageHead}>
      <div><h1>Sound effects</h1><p>{library == null ? 'Carregando…' : `${library.toLocaleString('pt-BR')} ${library === 1 ? 'efeito' : 'efeitos'} para usar nos seus vídeos e posts.`}</p></div>
    </div>
    <div className={s.toolbar}>
      <label className={s.search}><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar efeito ou tag" /></label>
    </div>
    {counts && library ? <div className={x.groups}>
      <div className={x.chips}><button className={category === ALL ? x.chipOn : ''} onClick={() => setCategory(ALL)}>Todas<span className={x.n}>{library}</span></button></div>
      {GROUPS.map(g => {
        const cats = Object.keys(g.categories).filter(c => counts[c])
        if (g.label === 'Temas') cats.push(...others)
        if (!cats.length) return null
        return <div key={g.label} className={x.group}>
          <span className={x.groupLabel}>{g.label}</span>
          <div className={x.chips}>{cats.map(c => <button key={c} className={category === c ? x.chipOn : ''} onClick={() => setCategory(c)}>{categoryName(c)}<span className={x.n}>{counts[c]}</span></button>)}</div>
        </div>
      })}
    </div> : null}
    {error && <p className={x.error} role="alert">{error}</p>}

    {items && items.length > 0 && <div className={x.block}>
      <h3>{search ? `${total} ${total === 1 ? 'resultado' : 'resultados'}${showCategory ? '' : ` em ${categoryName(category)}`}` : showCategory ? 'Todos os efeitos' : categoryName(category)}</h3>
      <ul className={x.list}>{items.map(i => <li key={i.id} className={`${x.item} ${playing === i.id ? x.on : ''}`}>
        <button className={x.play} onClick={() => void toggle(i)} aria-label={playing === i.id ? `Pausar ${i.title}` : `Tocar ${i.title}`}>
          {loading === i.id ? <Loader2 size={16} className={x.spin} /> : playing === i.id ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <span className={x.text}><b>{i.title}</b><small>{[showCategory ? categoryName(i.category) : '', ...i.tags].filter(Boolean).join(' · ')}</small></span>
        <span className={x.time}>{duration(i.duration_ms)}</span>
        <button className={s.iconBtn} onClick={() => void download(i)} aria-label={`Baixar ${i.title}`}><Download size={16} /></button>
      </li>)}</ul>
      <div ref={sentinel} className={x.more}>{more ? <Loader2 size={18} className={x.spin} /> : loaded < total ? <button className={s.secondary} onClick={() => void load(loaded)}>Carregar mais</button> : null}</div>
    </div>}
    {(items === null || (counts === null && !error)) && !error && <div className={x.more}><Loader2 size={20} className={x.spin} /></div>}

    {items && !items.length && library !== null && !more && <div className={x.empty}><AudioLines size={40} strokeWidth={1.3} />
      <b>{library ? 'Nenhum efeito encontrado' : 'Nenhum efeito ainda'}</b>
      <span>{library ? 'Tente outra busca ou categoria.' : userId ? 'Os efeitos adicionados à biblioteca aparecem aqui.' : 'Entre com sua conta para ver a biblioteca de efeitos.'}</span>
    </div>}
  </section>
}
