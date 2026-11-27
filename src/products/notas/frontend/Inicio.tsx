'use client'

import Link from 'next/link'
import { ChevronsRight, Clock, Plus } from 'lucide-react'
import { tituloExibido } from '@/products/notas/shared/arvore'
import { IconePagina } from './IconePagina'
import { useNotas } from './NotasProvider'
import { useTituloDaAba } from './local'
import x from './notas.module.css'

/** Início das Notas: saudação, páginas visitadas recentemente e criar uma nova. */
export function Inicio() {
  const { arvore, criar, recolhida, setRecolhida } = useNotas()
  useTituloDaAba('Notas · Otto')
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const recentes = (arvore?.recentes ?? []).map(id => arvore?.paginas.find(p => p.id === id)).filter(Boolean)
  return <div className={x.main}>
    {recolhida && <header className={x.top}><button type="button" className={x.topBtn} aria-label="Mostrar a barra lateral" onClick={() => setRecolhida(false)}><ChevronsRight size={18} /></button></header>}
    <div className={x.scroll}>
      <div className={x.home}>
        <h1>{saudacao}</h1>
        <div className={x.homeLabel}><Clock size={14} />Visitados recentemente</div>
        <div className={x.cards}>
          {recentes.map(p => <Link key={p!.id} href={`/notas/${p!.id}`} className={x.card}>
            <span className={x.cardTop} />
            <span className={x.cardIcon}><IconePagina icone={p!.icone} tipo={p!.tipo} tamanho={p!.icone ? 26 : 22} /></span>
            <span className={x.cardTitle}>{tituloExibido(p!.titulo)}</span>
          </Link>)}
          <button type="button" className={`${x.card} ${x.cardNew}`} onClick={() => void criar({ espaco: arvore?.pode_editar_equipe === false ? 'particular' : 'equipe' })}>
            <Plus size={18} />Nova página
          </button>
        </div>
      </div>
    </div>
  </div>
}
