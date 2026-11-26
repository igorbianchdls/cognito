'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { EyeOff, Maximize2, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import {
  agrupar, calcular, calculosDe, formatarNumero, NOME_CALCULO, novoId, TITULO, valorDe,
  type Calculo, type Item, type Propriedade, type TipoPropriedade, type Visao,
} from '@/products/notas/shared/bases'
import { posicaoEntre, tituloExibido } from '@/products/notas/shared/arvore'
import type { Pagina } from '../api'
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
function MenuItem({ ancora, onFechar, onAbrir, onArquivar, editavel }: { ancora: HTMLElement | { x: number; y: number }; onFechar: () => void; onAbrir: () => void; onArquivar: () => void; editavel: boolean }) {
  return <Menu ancora={ancora} onFechar={onFechar}>
    <ItemMenu icone={Maximize2} onClick={() => { onFechar(); onAbrir() }}>Abrir</ItemMenu>
    {editavel && <ItemMenu icone={Trash2} perigo onClick={() => { onFechar(); onArquivar() }}>Mover para a lixeira</ItemMenu>}
  </Menu>
}

/** "+" no fim do cabeçalho: nome e tipo da propriedade nova (entra visível nesta visão). */
function NovaPropriedade({ ancora, api, base, visao, onFechar }: { ancora: HTMLElement; api: BaseApi; base: Pagina; visao: Visao; onFechar: () => void }) {
  const [nome, setNome] = useState('')
  const criar = (tipo: TipoPropriedade) => {
    const id = novoId()
    const nomeFinal = nome.trim() || `Propriedade ${base.esquema.length + 1}`
    if (base.esquema.some(p => p.nome.toLowerCase() === nomeFinal.toLowerCase())) return
    void api.salvarBase({
      esquema: [...base.esquema, { id, nome: nomeFinal, tipo, ...(['selecao', 'multisselecao', 'status'].includes(tipo) ? { opcoes: [] } : {}) }],
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
      {itens.map(item => <div key={item.id} className={x.tr} role="row" onContextMenu={e => { e.preventDefault(); setMenuLinha({ ancora: { x: e.clientX, y: e.clientY }, id: item.id }) }}>
        {colunas.map(col => {
          const prop = base.esquema.find(p => p.id === col) ?? null
          return <Celula key={col} item={item} prop={prop} pessoas={pessoas} editavel={editavel}
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
    {menuCol && <MenuPropriedade ancora={menuCol.ancora} prop={menuCol.prop} visao={visao} editavel={editavel} onFechar={() => setMenuCol(null)}
      onMudar={m => menuCol.prop && api.mudarPropriedade(menuCol.prop.id, m)}
      onExcluir={() => menuCol.prop && void api.salvarBase({ esquema: base.esquema.filter(p => p.id !== menuCol.prop!.id) })}
      onMudarVisao={m => api.mudarVisao(visao.id, m)} />}
    {novaProp && <NovaPropriedade ancora={novaProp} api={api} base={base} visao={visao} onFechar={() => setNovaProp(null)} />}
    {menuCalc && <Menu ancora={menuCalc.ancora} onFechar={() => setMenuCalc(null)}>
      {calculosDe(menuCalc.tipo).map(c => <ItemMenu key={c} onClick={() => { api.mudarVisao(visao.id, { calculos: { ...visao.calculos, [menuCalc.col]: c as Calculo } }); setMenuCalc(null) }}
        direita={(visao.calculos?.[menuCalc.col] ?? 'nenhum') === c ? <span style={{ marginLeft: 'auto' }}>✓</span> : undefined}>{NOME_CALCULO[c]}</ItemMenu>)}
    </Menu>}
    {menuLinha && <MenuItem ancora={menuLinha.ancora} editavel={editavel} onFechar={() => setMenuLinha(null)} onAbrir={() => abrir(menuLinha.id)} onArquivar={() => void api.arquivarItem(menuLinha.id)} />}
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
