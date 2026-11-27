'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, EyeOff, Maximize2, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { hierarquia, periodoDoItem, somarDias } from '@/products/notas/shared/bases'
import { estiloCapa } from '../catalogo'
import {
  agrupar, calcular, calculosDe, formatarNumero, NOME_CALCULO, novoId, TITULO, valorDe,
  type Calculo, type Item, type Propriedade, type TipoPropriedade, type Visao,
} from '@/products/notas/shared/bases'
import { posicaoEntre, tituloExibido } from '@/products/notas/shared/arvore'
import type { Pagina } from '../api'
import { IconePagina } from '../IconePagina'
import { ItemMenu, Menu } from '../Menu'
import { Celula, ICONE_TIPO, Valor } from './Celula'
import { ListaTipos, MenuPropriedade } from './MenuPropriedade'
import type { Pessoa } from './pessoas'
import type { BaseApi } from './useBase'
import x from '../notas.module.css'

export type VistaProps = {
  api: BaseApi; base: Pagina; visao: Visao; itens: Item[]; pessoas: Pessoa[]; editavel: boolean
  abrir: (id: string) => void
  /** Valores que um item novo recebe (os filtros "é" da visão, como no Notion). */
  valoresNovos: Record<string, unknown>
}

const LARGURA_TITULO = 280, LARGURA = 200

/** Menu de um item (botão direito ou ⋯): abrir e mandar para a lixeira. */
function MenuItem({ ancora, onFechar, onAbrir, onArquivar, editavel, onSubitem }: {
  ancora: HTMLElement | { x: number; y: number }; onFechar: () => void; onAbrir: () => void; onArquivar: () => void; editavel: boolean; onSubitem?: () => void
}) {
  return <Menu ancora={ancora} onFechar={onFechar}>
    <ItemMenu icone={Maximize2} onClick={() => { onFechar(); onAbrir() }}>Abrir</ItemMenu>
    {editavel && onSubitem && <ItemMenu icone={Plus} onClick={() => { onFechar(); onSubitem() }}>Novo subitem</ItemMenu>}
    {editavel && <ItemMenu icone={Trash2} perigo onClick={() => { onFechar(); onArquivar() }}>Mover para a lixeira</ItemMenu>}
  </Menu>
}

/** "+" no fim do cabeçalho: nome e tipo da propriedade nova (entra visível nesta visão). */
function NovaPropriedade({ ancora, api, base, visao, onFechar }: { ancora: HTMLElement; api: BaseApi; base: Pagina; visao: Visao; onFechar: () => void }) {
  const [nome, setNome] = useState('')
  const criar = (tipo: TipoPropriedade, extra: Partial<Propriedade> = {}) => {
    const id = novoId()
    const nomeFinal = nome.trim() || `Propriedade ${base.esquema.length + 1}`
    if (base.esquema.some(p => p.nome.toLowerCase() === nomeFinal.toLowerCase())) return
    void api.salvarBase({
      esquema: [...base.esquema, { id, nome: nomeFinal, tipo, ...(['selecao', 'multisselecao', 'status'].includes(tipo) ? { opcoes: [] } : {}), ...extra }],
      visoes: base.visoes.map(v => v.id === visao.id ? { ...v, visiveis: [...v.visiveis, id] } : v),
    })
    onFechar()
  }
  return <Menu ancora={ancora} onFechar={onFechar} className={x.menuWide} alinhar="fim">
    <input autoFocus className={x.menuInput} value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da propriedade" aria-label="Nome da propriedade" maxLength={100} />
    <ListaTipos onEscolher={criar} />
  </Menu>
}

/** Tabela: colunas com tipo, largura ajustável, células editáveis, "+ Novo" e cálculos no rodapé. */
export function Tabela({ api, base, visao, itens, pessoas, editavel, abrir, valoresNovos }: VistaProps) {
  const [menuCol, setMenuCol] = useState<{ ancora: HTMLElement; prop: Propriedade | null } | null>(null)
  const [novaProp, setNovaProp] = useState<HTMLElement | null>(null)
  const [menuCalc, setMenuCalc] = useState<{ ancora: HTMLElement; col: string; tipo: TipoPropriedade | 'titulo' } | null>(null)
  const [menuLinha, setMenuLinha] = useState<{ ancora: { x: number; y: number }; id: string } | null>(null)
  const [arrastandoCol, setArrastandoCol] = useState<{ col: string; x: number; largura: number; atual: number } | null>(null)
  const [editarTitulo, setEditarTitulo] = useState<string | null>(null)
  const [fechados, setFechados] = useState<Set<string>>(new Set())
  // Subitens: a ordem vira a da árvore (mãe e depois as filhas), com recuo; filhas de mãe fechada somem.
  const linhas = (() => {
    if (!visao.subitens) return itens.map(item => ({ item, nivel: 0, temFilhos: false }))
    const todas = hierarquia(itens, visao.subitens)
    const saida: typeof todas = []
    let escondendo: number | null = null
    for (const l of todas) {
      if (escondendo !== null && l.nivel > escondendo) continue
      escondendo = null
      saida.push(l)
      if (l.temFilhos && fechados.has(l.item.id)) escondendo = l.nivel
    }
    return saida
  })()

  const colunas = [TITULO, ...visao.visiveis.filter(v => base.esquema.some(p => p.id === v))]
  const largura = (col: string) => arrastandoCol?.col === col ? arrastandoCol.atual : visao.larguras?.[col] ?? (col === TITULO ? LARGURA_TITULO : LARGURA)

  // Arrastar a borda do cabeçalho muda a largura da coluna (salva na visão ao soltar).
  const arrasto = useRef(arrastandoCol)
  useEffect(() => { arrasto.current = arrastandoCol }, [arrastandoCol])
  const ativo = arrastandoCol !== null
  useEffect(() => {
    if (!ativo) return
    const mover = (e: MouseEvent) => setArrastandoCol(a => a && { ...a, atual: Math.max(80, Math.min(1000, a.largura + e.clientX - a.x)) })
    const soltar = () => {
      const a = arrasto.current
      if (a) api.mudarVisao(visao.id, { larguras: { ...visao.larguras, [a.col]: Math.round(a.atual) } })
      setArrastandoCol(null)
    }
    window.addEventListener('mousemove', mover); window.addEventListener('mouseup', soltar)
    return () => { window.removeEventListener('mousemove', mover); window.removeEventListener('mouseup', soltar) }
  }, [ativo, api, visao.id, visao.larguras])

  const novo = async () => { const item = await api.novoItem(valoresNovos); if (item) setEditarTitulo(item.id) }

  return <div className={x.table} role="grid" aria-label={visao.nome}>
    <div className={x.tableInner}>
      <div className={`${x.tr} ${x.headRow}`} role="row">
        {colunas.map(col => {
          const prop = base.esquema.find(p => p.id === col) ?? null
          const Icone = ICONE_TIPO[prop?.tipo ?? 'titulo']
          return <div key={col} className={x.th} style={{ width: largura(col) }} role="columnheader" onClick={e => setMenuCol({ ancora: e.currentTarget, prop })}>
            <Icone size={14} /><span>{prop?.nome ?? 'Nome'}</span>
            <span className={x.colResize} onClick={e => e.stopPropagation()}
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setArrastandoCol({ col, x: e.clientX, largura: largura(col), atual: largura(col) }) }} />
          </div>
        })}
        {editavel && <div className={`${x.th} ${x.thAdd}`} role="columnheader" aria-label="Nova propriedade" title="Nova propriedade" onClick={e => setNovaProp(e.currentTarget)}><Plus size={16} /></div>}
      </div>
      {linhas.map(({ item, nivel, temFilhos }) => <div key={item.id} className={x.tr} role="row" onContextMenu={e => { e.preventDefault(); setMenuLinha({ ancora: { x: e.clientX, y: e.clientY }, id: item.id }) }}>
        {colunas.map(col => {
          const prop = base.esquema.find(p => p.id === col) ?? null
          const recuo = !prop && visao.subitens ? <span className={x.subRecuo} style={{ width: nivel * 20 + 20 }}>
            {temFilhos && <button type="button" className={`${x.subSeta} ${fechados.has(item.id) ? '' : x.subSetaAberta}`}
              aria-label={fechados.has(item.id) ? 'Mostrar subitens' : 'Esconder subitens'}
              onClick={e => { e.stopPropagation(); setFechados(f => { const n = new Set(f); if (n.has(item.id)) n.delete(item.id); else n.add(item.id); return n }) }}><ChevronRight size={14} /></button>}
          </span> : null
          return <Celula key={col} item={item} prop={prop} pessoas={pessoas} editavel={editavel} antes={recuo}
            className={`${x.td} ${prop ? '' : x.tdTitle}`} style={{ width: largura(col) }}
            comecarEditando={!prop && editarTitulo === item.id}
            onMudar={valor => prop && void api.mudarItem(item.id, { propriedades: { [prop.id]: valor } })}
            onTitulo={titulo => { setEditarTitulo(null); void api.mudarItem(item.id, { titulo }) }}
            criarOpcao={nome => prop ? api.criarOpcao(prop.id, nome) : Promise.resolve(null)}
            onAbrir={prop ? undefined : () => abrir(item.id)} />
        })}
      </div>)}
      {editavel && <button type="button" className={x.newRow} onClick={() => void novo()}><Plus size={16} />Novo</button>}
      <div className={x.calcRow}>
        {colunas.map(col => {
          const prop = base.esquema.find(p => p.id === col)
          const calculo = visao.calculos?.[col] ?? 'nenhum'
          const valor = calculo === 'nenhum' ? null : calcular(itens, col, calculo, base.esquema)
          const texto = valor === null ? '' : calculo === 'pct_marcados' ? `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
            : prop?.tipo === 'numero' && ['soma', 'media', 'minimo', 'maximo'].includes(calculo) ? formatarNumero(valor, prop.formato) : valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
          return <button key={col} type="button" className={`${x.calc} ${calculo !== 'nenhum' ? x.calcSet : ''}`} style={{ width: largura(col) }}
            onClick={e => setMenuCalc({ ancora: e.currentTarget, col, tipo: prop?.tipo ?? 'titulo' })}>
            {calculo === 'nenhum' ? 'Calcular' : <>{NOME_CALCULO[calculo]} <b>{texto}</b></>}
          </button>
        })}
      </div>
    </div>
    {menuCol && <MenuPropriedade ancora={menuCol.ancora} prop={menuCol.prop} esquema={base.esquema} visao={visao} editavel={editavel} onFechar={() => setMenuCol(null)}
      onMudar={m => menuCol.prop && api.mudarPropriedade(menuCol.prop.id, m)}
      onExcluir={() => menuCol.prop && void api.salvarBase({ esquema: base.esquema.filter(p => p.id !== menuCol.prop!.id) })}
      onMudarVisao={m => api.mudarVisao(visao.id, m)} />}
    {novaProp && <NovaPropriedade ancora={novaProp} api={api} base={base} visao={visao} onFechar={() => setNovaProp(null)} />}
    {menuCalc && <Menu ancora={menuCalc.ancora} onFechar={() => setMenuCalc(null)}>
      {calculosDe(menuCalc.tipo).map(c => <ItemMenu key={c} onClick={() => { api.mudarVisao(visao.id, { calculos: { ...visao.calculos, [menuCalc.col]: c as Calculo } }); setMenuCalc(null) }}
        direita={(visao.calculos?.[menuCalc.col] ?? 'nenhum') === c ? <span style={{ marginLeft: 'auto' }}>✓</span> : undefined}>{NOME_CALCULO[c]}</ItemMenu>)}
    </Menu>}
    {menuLinha && <MenuItem ancora={menuLinha.ancora} editavel={editavel} onFechar={() => setMenuLinha(null)} onAbrir={() => abrir(menuLinha.id)} onArquivar={() => void api.arquivarItem(menuLinha.id)}
      onSubitem={visao.subitens ? () => void api.novoItem({ ...valoresNovos, [visao.subitens!]: [menuLinha.id] }).then(i => i && setEditarTitulo(i.id)) : undefined} />}
  </div>
}

/** Propriedades visíveis com valor (cartão do quadro e linha da lista). */
function ValoresVisiveis({ item, visao, esquema, pessoas, className }: { item: Item; visao: Visao; esquema: Propriedade[]; pessoas: Pessoa[]; className: string }) {
  const props = visao.visiveis.map(v => esquema.find(p => p.id === v)).filter((p): p is Propriedade => Boolean(p) && p!.id !== visao.agruparPor)
  const valores = props.map(p => ({ p, v: valorDe(item, p.id, esquema) }))
    .filter(({ p, v }) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length) && !(p.tipo === 'checkbox' && !v))
  if (!valores.length) return null
  return <div className={className}>{valores.map(({ p, v }) => <Fragment key={p.id}><Valor prop={p} valor={v} pessoas={pessoas} /></Fragment>)}</div>
}

/** Quadro (kanban): uma coluna por opção; arrastar o cartão muda o valor e a ordem. */
export function Quadro({ api, base, visao, itens, pessoas, editavel, abrir, valoresNovos }: VistaProps) {
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [alvo, setAlvo] = useState<{ grupo: string; antesDe: string | null } | null>(null)
  const [menuColuna, setMenuColuna] = useState<{ ancora: HTMLElement; grupo: string } | null>(null)
  const [menuCartao, setMenuCartao] = useState<{ ancora: { x: number; y: number }; id: string } | null>(null)
  const prop = base.esquema.find(p => p.id === visao.agruparPor)
  if (!prop) return <div className={x.empty} style={{ padding: '24px 4px', height: 'auto' }}>Para montar o quadro, crie uma propriedade de seleção ou status e escolha-a em “Propriedades → Agrupar por”.</div>
  const ocultas = new Set(visao.colunasOcultas ?? [])
  const grupos = agrupar(itens, prop.id, base.esquema)
  const visiveis = grupos.filter(g => !ocultas.has(g.id) && !(g.id === '' && !g.itens.length && editavel === false))

  const soltar = (grupo: string, antesDe: string | null) => {
    const id = arrastando
    setArrastando(null); setAlvo(null)
    if (!id) return
    const coluna = (grupos.find(g => g.id === grupo)?.itens ?? []).filter(i => i.id !== id)
    const indice = antesDe ? coluna.findIndex(i => i.id === antesDe) : coluna.length
    const posicao = posicaoEntre(coluna[indice - 1]?.posicao ?? null, coluna[indice]?.posicao ?? null)
    void api.mudarItem(id, { posicao, propriedades: { [prop.id]: grupo || null } })
  }

  return <div className={x.board}>
    {visiveis.map(g => <div key={g.id || 'sem'} className={x.column} data-cor={g.cor}
      onDragOver={e => { if (!arrastando) return; e.preventDefault(); if (alvo?.grupo !== g.id) setAlvo({ grupo: g.id, antesDe: null }) }}
      onDrop={e => { e.preventDefault(); soltar(g.id, alvo?.grupo === g.id ? alvo.antesDe : null) }}>
      <div className={x.columnHead}>
        {g.id ? <span className={`${x.tag} ${prop.tipo === 'status' ? x.statusTag : ''}`} data-cor={g.cor}>{g.nome}</span> : <span>{g.nome}</span>}
        <span className={x.count}>{g.itens.length}</span>
        <span className={x.acts}>
          <button type="button" className={x.rowBtn} aria-label="Opções da coluna" onClick={e => setMenuColuna({ ancora: e.currentTarget, grupo: g.id })}><MoreHorizontal size={16} /></button>
          {editavel && <button type="button" className={x.rowBtn} aria-label="Novo nesta coluna" onClick={() => void api.novoItem({ ...valoresNovos, [prop.id]: g.id || null }).then(i => i && abrir(i.id))}><Plus size={16} /></button>}
        </span>
      </div>
      {g.itens.map(item => <Fragment key={item.id}>
        {alvo?.grupo === g.id && alvo.antesDe === item.id && arrastando !== item.id && <div className={x.dropLine} />}
        <div role="button" tabIndex={0} draggable={editavel} className={`${x.cardItem} ${arrastando === item.id ? x.cardDragging : ''}`}
          onClick={() => abrir(item.id)} onKeyDown={e => { if (e.key === 'Enter') abrir(item.id) }}
          onContextMenu={e => { e.preventDefault(); setMenuCartao({ ancora: { x: e.clientX, y: e.clientY }, id: item.id }) }}
          onDragStart={e => { setArrastando(item.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.id) }}
          onDragEnd={() => { setArrastando(null); setAlvo(null) }}
          onDragOver={e => {
            if (!arrastando) return
            e.preventDefault(); e.stopPropagation()
            const r = e.currentTarget.getBoundingClientRect()
            const antesDe = e.clientY < r.top + r.height / 2 ? item.id : g.itens[g.itens.indexOf(item) + 1]?.id ?? null
            if (alvo?.grupo !== g.id || alvo.antesDe !== antesDe) setAlvo({ grupo: g.id, antesDe })
          }}>
          <div className={x.cardItemTitle}>{item.icone && <span>{item.icone}</span>}<span>{tituloExibido(item.titulo)}</span></div>
          <ValoresVisiveis item={item} visao={visao} esquema={base.esquema} pessoas={pessoas} className={x.cardProps} />
        </div>
      </Fragment>)}
      {alvo?.grupo === g.id && alvo.antesDe === null && arrastando && <div className={x.dropLine} />}
      {editavel && <button type="button" className={x.columnNew} onClick={() => void api.novoItem({ ...valoresNovos, [prop.id]: g.id || null }).then(i => i && abrir(i.id))}><Plus size={16} />Novo</button>}
    </div>)}
    {ocultas.size > 0 && <div className={x.hiddenCols}>
      <div className={x.menuLabel} style={{ padding: '8px 6px' }}>Colunas ocultas</div>
      {grupos.filter(g => ocultas.has(g.id)).map(g => <button key={g.id || 'sem'} type="button" title="Mostrar coluna"
        onClick={() => api.mudarVisao(visao.id, { colunasOcultas: [...ocultas].filter(c => c !== g.id) })}>
        {g.id ? <span className={x.tag} data-cor={g.cor}>{g.nome}</span> : g.nome}<span className={x.count} style={{ marginLeft: 'auto' }}>{g.itens.length}</span>
      </button>)}
    </div>}
    {menuColuna && <Menu ancora={menuColuna.ancora} onFechar={() => setMenuColuna(null)}>
      <ItemMenu icone={EyeOff} onClick={() => { api.mudarVisao(visao.id, { colunasOcultas: [...ocultas, menuColuna.grupo] }); setMenuColuna(null) }}>Ocultar coluna</ItemMenu>
    </Menu>}
    {menuCartao && <MenuItem ancora={menuCartao.ancora} editavel={editavel} onFechar={() => setMenuCartao(null)} onAbrir={() => abrir(menuCartao.id)} onArquivar={() => void api.arquivarItem(menuCartao.id)} />}
  </div>
}

/** Lista: título à esquerda e as propriedades visíveis à direita, como no Notion. */
export function Lista({ api, base, visao, itens, pessoas, editavel, abrir, valoresNovos }: VistaProps) {
  const [menu, setMenu] = useState<{ ancora: { x: number; y: number }; id: string } | null>(null)
  return <div>
    {itens.map(item => <div key={item.id} role="button" tabIndex={0} className={x.listRow} onClick={() => abrir(item.id)} onKeyDown={e => { if (e.key === 'Enter') abrir(item.id) }}
      onContextMenu={e => { e.preventDefault(); setMenu({ ancora: { x: e.clientX, y: e.clientY }, id: item.id }) }}>
      <span className={x.titulo}>{item.icone ?? '📄'} <span className={x.cellText}>{tituloExibido(item.titulo)}</span></span>
      <ValoresVisiveis item={item} visao={visao} esquema={base.esquema} pessoas={pessoas} className={x.listProps} />
    </div>)}
    {editavel && <button type="button" className={x.newRow} onClick={() => void api.novoItem(valoresNovos).then(i => i && abrir(i.id))}><Plus size={16} />Novo</button>}
    {menu && <MenuItem ancora={menu.ancora} editavel={editavel} onFechar={() => setMenu(null)} onAbrir={() => abrir(menu.id)} onArquivar={() => void api.arquivarItem(menu.id)} />}
  </div>
}

const LARGURA_CARTAO = { pequeno: 180, medio: 240, grande: 320 } as const

/** Galeria: cartões com a capa (ou o ícone) do item, o título e as propriedades visíveis. */
export function Galeria({ api, base, visao, itens, pessoas, editavel, abrir, valoresNovos }: VistaProps) {
  const [menu, setMenu] = useState<{ ancora: { x: number; y: number }; id: string } | null>(null)
  const largura = LARGURA_CARTAO[visao.tamanhoCartao ?? 'medio']
  return <div className={x.gallery} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${largura}px, 1fr))` }}>
    {itens.map(item => <div key={item.id} role="button" tabIndex={0} className={x.galleryCard} onClick={() => abrir(item.id)} onKeyDown={e => { if (e.key === 'Enter') abrir(item.id) }}
      onContextMenu={e => { e.preventDefault(); setMenu({ ancora: { x: e.clientX, y: e.clientY }, id: item.id }) }}>
      {visao.capaCartao !== false && item.capa && <div className={x.galleryCover} style={estiloCapa(item.capa, 50)} />}
      <div className={x.galleryBody}>
        <div className={x.cardItemTitle}>{item.icone && <span>{item.icone}</span>}<span>{tituloExibido(item.titulo)}</span></div>
        <ValoresVisiveis item={item} visao={visao} esquema={base.esquema} pessoas={pessoas} className={x.cardProps} />
      </div>
    </div>)}
    {editavel && <button type="button" className={`${x.galleryCard} ${x.galleryNew}`} onClick={() => void api.novoItem(valoresNovos).then(i => i && abrir(i.id))}><Plus size={16} />Novo</button>}
    {menu && <MenuItem ancora={menu.ancora} editavel={editavel} onFechar={() => setMenu(null)} onAbrir={() => abrir(menu.id)} onArquivar={() => void api.arquivarItem(menu.id)} />}
  </div>
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const diaLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
/** Dia (AAAA-MM-DD, no fuso de quem vê) de um valor de data: data pura ou data e hora. */
function diaDoValor(valor: unknown) {
  if (typeof valor !== 'string' || !valor) return null
  return valor.length === 10 ? valor : diaLocal(new Date(valor))
}

/**
 * Calendário do mês pela propriedade de data da visão: arrastar o item para outro dia muda a data; "+" no dia cria
 * um item naquele dia. Itens sem data ficam numa lista ao lado.
 */
export function Calendario({ api, base, visao, itens, editavel, abrir, valoresNovos }: VistaProps) {
  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [alvo, setAlvo] = useState<string | null>(null)
  const [semData, setSemData] = useState(false)
  const prop = base.esquema.find(p => p.id === visao.dataPor)
  if (!prop) return <div className={x.empty} style={{ padding: '24px 4px', height: 'auto' }}>Para usar o calendário, crie uma propriedade de data e escolha-a em “Propriedades → Mostrar no calendário por”.</div>
  const movivel = editavel && prop.tipo === 'data'
  const hoje = diaLocal(new Date())
  const inicio = new Date(mes); inicio.setDate(1 - mes.getDay())
  const dias = Array.from({ length: 42 }, (_, i) => { const d = new Date(inicio); d.setDate(inicio.getDate() + i); return d })
  const semanas = dias[35].getMonth() !== mes.getMonth() ? 5 : 6
  const porDia = new Map<string, Item[]>()
  const sem: Item[] = []
  for (const item of itens) {
    const dia = diaDoValor(valorDe(item, prop.id, base.esquema))
    if (!dia) sem.push(item)
    else porDia.set(dia, [...(porDia.get(dia) ?? []), item])
  }
  const soltar = (dia: string) => {
    const id = arrastando
    setArrastando(null); setAlvo(null)
    if (id && movivel) void api.mudarItem(id, { propriedades: { [prop.id]: dia } })
  }
  const nomeMes = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return <div className={x.calendar}>
    <div className={x.calendarHead}>
      <b>{nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}</b>
      <span className={x.barSpacer} />
      {sem.length > 0 && <button type="button" className={x.barBtn} onClick={() => setSemData(!semData)}>Sem data ({sem.length})</button>}
      <button type="button" className={x.barBtn} aria-label="Mês anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
      <button type="button" className={x.barBtn} onClick={() => { const d = new Date(); setMes(new Date(d.getFullYear(), d.getMonth(), 1)) }}>Hoje</button>
      <button type="button" className={x.barBtn} aria-label="Próximo mês" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
    </div>
    <div className={x.calendarWrap}>
      <div className={x.calendarGrid} role="grid" aria-label={nomeMes}>
        {DIAS_SEMANA.map(d => <div key={d} className={x.calendarDow}>{d}</div>)}
        {dias.slice(0, semanas * 7).map(d => {
          const dia = diaLocal(d)
          return <div key={dia} role="gridcell" className={`${x.calendarDay} ${d.getMonth() !== mes.getMonth() ? x.calendarOut : ''} ${alvo === dia ? x.calendarDrop : ''}`}
            onDragOver={e => { if (!arrastando) return; e.preventDefault(); if (alvo !== dia) setAlvo(dia) }}
            onDrop={e => { e.preventDefault(); soltar(dia) }}>
            <div className={x.calendarDayHead}>
              {editavel && prop.tipo === 'data' && <button type="button" className={x.calendarAdd} aria-label={`Novo em ${dia}`}
                onClick={() => void api.novoItem({ ...valoresNovos, [prop.id]: dia }).then(i => i && abrir(i.id))}><Plus size={14} /></button>}
              <span className={dia === hoje ? x.calendarToday : ''}>{d.getDate() === 1 ? `${d.getDate()} ${d.toLocaleDateString('pt-BR', { month: 'short' })}` : d.getDate()}</span>
            </div>
            {(porDia.get(dia) ?? []).map(item => <div key={item.id} role="button" tabIndex={0} draggable={movivel} className={x.calendarItem}
              onClick={() => abrir(item.id)} onKeyDown={e => { if (e.key === 'Enter') abrir(item.id) }}
              onDragStart={e => { setArrastando(item.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.id) }}
              onDragEnd={() => { setArrastando(null); setAlvo(null) }}>
              {item.icone && <span>{item.icone}</span>}<span className={x.cellText}>{tituloExibido(item.titulo)}</span>
            </div>)}
          </div>
        })}
      </div>
      {semData && <div className={x.calendarSide}>
        <div className={x.menuLabel}>Sem data</div>
        {sem.map(item => <div key={item.id} role="button" tabIndex={0} draggable={movivel} className={x.calendarItem}
          onClick={() => abrir(item.id)} onKeyDown={e => { if (e.key === 'Enter') abrir(item.id) }}
          onDragStart={e => { setArrastando(item.id); e.dataTransfer.setData('text/plain', item.id) }} onDragEnd={() => { setArrastando(null); setAlvo(null) }}>
          {item.icone && <span>{item.icone}</span>}<span className={x.cellText}>{tituloExibido(item.titulo)}</span>
        </div>)}
      </div>}
    </div>
  </div>
}

const LARGURA_DIA = { dias: 36, semanas: 14 } as const

/**
 * Linha do tempo (Gantt): uma barra por item, do início ao fim (as propriedades de data da visão). Arrastar a barra
 * muda as duas datas; arrastar a ponta direita muda o fim. Itens sem data ficam numa lista embaixo.
 */
export function LinhaDoTempo({ api, base, visao, itens, editavel, abrir, valoresNovos }: VistaProps) {
  const hojeDia = diaLocal(new Date())
  const [inicio, setInicio] = useState(() => somarDias(diaLocal(new Date()), -7))
  const [escala, setEscala] = useState<'dias' | 'semanas'>('dias')
  const [arrasto, setArrasto] = useState<{ id: string; modo: 'mover' | 'fim'; x: number; dias: number } | null>(null)
  const prop = base.esquema.find(p => p.id === visao.dataPor && p.tipo === 'data')
  if (!prop) return <div className={x.empty} style={{ padding: '24px 4px', height: 'auto' }}>Para a linha do tempo, crie uma propriedade de data e escolha-a em “Propriedades → Início”.</div>
  const fimProp = base.esquema.find(p => p.id === visao.dataFim && p.tipo === 'data')
  const largura = LARGURA_DIA[escala]
  const totalDias = escala === 'dias' ? 42 : 120
  const dias = Array.from({ length: totalDias }, (_, i) => somarDias(inicio, i))
  const indice = (data: string) => Math.round((Date.parse(`${data}T12:00:00Z`) - Date.parse(`${inicio}T12:00:00Z`)) / 864e5)
  const comData = itens.map(item => ({ item, periodo: periodoDoItem(item, prop.id, fimProp?.id, base.esquema) }))
  const semData = comData.filter(c => !c.periodo)
  const soltar = (id: string, delta: number, modo: 'mover' | 'fim') => {
    const c = comData.find(c => c.item.id === id)
    if (!c?.periodo || !delta) return
    const valores: Record<string, unknown> = modo === 'mover' ? { [prop.id]: somarDias(c.periodo.inicio, delta) } : {}
    if (fimProp) {
      const novoFim = somarDias(c.periodo.fim, delta)
      if (modo === 'mover' || novoFim >= c.periodo.inicio) valores[fimProp.id] = novoFim
    }
    if (Object.keys(valores).length) void api.mudarItem(id, { propriedades: valores })
  }
  const mover = (e: React.MouseEvent) => {
    if (!arrasto) return
    const dias = Math.round((e.clientX - arrasto.x) / largura)
    if (dias !== arrasto.dias) setArrasto({ ...arrasto, dias })
  }
  const terminar = () => { if (arrasto) soltar(arrasto.id, arrasto.dias, arrasto.modo); setArrasto(null) }
  /** Item sem data arrastado para a grade: ganha a data do dia onde caiu (e o fim no mesmo dia). */
  const soltarSemData = (e: React.DragEvent<HTMLDivElement>) => {
    const id = e.dataTransfer.getData('text/x-notas-item')
    if (!id || !editavel) return
    e.preventDefault()
    const dia = somarDias(inicio, Math.floor((e.clientX - e.currentTarget.getBoundingClientRect().left) / largura))
    void api.mudarItem(id, { propriedades: { [prop.id]: dia, ...(fimProp ? { [fimProp.id]: dia } : {}) } })
  }
  const comPeriodo = comData.filter(c => c.periodo)
  const meses = dias.reduce<{ nome: string; n: number }[]>((lista, d) => {
    const bruto = new Date(`${d}T12:00:00Z`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    const nome = bruto.charAt(0).toUpperCase() + bruto.slice(1)
    if (lista.at(-1)?.nome === nome) lista[lista.length - 1].n++; else lista.push({ nome, n: 1 })
    return lista
  }, [])

  return <div className={x.timeline} onMouseMove={mover} onMouseUp={terminar} onMouseLeave={terminar}>
    <div className={x.calendarHead}>
      <span className={x.barSpacer} />
      <select className={x.barBtn} value={escala} aria-label="Escala" onChange={e => setEscala(e.target.value as 'dias' | 'semanas')}>
        <option value="dias">Dias</option><option value="semanas">Semanas</option>
      </select>
      <button type="button" className={x.barBtn} aria-label="Voltar" onClick={() => setInicio(somarDias(inicio, escala === 'dias' ? -14 : -56))}><ChevronLeft size={16} /></button>
      <button type="button" className={x.barBtn} onClick={() => setInicio(somarDias(hojeDia, -7))}>Hoje</button>
      <button type="button" className={x.barBtn} aria-label="Avançar" onClick={() => setInicio(somarDias(inicio, escala === 'dias' ? 14 : 56))}><ChevronRight size={16} /></button>
    </div>
    <div className={x.timelineGrade}>
      <div className={x.timelineNomes}>
        <div className={x.timelineCab} />
        {comData.filter(c => c.periodo).map(({ item }) => <div key={item.id} className={x.timelineNome} role="button" tabIndex={0} onClick={() => abrir(item.id)}
          onKeyDown={e => { if (e.key === 'Enter') abrir(item.id) }}>{item.icone && <span>{item.icone}</span>}<span className={x.cellText}>{tituloExibido(item.titulo)}</span></div>)}
      </div>
      <div className={x.timelineArea}>
        <div style={{ width: totalDias * largura, position: 'relative', minHeight: comPeriodo.length ? undefined : 96 }}
          onDragOver={e => { if (editavel && e.dataTransfer.types.includes('text/x-notas-item')) e.preventDefault() }} onDrop={soltarSemData}>
          <div className={x.timelineMeses}>{meses.map((m, i) => <span key={i} style={{ width: m.n * largura }}>{m.nome}</span>)}</div>
          <div className={x.timelineDias}>{dias.map(d => <span key={d} style={{ width: largura }} className={`${d === hojeDia ? x.timelineHoje : ''} ${[0, 6].includes(new Date(`${d}T12:00:00Z`).getUTCDay()) ? x.timelineFds : ''}`}>
            {escala === 'dias' || d.endsWith('-01') || new Date(`${d}T12:00:00Z`).getUTCDay() === 1 ? Number(d.slice(8)) : ''}
          </span>)}</div>
          {indice(hojeDia) >= 0 && indice(hojeDia) < totalDias && <div className={x.timelineLinhaHoje} style={{ left: indice(hojeDia) * largura + largura / 2 }} />}
          {!comPeriodo.length && <div className={x.timelineVazia}>
            {semData.length && editavel ? 'Arraste um item de “Sem data” para um dia, ou clique em Novo.' : 'Nenhum item com data. Clique em Novo para criar um.'}
          </div>}
          {comData.filter(c => c.periodo).map(({ item, periodo }) => {
            const a = arrasto?.id === item.id ? arrasto : null
            const ini = indice(periodo!.inicio) + (a?.modo === 'mover' ? a.dias : 0)
            const dur = indice(periodo!.fim) - indice(periodo!.inicio) + 1 + (a?.modo === 'fim' ? a.dias : 0)
            return <div key={item.id} className={x.timelineLinha}>
              <div className={x.timelineBarra} role="button" tabIndex={0} title={`${tituloExibido(item.titulo)} — ${periodo!.inicio} a ${periodo!.fim}`}
                style={{ left: ini * largura + 2, width: Math.max(1, dur) * largura - 4 }}
                onClick={() => { if (!arrasto) abrir(item.id) }} onKeyDown={e => { if (e.key === 'Enter') abrir(item.id) }}
                onMouseDown={e => { if (!editavel) return; e.preventDefault(); setArrasto({ id: item.id, modo: 'mover', x: e.clientX, dias: 0 }) }}>
                <span className={x.cellText}>{tituloExibido(item.titulo)}</span>
                {editavel && fimProp && <span className={x.timelinePonta} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setArrasto({ id: item.id, modo: 'fim', x: e.clientX, dias: 0 }) }} />}
              </div>
            </div>
          })}
        </div>
      </div>
    </div>
    {semData.length > 0 && <div className={x.timelineSem}>
      <div className={x.menuLabel}>Sem data ({semData.length})</div>
      {semData.map(({ item }) => <div key={item.id} className={x.calendarItem} role="button" tabIndex={0} onClick={() => abrir(item.id)} onKeyDown={e => { if (e.key === 'Enter') abrir(item.id) }}
        draggable={editavel} onDragStart={e => { e.dataTransfer.setData('text/x-notas-item', item.id); e.dataTransfer.effectAllowed = 'move' }}
        title={editavel ? 'Arraste para um dia da linha do tempo' : undefined}>
        <IconePagina icone={item.icone} tamanho={14} className={x.timelineSemIcone} /><span className={x.cellText}>{tituloExibido(item.titulo)}</span>
      </div>)}
    </div>}
    {editavel && <button type="button" className={x.newRow} onClick={() => void api.novoItem({ ...valoresNovos, [prop.id]: hojeDia }).then(i => i && abrir(i.id))}><Plus size={16} />Novo</button>}
  </div>
}
