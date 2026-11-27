'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronsRight, Clock, FileText, FileUp, LayoutGrid, ListChecks, Plus } from 'lucide-react'
import { caminho, tituloExibido, type PaginaResumo } from '@/products/notas/shared/arvore'
import { MODELOS_PAGINA, conteudoDoModelo } from '@/products/notas/shared/modelos'
import { editadoHa, notasApi, type Pagina } from './api'
import { estiloCapa } from './catalogo'
import { ABRIR_IMPORTACAO } from './eventos'
import { IconePagina } from './IconePagina'
import { useNotas } from './NotasProvider'
import { useTituloDaAba } from './local'
import x from './notas.module.css'

/**
 * Início das Notas: saudação e as páginas visitadas recentemente (ou as da equipe, se ainda não abriu nenhuma).
 * Sem nenhuma página ainda: boas-vindas com jeitos rápidos de começar.
 */
export function Inicio() {
  const { arvore, criar, recolhida, setRecolhida, recarregar, avisar } = useNotas()
  const router = useRouter()
  const [criando, setCriando] = useState(false)
  useTituloDaAba('Notas · Otto')
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const espaco = arvore?.pode_editar_equipe === false ? 'particular' : 'equipe'
  const recentes = (arvore?.recentes ?? []).map(id => arvore?.paginas.find(p => p.id === id)).filter((p): p is PaginaResumo => Boolean(p))
  const daEquipe = (arvore?.paginas ?? []).filter(p => !p.parent_id && !p.base_id)
    .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? '')).slice(0, 8)
  const cartoes = recentes.length ? recentes : daEquipe
  const vazio = arvore !== null && !arvore.paginas.length

  const local = (p: PaginaResumo) => {
    const maes = arvore ? caminho(arvore.paginas, p.id).slice(0, -1) : []
    return maes.length ? maes.map(m => tituloExibido(m.titulo)).join(' / ') : p.espaco === 'particular' ? 'Particular' : 'Equipe'
  }

  /** Começar com um modelo ou uma base pronta (das boas-vindas). */
  const comecar = async (como: 'reuniao' | 'tarefas') => {
    if (criando) return
    setCriando(true)
    try {
      let id: string
      if (como === 'tarefas') {
        id = (await notasApi<{ base: Pagina }>('/bases', { method: 'POST', json: { modelo: 'tarefas', visao: 'quadro', titulo: 'Tarefas', espaco } })).base.id
      } else {
        const modelo = MODELOS_PAGINA.find(m => m.id === como)!
        const pagina = await notasApi<Pagina>('/paginas', { method: 'POST', json: { titulo: modelo.titulo, icone: modelo.icone, espaco } })
        await notasApi(`/paginas/${pagina.id}`, { method: 'PATCH', json: { versao: pagina.versao, conteudo: conteudoDoModelo(modelo) } })
        id = pagina.id
      }
      await recarregar()
      router.push(`/notas/${id}`)
    } catch (e) { avisar((e as Error).message) } finally { setCriando(false) }
  }

  return <div className={x.main}>
    {recolhida && <header className={`${x.top} ${x.soComputadorFlex}`}><button type="button" className={x.topBtn} aria-label="Mostrar a barra lateral" onClick={() => setRecolhida(false)}><ChevronsRight size={18} /></button></header>}
    <div className={x.scroll}>
      <div className={x.home}>
        <h1>{vazio ? 'Boas-vindas às Notas' : saudacao}</h1>
        {vazio ? <>
          <p className={x.homeIntro}>Documentos, wikis e bases de dados da empresa num lugar só. Escreva, organize em páginas dentro de páginas e acompanhe tarefas com a equipe.</p>
          <div className={x.homeLabel}>Comece por aqui</div>
          <div className={x.comecos}>
            <button type="button" disabled={criando} onClick={() => void criar({ espaco })}><FileText size={20} /><b>Página em branco</b><span>Escreva com “/” para inserir títulos, listas, imagens e mais.</span></button>
            <button type="button" disabled={criando} onClick={() => void comecar('reuniao')}><span className={x.comecoEmoji}>🗓️</span><b>Ata de reunião</b><span>Pauta, decisões e próximos passos, com a data de hoje.</span></button>
            <button type="button" disabled={criando} onClick={() => void comecar('tarefas')}><ListChecks size={20} /><b>Quadro de tarefas</b><span>Status, responsável, prazo e prioridade, em quadro e tabela.</span></button>
            <button type="button" disabled={criando} onClick={() => window.dispatchEvent(new Event(ABRIR_IMPORTACAO))}><FileUp size={20} /><b>Trazer do Notion</b><span>Importe o ZIP exportado do Notion, Markdown ou CSV.</span></button>
          </div>
        </> : <>
          <div className={x.homeLabel}>{recentes.length ? <><Clock size={14} />Visitados recentemente</> : <><LayoutGrid size={14} />Páginas da equipe</>}</div>
          <div className={x.cards}>
            {cartoes.map(p => {
              const capa = p.capa ? estiloCapa(p.capa) : null
              return <Link key={p.id} href={`/notas/${p.id}`} className={x.card}>
                <span className={`${x.cardTop} ${capa ? '' : x.cardTopVazio}`} style={capa ?? undefined} />
                <span className={x.cardIcon}><IconePagina icone={p.icone} tipo={p.tipo} tamanho={p.icone ? 26 : 20} /></span>
                <span className={x.cardTitle}>{tituloExibido(p.titulo)}</span>
                <span className={x.cardMeta}>{local(p)}{p.updated_at ? ` · ${editadoHa(p.updated_at).replace(/^Editado /, '')}` : ''}</span>
              </Link>
            })}
            <button type="button" className={`${x.card} ${x.cardNew}`} onClick={() => void criar({ espaco })}>
              <Plus size={18} />Nova página
            </button>
          </div>
        </>}
      </div>
    </div>
  </div>
}
