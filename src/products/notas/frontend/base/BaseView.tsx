'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpDown, CalendarDays, GanttChart, ChevronDown, Columns3, Copy, FileText, Filter, LayoutGrid, List, Loader2, PenLine, Plus, Search, SlidersHorizontal, Table2, Trash2, type LucideIcon } from 'lucide-react'
import { computar, filtrar, novoId, ordenar, SEM_VALOR, TIPOS_VISAO, TITULO, type TipoVisao, type Visao } from '@/products/notas/shared/bases'
import { tituloExibido } from '@/products/notas/shared/arvore'
import { ItemMenu, Menu } from '../Menu'
import { useLocal } from '../local'
import { PaginaView } from '../PaginaView'
import { MenuFiltros, MenuOrdenacao, MenuPropriedades } from './Barra'
import { usePessoas } from './pessoas'
import { useBase } from './useBase'
import { Calendario, Galeria, LinhaDoTempo, Lista, Quadro, Tabela, type VistaProps } from './Vistas'
import { LigadasContexto } from './ligadas'
import x from '../notas.module.css'

export const ICONE_VISAO: Record<TipoVisao, LucideIcon> = { tabela: Table2, quadro: Columns3, lista: List, galeria: LayoutGrid, calendario: CalendarDays, linha_tempo: GanttChart }
const NOME_VISAO: Record<TipoVisao, string> = { tabela: 'Tabela', quadro: 'Quadro', lista: 'Lista', galeria: 'Galeria', calendario: 'Calendário', linha_tempo: 'Linha do tempo' }

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
  const [menu, setMenu] = useState<{ tipo: 'filtros' | 'ordenacao' | 'propriedades' | 'novaVisao' | 'visao' | 'modelos'; ancora: HTMLElement } | null>(null)
  const [busca, setBusca] = useState<string | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  // Esc fecha o item aberto ao lado (como no Notion), se não estiver digitando nem com um menu aberto.
  useEffect(() => {
    if (!aberto) return
    const fechar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      const alvo = document.activeElement as HTMLElement | null
      if (alvo?.closest('input, textarea, select, [contenteditable=true]')) return
      if (document.querySelector('[role=menu], [role=listbox], .bn-suggestion-menu, [role=dialog][aria-modal=true]')) return
      setAberto(null); void api.carregar()
    }
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [aberto, api])
  const dados = api.dados

  const visao = dados?.base.visoes.find(v => v.id === visaoSalva) ?? dados?.base.visoes[0]
  // Fórmulas e agregações são calculadas aqui (com as bases ligadas) antes de filtrar e ordenar.
  const calculados = useMemo(() => dados ? computar(dados.itens.filter(i => !i.e_modelo), dados.base.esquema, dados.ligadas ?? []) : [], [dados])
  const modelos = useMemo(() => (dados?.itens ?? []).filter(i => i.e_modelo), [dados])
  const ligadas = useMemo(() => new Map((dados?.ligadas ?? []).map(b => [b.id, b])), [dados])
  const itens = useMemo(() => !dados || !visao ? [] : ordenar(filtrar(calculados, visao, dados.base.esquema, busca ?? ''), visao.ordenacao, dados.base.esquema),
    [dados, visao, busca, calculados])

  if (api.erro && !dados) return <div className={x.empty} style={{ height: 'auto', padding: 16 }}>{api.erro}</div>
  if (!dados || !visao) return <div style={{ padding: 16 }}><Loader2 size={18} className={x.spin} /></div>
  const { base } = dados
  const editavel = base.pode_editar && !base.bloqueada && !base.arquivada_em
  const mudarVisao = (m: Partial<Visao>) => api.mudarVisao(visao.id, m)
  const props: VistaProps = { api, base, visao, itens, pessoas, editavel, abrir: setAberto, valoresNovos: valoresDosFiltros(visao) }
  // Só conta filtro completo (com valor, ou "está vazio"/"marcado"): o que ainda está sendo montado não filtra nada.
  const filtrosAtivos = visao.filtros.filter(f => SEM_VALOR.includes(f.operador) || (f.valor !== undefined && f.valor !== null && f.valor !== '')).length
  const Vista = { tabela: Tabela, quadro: Quadro, lista: Lista, galeria: Galeria, calendario: Calendario, linha_tempo: LinhaDoTempo }[visao.tipo]

  const novaVisao = (tipo: TipoVisao) => {
    const nova: Visao = {
      id: novoId(), nome: NOME_VISAO[tipo], tipo, filtros: [], juncao: 'e', ordenacao: [], visiveis: base.esquema.map(p => p.id).slice(0, 6),
      agruparPor: tipo === 'quadro' ? base.esquema.find(p => p.tipo === 'status')?.id ?? base.esquema.find(p => p.tipo === 'selecao')?.id ?? null : null,
      dataPor: tipo === 'calendario' || tipo === 'linha_tempo' ? base.esquema.find(p => p.tipo === 'data')?.id ?? null : null,
      larguras: {}, calculos: {}, colunasOcultas: [], tamanhoCartao: 'medio', capaCartao: true,
    }
    void api.salvarBase({ visoes: [...base.visoes, nova] }); setVisaoSalva(nova.id); setMenu(null)
  }

  const novoDeModelo = (modeloId: string) => { setMenu(null); void api.novoItem(props.valoresNovos, undefined, '', { modelo_id: modeloId }).then(i => i && setAberto(i.id)) }
  const novoModelo = () => { setMenu(null); void api.novoItem({}, undefined, '', { e_modelo: true }).then(i => i && setAberto(i.id)) }

  return <LigadasContexto.Provider value={ligadas}><div className={`${x.base} ${embutida ? x.baseEmbed : ''}`} contentEditable={false} suppressContentEditableWarning>
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
      <button type="button" className={`${x.barBtn} ${filtrosAtivos ? x.barBtnOn : ''}`} onClick={e => setMenu({ tipo: 'filtros', ancora: e.currentTarget })} title="Filtrar">
        <Filter size={15} />{filtrosAtivos || ''}<span className="sr-only">Filtrar</span>
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
      {editavel && <span className={x.newBtn}>
        <button type="button" onClick={() => void api.novoItem(props.valoresNovos).then(i => i && setAberto(i.id))}>Novo</button>
        <button type="button" className={x.newArrow} aria-label="Novo a partir de um modelo" title="Modelos" onClick={e => setMenu({ tipo: 'modelos', ancora: e.currentTarget })}><ChevronDown size={14} /></button>
      </span>}
    </div>

    <Vista {...props} />

    {menu?.tipo === 'filtros' && <MenuFiltros ancora={menu.ancora} visao={visao} esquema={base.esquema} onFechar={() => setMenu(null)} onMudar={mudarVisao} />}
    {menu?.tipo === 'ordenacao' && <MenuOrdenacao ancora={menu.ancora} visao={visao} esquema={base.esquema} onFechar={() => setMenu(null)} onMudar={mudarVisao} />}
    {menu?.tipo === 'propriedades' && <MenuPropriedades ancora={menu.ancora} visao={visao} esquema={base.esquema} onFechar={() => setMenu(null)} onMudar={mudarVisao}
      onSubitens={editavel ? ligar => {
        // Subitens = relação da base com ela mesma ("Item pai" ↔ "Subitens"); a visão usa "Item pai" para a árvore.
        if (!ligar) { mudarVisao({ subitens: null }); return }
        const existente = base.esquema.find(p => p.tipo === 'relacao' && p.baseRelacionada === base.id && p.reciproca)
        if (existente) { mudarVisao({ subitens: existente.id }); return }
        const pai = novoId(), filhos = novoId()
        void api.salvarBase({
          esquema: [...base.esquema,
            { id: pai, nome: 'Item pai', tipo: 'relacao', baseRelacionada: base.id, reciproca: filhos },
            { id: filhos, nome: 'Subitens', tipo: 'relacao', baseRelacionada: base.id, reciproca: pai }],
          visoes: base.visoes.map(v => v.id === visao.id ? { ...v, subitens: pai } : v),
        })
      } : undefined} />}
    {menu?.tipo === 'novaVisao' && <Menu ancora={menu.ancora} onFechar={() => setMenu(null)}>
      <div className={x.menuLabel}>Nova visão</div>
      {TIPOS_VISAO.map(t => <ItemMenu key={t} icone={ICONE_VISAO[t]} onClick={() => novaVisao(t)}>{NOME_VISAO[t]}</ItemMenu>)}
    </Menu>}
    {menu?.tipo === 'visao' && <Menu ancora={menu.ancora} onFechar={() => setMenu(null)}>
      <input autoFocus className={x.menuInput} defaultValue={visao.nome} aria-label="Nome da visão" maxLength={100}
        onBlur={e => { const nome = e.target.value.trim(); if (nome && nome !== visao.nome) mudarVisao({ nome }) }}
        onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur(); setMenu(null) } }} />
      <div className={x.menuLabel}>Mostrar como</div>
      {TIPOS_VISAO.map(t => <ItemMenu key={t} icone={ICONE_VISAO[t]} direita={visao.tipo === t ? <span style={{ marginLeft: 'auto' }}>✓</span> : undefined}
        onClick={() => {
          mudarVisao({ tipo: t, ...((t === 'calendario' || t === 'linha_tempo') && !visao.dataPor ? { dataPor: base.esquema.find(p => p.tipo === 'data')?.id ?? null } : {}) }); setMenu(null)
        }}>{NOME_VISAO[t]}</ItemMenu>)}
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

    {menu?.tipo === 'modelos' && <Menu ancora={menu.ancora} onFechar={() => setMenu(null)} alinhar="fim">
      <div className={x.menuLabel}>Modelos de {tituloExibido(base.titulo)}</div>
      {modelos.map(m => <ItemMenu key={m.id} icone={m.icone ? undefined : FileText} onClick={() => novoDeModelo(m.id)}
        direita={<span role="button" tabIndex={0} className={x.rowBtn} style={{ marginLeft: 'auto', display: 'inline-flex' }} aria-label="Editar modelo" title="Editar modelo"
          onClick={e => { e.stopPropagation(); setMenu(null); setAberto(m.id) }} onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); setMenu(null); setAberto(m.id) } }}><PenLine size={14} /></span>}>
        {m.icone ? `${m.icone} ` : ''}{tituloExibido(m.titulo)}
      </ItemMenu>)}
      {!modelos.length && <div className={x.menuLabel} style={{ fontWeight: 400 }}>Modelos deixam o item novo já com texto, ícone e valores.</div>}
      <div className={x.menuSep} />
      <ItemMenu icone={Plus} onClick={novoModelo}>Novo modelo</ItemMenu>
    </Menu>}

    {aberto && <div className={x.peek} role="dialog" aria-label="Item da base">
      <PaginaView key={aberto} id={aberto} lateral onFechar={() => { setAberto(null); void api.carregar() }} />
    </div>}
  </div></LigadasContexto.Provider>
}
