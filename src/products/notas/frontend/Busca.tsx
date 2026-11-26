'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Search } from 'lucide-react'
import { caminho, tituloExibido } from '@/products/notas/shared/arvore'
import { notasApi, type ResultadoBusca } from './api'
import { useNotas } from './NotasProvider'
import x from './notas.module.css'

/** Busca (Ctrl+K): sem texto mostra as recentes; com texto busca no título e no conteúdo. Setas e Enter navegam. */
export function Busca() {
  const { buscaAberta } = useNotas()
  return buscaAberta ? <JanelaBusca /> : null
}

function JanelaBusca() {
  const { setBuscaAberta, arvore } = useNotas()
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusca[] | null>(null)
  const [indice, setIndice] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => { input.current?.focus() }, [])
  useEffect(() => {
    if (!texto.trim()) return
    let ativo = true
    const t = setTimeout(() => notasApi<ResultadoBusca[]>(`/busca?q=${encodeURIComponent(texto)}`)
      .then(r => { if (ativo) { setResultados(r); setIndice(0) } }).catch(() => { if (ativo) setResultados([]) }), 180)
    return () => { ativo = false; clearTimeout(t) }
  }, [texto])

  const recentes = useMemo(() => (arvore?.recentes ?? []).map(id => arvore?.paginas.find(p => p.id === id)).filter(Boolean)
    .map(p => ({ id: p!.id, titulo: p!.titulo, icone: p!.icone, trecho: '' })), [arvore])
  const buscando = Boolean(texto.trim())
  const lista = buscando ? resultados ?? [] : recentes
  const local = (id: string) => {
    const trilha = arvore ? caminho(arvore.paginas, id).slice(0, -1) : []
    return trilha.map(p => tituloExibido(p.titulo)).join(' / ')
  }
  const abrir = (id: string) => { setBuscaAberta(false); router.push(`/notas/${id}`) }

  return <div className={x.overlay} onMouseDown={e => { if (e.target === e.currentTarget) setBuscaAberta(false) }}>
    <div className={x.search} role="dialog" aria-modal="true" aria-label="Buscar nas notas">
      <label className={x.searchInput}>
        <Search size={18} />
        <input ref={input} value={texto} placeholder="Buscar ou ir para…" aria-label="Buscar"
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') setBuscaAberta(false)
            if (e.key === 'ArrowDown') { e.preventDefault(); setIndice(i => Math.min(lista.length - 1, i + 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setIndice(i => Math.max(0, i - 1)) }
            if (e.key === 'Enter' && lista[indice]) abrir(lista[indice].id)
          }} />
      </label>
      <div className={x.searchList} role="listbox">
        {!texto.trim() && <div className={x.menuLabel}>Recentes</div>}
        {!lista.length && <div className={x.searchEmpty}>{buscando ? (resultados ? 'Nenhum resultado.' : 'Buscando…') : 'Abra uma página para ela aparecer aqui.'}</div>}
        {lista.map((item, i) => <button key={item.id} type="button" role="option" aria-selected={i === indice} data-selected={i === indice}
          className={x.searchItem} onMouseEnter={() => setIndice(i)} onClick={() => abrir(item.id)}>
          <span>{item.icone ?? <FileText size={18} />}</span>
          <div>
            <b>{tituloExibido(item.titulo)}</b>
            {item.trecho ? <small>{item.trecho.replace(/[«»]/g, '')}</small> : local(item.id) && <small>{local(item.id)}</small>}
          </div>
        </button>)}
      </div>
    </div>
  </div>
}
