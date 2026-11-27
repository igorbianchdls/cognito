'use client'

// Aba Artefatos: todos os artefatos que a pessoa vê, em galeria. Cada cartão mostra o próprio artefato em miniatura
// (na moldura isolada, só quando aparece na tela), o nome, quem atualizou e quando. Abrir leva à tela do artefato.
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Copy, Globe, Loader2, MoreHorizontal, PenLine, Search, Sparkles, Trash2 } from 'lucide-react'
import { tituloExibido } from '@/products/notas/shared/arvore'
import { editadoHa, notasApi } from './api'
import { MolduraArtefato } from './ArtefatoView'
import { ItemMenu, Menu } from './Menu'
import { useNotas } from './NotasProvider'
import { usePessoas } from './base/pessoas'
import { useTituloDaAba } from './local'
import x from './notas.module.css'

type Resumo = {
  id: string; titulo: string; icone: string | null; espaco: 'equipe' | 'particular'; parent_id: string | null; versao: number
  atualizado_em: string; atualizado_por: string; criado_por: string; tamanho: number; publica: boolean; pode_editar: boolean
}
type Filtro = 'todos' | 'meus' | 'equipe'

/** Miniatura: o artefato de verdade, reduzido, carregado só quando o cartão entra na tela. */
function Miniatura({ id, titulo }: { id: string; titulo: string }) {
  const caixa = useRef<HTMLDivElement>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [escala, setEscala] = useState(0.25)
  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const medir = () => setEscala(el.clientWidth / 1280)
    medir()
    const tamanho = new ResizeObserver(medir); tamanho.observe(el)
    const visivel = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      visivel.disconnect()
      notasApi<{ html: string }>(`/artefatos/${id}`).then(a => setHtml(a.html)).catch(() => setHtml(''))
    }, { rootMargin: '200px' })
    visivel.observe(el)
    return () => { tamanho.disconnect(); visivel.disconnect() }
  }, [id])
  return <div ref={caixa} className={x.miniatura} aria-hidden>
    {html ? <div className={x.miniaturaPalco} style={{ transform: `scale(${escala})` }}><MolduraArtefato html={html} titulo={titulo} className={x.miniaturaMoldura} /></div>
      : <div className={x.miniaturaVazia}><Sparkles size={22} /></div>}
  </div>
}

export function GaleriaArtefatos() {
  useTituloDaAba('Artefatos · Otto')
  const { avisar, renomear, arquivar } = useNotas()
  const pessoas = usePessoas()
  const router = useRouter()
  const [lista, setLista] = useState<Resumo[] | null>(null)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [ordem, setOrdem] = useState<'recentes' | 'nome'>('recentes')
  const [menu, setMenu] = useState<{ ancora: HTMLElement; a: Resumo } | null>(null)
  const [buscando, setBuscando] = useState(false)

  const carregar = useCallback(() => {
    const q = new URLSearchParams({ filtro, ordem, ...(busca.trim() ? { busca: busca.trim() } : {}) })
    setBuscando(true)
    return notasApi<Resumo[]>(`/artefatos?${q}`).then(setLista).catch(e => { avisar((e as Error).message); setLista([]) }).finally(() => setBuscando(false))
  }, [busca, filtro, ordem, avisar])
  // Enquanto digita, a lista antiga fica esmaecida (sabe-se que está buscando), em vez de mostrar um resultado velho.
  const [digitando, setDigitando] = useState(false)
  useEffect(() => { const t = setTimeout(() => { setDigitando(false); void carregar() }, busca ? 220 : 0); return () => clearTimeout(t) }, [carregar, busca])
  const ocupado = buscando || digitando

  const nome = (id: string) => pessoas.find(p => p.id === id)?.nome ?? 'Alguém da equipe'
  const link = (a: Resumo) => `${location.origin}/artefatos/${a.id}`
  const publicar = async (a: Resumo) => {
    try {
      const c = await notasApi<{ publica: boolean; token: string | null }>(`/paginas/${a.id}/compartilhar`, { method: 'PATCH', json: { publica: !a.publica } })
      if (c.publica && c.token) { await navigator.clipboard.writeText(`${location.origin}/n/${c.token}`).catch(() => undefined); avisar('Publicado na web. Link copiado.') }
      else avisar('Não está mais publicado na web.')
      void carregar()
    } catch (e) { avisar((e as Error).message) }
  }

  return <div className={x.main}>
    <div className={x.scroll}>
      <div className={x.artefatosPagina}>
        <div className={x.artefatosTopo}>
          <div>
            <h1><Sparkles size={24} />Artefatos</h1>
            <p className={x.muted}>Painéis, relatórios e páginas interativas que o Claude ou o ChatGPT criaram para a empresa.</p>
          </div>
        </div>
        <div className={x.artefatosFerramentas}>
          <label className={x.artefatosBusca}>{ocupado ? <Loader2 size={15} className={x.spin} /> : <Search size={15} />}
            <input value={busca} onChange={e => { setBusca(e.target.value); setDigitando(true) }} placeholder="Buscar artefatos…" aria-label="Buscar artefatos" />
          </label>
          <div className={x.inboxAbas} role="tablist" aria-label="Filtro" style={{ border: 0, padding: 0 }}>
            {(['todos', 'meus', 'equipe'] as const).map(f => <button key={f} type="button" role="tab" aria-selected={filtro === f} onClick={() => setFiltro(f)}>
              {f === 'todos' ? 'Todos' : f === 'meus' ? 'Criados por mim' : 'Da equipe'}</button>)}
          </div>
          <span className={x.barSpacer} />
          <select className={x.barBtn} value={ordem} aria-label="Ordem" onChange={e => setOrdem(e.target.value as 'recentes' | 'nome')}>
            <option value="recentes">Mais recentes</option><option value="nome">Por nome</option>
          </select>
        </div>

        {lista === null && <div className={x.artefatosGrade}>{[0, 1, 2].map(i => <div key={i} className={`${x.artefatoCartao} ${x.artefatoCartaoCarregando}`} />)}</div>}
        {lista && !lista.length && !ocupado && <div className={x.artefatosVazio}>
          <Sparkles size={34} strokeWidth={1.4} />
          <b>{busca || filtro !== 'todos' ? 'Nenhum artefato encontrado' : 'Nenhum artefato ainda'}</b>
          {!busca && filtro === 'todos' && <span>
            Peça ao Claude ou ao ChatGPT, conectados ao Otto, algo como <i>“crie um artefato com um painel das vendas do mês”</i>.
            O artefato aparece aqui, pronto para a equipe abrir e compartilhar.
          </span>}
        </div>}
        {lista && lista.length > 0 && <div className={x.artefatosGrade} style={ocupado ? { opacity: .5, transition: 'opacity .15s' } : undefined} aria-busy={ocupado}>
          {lista.map(a => <div key={a.id} className={x.artefatoCartao}>
            <Link href={`/artefatos/${a.id}`} className={x.artefatoCartaoLink} aria-label={`Abrir ${tituloExibido(a.titulo)}`}>
              <Miniatura id={a.id} titulo={a.titulo} />
              <span className={x.artefatoCartaoInfo}>
                <b>{a.icone && <span>{a.icone}</span>}{tituloExibido(a.titulo)}</b>
                <small>{nome(a.atualizado_por)} · {editadoHa(a.atualizado_em).replace(/^Editado /, '')} · v{a.versao}{a.publica ? ' · na web' : ''}</small>
              </span>
            </Link>
            <button type="button" className={x.artefatoCartaoMais} aria-label="Ações do artefato" onClick={e => setMenu({ ancora: e.currentTarget, a })}><MoreHorizontal size={16} /></button>
          </div>)}
        </div>}
      </div>
    </div>
    {menu && <Menu ancora={menu.ancora} onFechar={() => setMenu(null)} alinhar="fim">
      <ItemMenu icone={Sparkles} onClick={() => { setMenu(null); router.push(`/artefatos/${menu.a.id}`) }}>Abrir</ItemMenu>
      {menu.a.pode_editar && <ItemMenu icone={PenLine} onClick={() => {
        const a = menu.a; setMenu(null)
        const novo = window.prompt('Novo nome do artefato', a.titulo)?.trim()
        if (novo && novo !== a.titulo) void renomear(a.id, novo).then(carregar)
      }}>Renomear</ItemMenu>}
      <ItemMenu icone={Copy} onClick={() => { const a = menu.a; setMenu(null); void navigator.clipboard.writeText(link(a)).then(() => avisar('Link copiado.')) }}>Copiar link</ItemMenu>
      {menu.a.pode_editar && <ItemMenu icone={menu.a.publica ? Check : Globe} onClick={() => { const a = menu.a; setMenu(null); void publicar(a) }}>
        {menu.a.publica ? 'Tirar da web' : 'Publicar na web'}</ItemMenu>}
      {menu.a.pode_editar && <ItemMenu icone={Trash2} perigo onClick={() => { const a = menu.a; setMenu(null); void arquivar(a.id).then(carregar) }}>Mover para a lixeira</ItemMenu>}
    </Menu>}
  </div>
}
