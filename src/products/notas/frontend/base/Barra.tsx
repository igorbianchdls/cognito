'use client'

import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import {
  NOME_OPERADOR, operadoresDe, SEM_VALOR, TITULO, type Filtro, type Propriedade, type Visao,
} from '@/products/notas/shared/bases'
import { ItemMenu, Menu } from '../Menu'
import { ICONE_TIPO } from './Celula'
import x from '../notas.module.css'

const colunas = (esquema: Propriedade[]) => [{ id: TITULO, nome: 'Nome', tipo: 'titulo' as const }, ...esquema]

/** Campo do valor do filtro, conforme o tipo da propriedade. */
function ValorFiltro({ filtro, prop, onMudar }: { filtro: Filtro; prop?: Propriedade; onMudar: (valor: unknown) => void }) {
  if (SEM_VALOR.includes(filtro.operador)) return <span style={{ flex: 1 }} />
  if (prop && (prop.tipo === 'selecao' || prop.tipo === 'status' || prop.tipo === 'multisselecao')) {
    return <select value={(filtro.valor as string) ?? ''} aria-label="Valor" onChange={e => onMudar(e.target.value || null)} style={{ flex: 1 }}>
      <option value="">Escolha…</option>{prop.opcoes?.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
    </select>
  }
  const tipo = prop?.tipo
  const tipoInput = tipo === 'numero' ? 'number' : tipo === 'data' || tipo === 'criado_em' || tipo === 'editado_em' ? 'date' : 'text'
  return <input type={tipoInput} defaultValue={(filtro.valor as string) ?? ''} placeholder="Valor…" aria-label="Valor"
    onChange={e => onMudar(tipoInput === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)} />
}

/** Filtros da visão: cada linha é propriedade + operador + valor; todas com "e" ou com "ou". */
export function MenuFiltros({ ancora, visao, esquema, onFechar, onMudar }: {
  ancora: HTMLElement; visao: Visao; esquema: Propriedade[]; onFechar: () => void; onMudar: (mudanca: Partial<Visao>) => void
}) {
  const filtros = visao.filtros
  const trocar = (i: number, mudanca: Partial<Filtro>) => onMudar({ filtros: filtros.map((f, j) => j === i ? { ...f, ...mudanca } : f) })
  return <Menu ancora={ancora} onFechar={onFechar} className={x.filterWide} alinhar="fim">
    {!filtros.length && <div className={x.menuLabel}>Nenhum filtro nesta visão.</div>}
    {filtros.map((f, i) => {
      const prop = esquema.find(p => p.id === f.prop)
      return <div key={i} className={x.filterRow}>
        <span style={{ width: 44, fontSize: 13, color: 'var(--n-muted)' }}>
          {i === 0 ? 'Onde' : i === 1 ? <select value={visao.juncao} aria-label="E ou ou" onChange={e => onMudar({ juncao: e.target.value as 'e' | 'ou' })}><option value="e">e</option><option value="ou">ou</option></select> : visao.juncao}
        </span>
        <select value={f.prop} aria-label="Propriedade" onChange={e => {
          const nova = esquema.find(p => p.id === e.target.value)
          trocar(i, { prop: e.target.value, operador: operadoresDe(nova?.tipo ?? 'titulo')[0], valor: null })
        }}>{colunas(esquema).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
        <select value={f.operador} aria-label="Condição" onChange={e => trocar(i, { operador: e.target.value as Filtro['operador'] })}>
          {operadoresDe(prop?.tipo ?? 'titulo').map(o => <option key={o} value={o}>{NOME_OPERADOR[o]}</option>)}
        </select>
        <ValorFiltro key={`${f.prop}:${f.operador}`} filtro={f} prop={prop} onMudar={valor => trocar(i, { valor })} />
        <button type="button" className={x.rowBtn} aria-label="Tirar filtro" onClick={() => onMudar({ filtros: filtros.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
      </div>
    })}
    <div className={x.menuSep} />
    <ItemMenu icone={Plus} onClick={() => onMudar({ filtros: [...filtros, { prop: TITULO, operador: 'contem', valor: null }] })}>Adicionar filtro</ItemMenu>
  </Menu>
}

/** Ordenação da visão (várias regras, na ordem). */
export function MenuOrdenacao({ ancora, visao, esquema, onFechar, onMudar }: {
  ancora: HTMLElement; visao: Visao; esquema: Propriedade[]; onFechar: () => void; onMudar: (mudanca: Partial<Visao>) => void
}) {
  const regras = visao.ordenacao
  return <Menu ancora={ancora} onFechar={onFechar} className={x.filterWide} alinhar="fim">
    {!regras.length && <div className={x.menuLabel}>Sem ordenação: vale a ordem manual.</div>}
    {regras.map((r, i) => <div key={i} className={x.filterRow}>
      <select value={r.prop} aria-label="Propriedade" style={{ flex: 1 }} onChange={e => onMudar({ ordenacao: regras.map((q, j) => j === i ? { ...q, prop: e.target.value } : q) })}>
        {colunas(esquema).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      <select value={r.direcao} aria-label="Direção" onChange={e => onMudar({ ordenacao: regras.map((q, j) => j === i ? { ...q, direcao: e.target.value as 'asc' | 'desc' } : q) })}>
        <option value="asc">Crescente</option><option value="desc">Decrescente</option>
      </select>
      <button type="button" className={x.rowBtn} aria-label="Tirar ordenação" onClick={() => onMudar({ ordenacao: regras.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
    </div>)}
    <div className={x.menuSep} />
    <ItemMenu icone={Plus} onClick={() => onMudar({ ordenacao: [...regras, { prop: TITULO, direcao: 'asc' }] })}>Adicionar ordenação</ItemMenu>
    {regras.length > 0 && <ItemMenu icone={Trash2} onClick={() => { onMudar({ ordenacao: [] }); onFechar() }}>Tirar ordenação</ItemMenu>}
  </Menu>
}

/** Propriedades mostradas na visão (e a coluna do quadro). */
export function MenuPropriedades({ ancora, visao, esquema, onFechar, onMudar }: {
  ancora: HTMLElement; visao: Visao; esquema: Propriedade[]; onFechar: () => void; onMudar: (mudanca: Partial<Visao>) => void
}) {
  const agrupaveis = esquema.filter(p => p.tipo === 'selecao' || p.tipo === 'status')
  return <Menu ancora={ancora} onFechar={onFechar} className={x.menuWide} alinhar="fim">
    {visao.tipo === 'quadro' && <>
      <div className={x.menuLabel}>Agrupar por</div>
      {agrupaveis.length ? agrupaveis.map(p => <ItemMenu key={p.id} icone={ICONE_TIPO[p.tipo]} onClick={() => onMudar({ agruparPor: p.id, colunasOcultas: [] })}
        direita={visao.agruparPor === p.id ? <span style={{ marginLeft: 'auto' }}>✓</span> : undefined}>{p.nome}</ItemMenu>)
        : <div className={x.menuLabel}>Crie uma propriedade de seleção ou status para agrupar.</div>}
      <div className={x.menuSep} />
    </>}
    <div className={x.menuLabel}>Propriedades {visao.tipo === 'quadro' ? 'nos cartões' : 'visíveis'}</div>
    {esquema.map(p => {
      const visivel = visao.visiveis.includes(p.id)
      return <ItemMenu key={p.id} icone={ICONE_TIPO[p.tipo]} direita={<span style={{ marginLeft: 'auto', display: 'inline-flex' }}>{visivel ? <Eye size={14} /> : <EyeOff size={14} />}</span>}
        onClick={() => onMudar({ visiveis: visivel ? visao.visiveis.filter(v => v !== p.id) : [...visao.visiveis, p.id] })}>{p.nome}</ItemMenu>
    })}
  </Menu>
}
