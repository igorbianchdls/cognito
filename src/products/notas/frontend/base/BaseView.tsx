'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpDown, Columns3, Copy, Filter, List, Loader2, PenLine, Plus, Search, SlidersHorizontal, Table2, Trash2, type LucideIcon } from 'lucide-react'
import { filtrar, novoId, ordenar, TITULO, type TipoVisao, type Visao } from '@/products/notas/shared/bases'
import { tituloExibido } from '@/products/notas/shared/arvore'
import { ItemMenu, Menu } from '../Menu'
import { useLocal } from '../local'
import { PaginaView } from '../PaginaView'
import { MenuFiltros, MenuOrdenacao, MenuPropriedades } from './Barra'
import { usePessoas } from './pessoas'
import { useBase } from './useBase'
import { Lista, Quadro, Tabela, type VistaProps } from './Vistas'
import x from '../notas.module.css'

export const ICONE_VISAO: Record<TipoVisao, LucideIcon> = { tabela: Table2, quadro: Columns3, lista: List }
const NOME_VISAO: Record<TipoVisao, string> = { tabela: 'Tabela', quadro: 'Quadro', lista: 'Lista' }

/** Valores que um item novo recebe para continuar aparecendo na visão filtrada (filtros "é", "contém" e "marcado"). */
function valoresDosFiltros(visao: Visao) {
  if (visao.juncao === 'ou') return {}
  const valores: Record<string, unknown> = {}
  for (const f of visao.filtros) {
    if (f.prop === TITULO || f.valor === null || f.valor === undefined || f.valor === '') { if (f.operador === 'marcado') valores[f.prop] = true; continue }
    if (f.operador === 'igual' && typeof f.valor === 'string') valores[f.prop] = f.valor
    if (f.operador === 'tem') valores[f.prop] = [f.valor]
  }
  return valores
}

/**
 * Base de dados: abas das visões, filtros, ordenação, propriedades, busca, "Novo" e a visão escolhida. Clicar num
 * item abre ele ao lado (como o "side peek" do Notion). `embutida` = dentro de outra página (bloco "/base").
 */
export function BaseView({ id, embutida }: { id: string; embutida?: boolean }) {
  const api = useBase(id)
  const pessoas = usePessoas()
  const [visaoSalva, setVisaoSalva] = useLocal<string | null>(`notas:visao:${id}`, null)
  const [menu, setMenu] = useState<{ tipo: 'filtros' | 'ordenacao' | 'propriedades' | 'novaVisao' | 'visao'; ancora: HTMLElement } | null>(null)
  const [busca, setBusca] = useState<string | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const dados = api.dados

  const visao = dados?.base.visoes.find(v => v.id === visaoSalva) ?? dados?.base.visoes[0]
  const itens = useMemo(() => !dados || !visao ? [] : ordenar(filtrar(dados.itens, visao, dados.base.esquema, busca ?? ''), visao.ordenacao, dados.base.esquema),
    [dados, visao, busca])

  if (api.erro && !dados) return <div className={x.empty} style={{ height: 'auto', padding: 16 }}>{api.erro}</div>
  if (!dados || !visao) return <div style={{ padding: 16 }}><Loader2 size={18} className={x.spin} /></div>
  const { base } = dados
  const editavel = base.pode_editar && !base.bloqueada && !base.arquivada_em
  const mudarVisao = (m: Partial<Visao>) => api.mudarVisao(visao.id, m)
  const props: VistaProps = { api, base, visao, itens, pessoas, editavel, abrir: setAberto, valoresNovos: valoresDosFiltros(visao) }
  const Vista = visao.tipo === 'quadro' ? Quadro : visao.tipo === 'lista' ? Lista : Tabela

  const novaVisao = (tipo: TipoVisao) => {
    const nova: Visao = {
      id: novoId(), nome: NOME_VISAO[tipo], tipo, filtros: [], juncao: 'e', ordenacao: [], visiveis: base.esquema.map(p => p.id).slice(0, 6),
      agruparPor: tipo === 'quadro' ? base.esquema.find(p => p.tipo === 'status')?.id ?? base.esquema.find(p => p.tipo === 'selecao')?.id ?? null : null,
      larguras: {}, calculos: {}, colunasOcultas: [],
    }
    void api.salvarBase({ visoes: [...base.visoes, nova] }); setVisaoSalva(nova.id); setMenu(null)
  }

  return <div className={`${x.base} ${embutida ? x.baseEmbed : ''}`} contentEditable={false} suppressContentEditableWarning>
    {embutida && <div className={x.baseTitle}><Link href={`/notas/${id}`}>{base.icone ? `${base.icone} ` : ''}{tituloExibido(base.titulo)}</Link></div>}
    <div className={x.baseBar}>
      <div className={x.viewTabs} role="tablist" aria-label="Visões">
        {base.visoes.map(v => {
          const Icone = ICONE_VISAO[v.tipo]
          return <button key={v.id} type="button" role="tab" aria-selected={v.id === visao.id} className={`${x.viewTab} ${v.id === visao.id ? x.viewTabOn : ''}`}
            onClick={e => { if (v.id === visao.id && editavel) setMenu({ tipo: 'visao', ancora: e.currentTarget }); else setVisaoSalva(v.id) }}>
            <Icone size={14} />{v.nome}
          </button>
        })}
        {editavel && <button type="button" className={x.barBtn} aria-label="Nova visão" title="Nova visão" onClick={e => setMenu({ tipo: 'novaVisao', ancora: e.currentTarget })}><Plus size={16} /></button>}
      </div>
      <span className={x.barSpacer} />
      <button type="button" className={`${x.barBtn} ${visao.filtros.length ? x.barBtnOn : ''}`} onClick={e => setMenu({ tipo: 'filtros', ancora: e.currentTarget })} title="Filtrar">
        <Filter size={15} />{visao.filtros.length ? visao.filtros.length : ''}<span className="sr-only">Filtrar</span>
      </button>
      <button type="button" className={`${x.barBtn} ${visao.ordenacao.length ? x.barBtnOn : ''}`} onClick={e => setMenu({ tipo: 'ordenacao', ancora: e.currentTarget })} title="Ordenar">
        <ArrowUpDown size={15} /><span className="sr-only">Ordenar</span>
      </button>
      {busca === null
        ? <button type="button" className={x.barBtn} onClick={() => setBusca('')} title="Buscar"><Search size={15} /><span className="sr-only">Buscar</span></button>
        : <span className={x.barBtn}><Search size={15} /><input autoFocus className={x.barSearch} value={busca} placeholder="Digite para buscar…" aria-label="Buscar na base"
          onChange={e => setBusca(e.target.value)} onBlur={() => { if (!busca) setBusca(null) }} onKeyDown={e => { if (e.key === 'Escape') setBusca(null) }} /></span>}
      <button type="button" className={x.barBtn} onClick={e => setMenu({ tipo: 'propriedades', ancora: e.currentTarget })} title="Propriedades e agrupamento">
        <SlidersHorizontal size={15} /><span className="sr-only">Propriedades</span>
      </button>
      {editavel && <span className={x.newBtn}><button type="button" onClick={() => void api.novoItem(props.valoresNovos).then(i => i && setAberto(i.id))}>Novo</button></span>}
    </div>

    <Vista {...props} />

    {menu?.tipo === 'filtros' && <MenuFiltros ancora={menu.ancora} visao={visao} esquema={base.esquema} onFechar={() => setMenu(null)} onMudar={mudarVisao} />}
    {menu?.tipo === 'ordenacao' && <MenuOrdenacao ancora={menu.ancora} visao={visao} esquema={base.esquema} onFechar={() => setMenu(null)} onMudar={mudarVisao} />}
    {menu?.tipo === 'propriedades' && <MenuPropriedades ancora={menu.ancora} visao={visao} esquema={base.esquema} onFechar={() => setMenu(null)} onMudar={mudarVisao} />}
    {menu?.tipo === 'novaVisao' && <Menu ancora={menu.ancora} onFechar={() => setMenu(null)}>
      <div className={x.menuLabel}>Nova visão</div>
      {(['tabela', 'quadro', 'lista'] as const).map(t => <ItemMenu key={t} icone={ICONE_VISAO[t]} onClick={() => novaVisao(t)}>{NOME_VISAO[t]}</ItemMenu>)}
    </Menu>}
    {menu?.tipo === 'visao' && <Menu ancora={menu.ancora} onFechar={() => setMenu(null)}>
      <input autoFocus className={x.menuInput} defaultValue={visao.nome} aria-label="Nome da visão" maxLength={100}
        onBlur={e => { const nome = e.target.value.trim(); if (nome && nome !== visao.nome) mudarVisao({ nome }) }}
        onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur(); setMenu(null) } }} />
      <div className={x.menuLabel}>Mostrar como</div>
      {(['tabela', 'quadro', 'lista'] as const).map(t => <ItemMenu key={t} icone={ICONE_VISAO[t]} direita={visao.tipo === t ? <span style={{ marginLeft: 'auto' }}>✓</span> : undefined}
        onClick={() => { mudarVisao({ tipo: t }); setMenu(null) }}>{NOME_VISAO[t]}</ItemMenu>)}
      <div className={x.menuSep} />
      <ItemMenu icone={PenLine} onClick={() => setMenu(null)}>Concluir</ItemMenu>
      <ItemMenu icone={Copy} onClick={() => {
        const copia = { ...visao, id: novoId(), nome: `${visao.nome} (cópia)`.slice(0, 100) }
        void api.salvarBase({ visoes: [...base.visoes, copia] }); setVisaoSalva(copia.id); setMenu(null)
      }}>Duplicar visão</ItemMenu>
      {base.visoes.length > 1 && <ItemMenu icone={Trash2} perigo onClick={() => {
        void api.salvarBase({ visoes: base.visoes.filter(v => v.id !== visao.id) }); setVisaoSalva(null); setMenu(null)
      }}>Excluir visão</ItemMenu>}
    </Menu>}

    {aberto && <div className={x.peek} role="dialog" aria-label="Item da base">
      <PaginaView key={aberto} id={aberto} lateral onFechar={() => { setAberto(null); void api.carregar() }} />
    </div>}
  </div>
}
