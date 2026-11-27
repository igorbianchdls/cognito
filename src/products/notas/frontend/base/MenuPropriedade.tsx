'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, EyeOff, Filter, Plus, Table2, Trash2, X } from 'lucide-react'
import {
  calculosDe, COM_OPCOES, CORES, NOME_CALCULO, NOME_COR, NOME_GRUPO_STATUS, NOME_TIPO, novoId, operadoresDe, TIPOS_PROPRIEDADE, TITULO,
  type Calculo, type FormatoNumero, type Opcao, type Propriedade, type TipoPropriedade, type Visao,
} from '@/products/notas/shared/bases'
import { validarFormula, FUNCOES_FORMULA } from '@/products/notas/shared/formula'
import { tituloExibido } from '@/products/notas/shared/arvore'
import { ItemMenu, Menu } from '../Menu'
import { useNotas } from '../NotasProvider'
import { ICONE_TIPO } from './Celula'
import { useLigadas } from './ligadas'
import x from '../notas.module.css'

/**
 * Escolher o tipo de uma propriedade (nova ou existente). Relação pede antes a base a ligar; o resto vem com o
 * padrão (a fórmula e a agregação são configuradas depois, no menu da propriedade).
 */
export function ListaTipos({ atual, onEscolher }: { atual?: TipoPropriedade; onEscolher: (tipo: TipoPropriedade, extra?: Partial<Propriedade>) => void }) {
  const { arvore } = useNotas()
  const [escolhendoBase, setEscolhendoBase] = useState(false)
  const [dupla, setDupla] = useState(true)
  if (escolhendoBase) {
    const bases = (arvore?.paginas ?? []).filter(p => p.tipo === 'base')
    return <div className={x.optList}>
      <ItemMenu icone={ChevronLeft} onClick={() => setEscolhendoBase(false)}>Voltar</ItemMenu>
      <div className={x.menuLabel}>Ligar a qual base?</div>
      {!bases.length && <div className={x.menuLabel}>Crie outra base primeiro.</div>}
      {bases.map(b => <ItemMenu key={b.id} icone={b.icone ? undefined : Table2} onClick={() => onEscolher('relacao', { baseRelacionada: b.id, ...(dupla ? { reciproca: '__nova__' } : {}) })}>
        {b.icone ? `${b.icone} ` : ''}{tituloExibido(b.titulo)}
      </ItemMenu>)}
      <label className={x.filterRow} style={{ fontSize: 13, cursor: 'pointer' }}>
        <input type="checkbox" checked={dupla} onChange={e => setDupla(e.target.checked)} />Mostrar também na outra base (nos dois sentidos)
      </label>
    </div>
  }
  return <div className={x.optList}>
    <div className={x.menuLabel}>Tipo</div>
    {TIPOS_PROPRIEDADE.map(tipo => <ItemMenu key={tipo} icone={ICONE_TIPO[tipo]} onClick={() => tipo === 'relacao' ? setEscolhendoBase(true) : onEscolher(tipo)}
      direita={atual === tipo ? <span style={{ marginLeft: 'auto' }}>✓</span> : undefined}>{NOME_TIPO[tipo]}</ItemMenu>)}
  </div>
}

/** Fórmula: caixa de texto, erro na hora e as funções disponíveis. */
function EditorFormula({ prop, esquema, onMudar }: { prop: Propriedade; esquema: Propriedade[]; onMudar: (expressao: string) => void }) {
  const [texto, setTexto] = useState(prop.expressao ?? '')
  const problema = texto.trim() ? validarFormula(texto) : null
  return <div style={{ padding: '4px 8px' }}>
    <div className={x.menuLabel} style={{ padding: '4px 4px' }}>Fórmula</div>
    <textarea className={x.formulaBox} value={texto} rows={3} spellCheck={false} aria-label="Fórmula" placeholder='Ex.: prop("Preço") * prop("Quantidade")'
      onChange={e => setTexto(e.target.value)} onKeyDown={e => e.stopPropagation()} />
    {problema ? <div className={x.formulaErro}>{problema}</div> : <div className={x.formulaOk}>{texto.trim() ? 'Fórmula válida.' : ' '}</div>}
    <div className={x.formulaAjuda}>
      <b>Propriedades:</b> {['Nome', ...esquema.filter(p => p.id !== prop.id).map(p => p.nome)].map(n => <button key={n} type="button" onClick={() => setTexto(t => `${t}prop("${n}")`)}>{n}</button>)}
      <br /><b>Funções:</b> {FUNCOES_FORMULA.join(', ')}
    </div>
    <button type="button" className={x.primary} style={{ width: '100%', marginTop: 6 }} disabled={Boolean(problema)} onClick={() => onMudar(texto)}>Salvar fórmula</button>
  </div>
}

/** Agregação: qual relação, qual propriedade da base ligada e qual cálculo. */
function EditorAgregacao({ prop, esquema, onMudar }: { prop: Propriedade; esquema: Propriedade[]; onMudar: (m: Partial<Propriedade>) => void }) {
  const ligadas = useLigadas()
  const relacoes = esquema.filter(p => p.tipo === 'relacao')
  const relacao = relacoes.find(r => r.id === prop.relacao)
  const outra = relacao?.baseRelacionada ? ligadas.get(relacao.baseRelacionada) : undefined
  const alvo = outra?.esquema.find(p => p.id === prop.alvo)
  const calculos: (Calculo | 'mostrar')[] = ['mostrar', ...calculosDe(alvo?.tipo ?? 'titulo').filter(c => c !== 'nenhum')]
  if (!relacoes.length) return <div className={x.menuLabel}>Crie antes uma propriedade de relação nesta base.</div>
  return <div>
    <div className={x.filterRow}><span className={x.muted} style={{ width: 80, fontSize: 13 }}>Relação</span>
      <select style={{ flex: 1 }} value={prop.relacao ?? ''} aria-label="Relação" onChange={e => onMudar({ relacao: e.target.value, alvo: TITULO, calculo: 'mostrar' })}>
        <option value="">Escolha…</option>{relacoes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
      </select></div>
    {relacao && <div className={x.filterRow}><span className={x.muted} style={{ width: 80, fontSize: 13 }}>Propriedade</span>
      <select style={{ flex: 1 }} value={prop.alvo ?? TITULO} aria-label="Propriedade da base ligada" onChange={e => onMudar({ alvo: e.target.value, calculo: 'mostrar' })}>
        <option value={TITULO}>Nome</option>{outra?.esquema.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select></div>}
    {relacao && <div className={x.filterRow}><span className={x.muted} style={{ width: 80, fontSize: 13 }}>Calcular</span>
      <select style={{ flex: 1 }} value={prop.calculo ?? 'mostrar'} aria-label="Cálculo" onChange={e => onMudar({ calculo: e.target.value as Calculo | 'mostrar' })}>
        {calculos.map(c => <option key={c} value={c}>{c === 'mostrar' ? 'Mostrar os valores' : NOME_CALCULO[c]}</option>)}
      </select></div>}
  </div>
}

/** Editar as opções de uma seleção/status: nome, cor, grupo do status, excluir e adicionar. */
function EditorDeOpcoes({ prop, onMudar }: { prop: Propriedade; onMudar: (opcoes: Opcao[]) => void }) {
  const [nova, setNova] = useState('')
  const [cor, setCor] = useState<{ id: string; ancora: HTMLElement } | null>(null)
  const opcoes = prop.opcoes ?? []
  const trocar = (id: string, mudanca: Partial<Opcao>) => onMudar(opcoes.map(o => o.id === id ? { ...o, ...mudanca } : o))
  const mover = (id: string, delta: number) => {
    const i = opcoes.findIndex(o => o.id === id), j = i + delta
    if (j < 0 || j >= opcoes.length) return
    const lista = [...opcoes]; [lista[i], lista[j]] = [lista[j], lista[i]]; onMudar(lista)
  }
  return <div>
    <div className={x.menuLabel}>Opções</div>
    {opcoes.map(o => <div key={o.id} className={x.filterRow}>
      <button type="button" className={x.colorDot} aria-label="Cor" onClick={e => setCor({ id: o.id, ancora: e.currentTarget })}><span className={x.tag} data-cor={o.cor} style={{ width: 14, height: 14, padding: 0 }} /></button>
      <input defaultValue={o.nome} aria-label="Nome da opção" onBlur={e => { const nome = e.target.value.trim(); if (nome && nome !== o.nome) trocar(o.id, { nome }) }}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} />
      {prop.tipo === 'status' && <select value={o.grupo} aria-label="Grupo" onChange={e => trocar(o.id, { grupo: e.target.value as Opcao['grupo'] })}>
        {(['a_fazer', 'em_andamento', 'concluido'] as const).map(g => <option key={g} value={g}>{NOME_GRUPO_STATUS[g]}</option>)}
      </select>}
      <button type="button" className={x.rowBtn} aria-label="Subir" onClick={() => mover(o.id, -1)}><ArrowUp size={14} /></button>
      <button type="button" className={x.rowBtn} aria-label="Excluir opção" onClick={() => onMudar(opcoes.filter(p => p.id !== o.id))}><X size={14} /></button>
    </div>)}
    <form className={x.filterRow} onSubmit={e => {
      e.preventDefault()
      const nome = nova.trim(); if (!nome || opcoes.some(o => o.nome.toLowerCase() === nome.toLowerCase())) return
      onMudar([...opcoes, { id: novoId(), nome, cor: CORES[(opcoes.length + 1) % CORES.length], ...(prop.tipo === 'status' ? { grupo: 'a_fazer' as const } : {}) }]); setNova('')
    }}>
      <input value={nova} onChange={e => setNova(e.target.value)} placeholder="Nova opção…" aria-label="Nova opção" />
      <button type="submit" className={x.rowBtn} aria-label="Adicionar opção"><Plus size={14} /></button>
    </form>
    {cor && <Menu ancora={cor.ancora} onFechar={() => setCor(null)}>
      <div className={x.menuLabel}>Cores</div>
      {CORES.map(c => <ItemMenu key={c} onClick={() => { trocar(cor.id, { cor: c }); setCor(null) }}
        direita={opcoes.find(o => o.id === cor.id)?.cor === c ? <span style={{ marginLeft: 'auto' }}>✓</span> : undefined}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span className={x.tag} data-cor={c} style={{ width: 18, height: 18, padding: 0 }} />{NOME_COR[c]}</span>
      </ItemMenu>)}
    </Menu>}
  </div>
}

/** Menu do cabeçalho da coluna (ou do nome da propriedade na página do item). */
export function MenuPropriedade({ ancora, prop, esquema, visao, editavel, onFechar, onMudar, onExcluir, onMudarVisao }: {
  ancora: HTMLElement; prop: Propriedade | null; esquema: Propriedade[]; visao?: Visao; editavel: boolean; onFechar: () => void
  onMudar: (mudanca: Partial<Propriedade>) => void; onExcluir: () => void; onMudarVisao?: (mudanca: Partial<Visao>) => void
}) {
  const [tela, setTela] = useState<'principal' | 'tipo'>('principal')
  const chave = prop?.id ?? 'titulo'
  if (tela === 'tipo' && prop) return <Menu ancora={ancora} onFechar={onFechar} className={x.menuWide}>
    <ItemMenu icone={ChevronLeft} onClick={() => setTela('principal')}>Voltar</ItemMenu>
    <ListaTipos atual={prop.tipo} onEscolher={(tipo, extra) => {
      // Entre tipos com opções, as opções vão junto; o servidor converte os valores dos itens.
      onMudar({ tipo, opcoes: COM_OPCOES.includes(tipo) ? (prop.opcoes ?? []).map(o => tipo === 'status' ? { ...o, grupo: o.grupo ?? 'a_fazer' } : o) : undefined,
        formato: tipo === 'numero' ? prop.formato ?? 'numero' : undefined, ...extra })
      if (tipo === 'formula' || tipo === 'agregacao') setTela('principal'); else onFechar()
    }} />
  </Menu>
  const ordenar = (direcao: 'asc' | 'desc') => { onMudarVisao?.({ ordenacao: [{ prop: chave, direcao }, ...(visao?.ordenacao ?? []).filter(o => o.prop !== chave)] }); onFechar() }
  return <Menu ancora={ancora} onFechar={onFechar} className={prop?.tipo === "formula" ? x.menuFormula : x.menuWide}>
    {prop && editavel && <input autoFocus className={x.menuInput} defaultValue={prop.nome} aria-label="Nome da propriedade" maxLength={100}
      onBlur={e => { const nome = e.target.value.trim(); if (nome && nome !== prop.nome) onMudar({ nome }) }}
      onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur(); onFechar() } }} />}
    {prop && editavel && <ItemMenu icone={ICONE_TIPO[prop.tipo]} onClick={() => setTela('tipo')} direita={<small>{NOME_TIPO[prop.tipo]}</small>}>Tipo</ItemMenu>}
    {prop?.tipo === 'formula' && editavel && <><div className={x.menuSep} /><EditorFormula prop={prop} esquema={esquema} onMudar={expressao => { onMudar({ expressao }); onFechar() }} /></>}
    {prop?.tipo === 'agregacao' && editavel && <><div className={x.menuSep} /><EditorAgregacao prop={prop} esquema={esquema} onMudar={onMudar} /></>}
    {(prop?.tipo === 'numero' || prop?.tipo === 'formula' || prop?.tipo === 'agregacao') && editavel && <div className={x.filterRow}>
      <span className={x.muted} style={{ fontSize: 13 }}>Formato</span>
      <select value={prop.formato ?? 'numero'} aria-label="Formato do número" onChange={e => onMudar({ formato: e.target.value as FormatoNumero })} style={{ flex: 1 }}>
        <option value="numero">Número</option><option value="real">Real (R$)</option><option value="porcentagem">Porcentagem</option>
      </select>
    </div>}
    {prop && editavel && COM_OPCOES.includes(prop.tipo) && <><div className={x.menuSep} /><EditorDeOpcoes prop={prop} onMudar={opcoes => onMudar({ opcoes })} /></>}
    {prop?.tipo === 'data' && editavel && <div className={x.filterRow}>
      <span className={x.muted} style={{ fontSize: 13 }}>Lembrete</span>
      <select value={prop.lembrete ?? ''} aria-label="Lembrete" style={{ flex: 1 }} onChange={e => onMudar({ lembrete: (e.target.value || undefined) as Propriedade['lembrete'] })}>
        <option value="">Sem lembrete</option><option value="no_dia">No dia</option><option value="um_dia_antes">Um dia antes</option>
      </select>
    </div>}
    {onMudarVisao && <>
      <div className={x.menuSep} />
      <ItemMenu icone={ArrowUp} onClick={() => ordenar('asc')}>Ordenar crescente</ItemMenu>
      <ItemMenu icone={ArrowDown} onClick={() => ordenar('desc')}>Ordenar decrescente</ItemMenu>
      <ItemMenu icone={Filter} onClick={() => {
        onMudarVisao({ filtros: [...(visao?.filtros ?? []), { prop: chave, operador: operadoresDe(prop?.tipo ?? 'titulo')[0] }] }); onFechar()
      }}>Filtrar</ItemMenu>
      {prop && <ItemMenu icone={EyeOff} onClick={() => { onMudarVisao({ visiveis: (visao?.visiveis ?? []).filter(v => v !== prop.id) }); onFechar() }}>Ocultar nesta visão</ItemMenu>}
    </>}
    {prop && editavel && <div className={x.menuSep} />}
    {prop && editavel && <ItemMenu icone={Trash2} perigo onClick={() => {
      if (window.confirm(`Excluir a propriedade “${prop.nome}”? Os valores dela em todos os itens serão apagados.`)) { onExcluir(); onFechar() }
    }}>Excluir propriedade</ItemMenu>}
  </Menu>
}
