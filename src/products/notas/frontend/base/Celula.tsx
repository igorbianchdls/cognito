'use client'

import { useState, type ReactNode } from 'react'
import {
  AtSign, Calendar, CheckSquare, Clock, FileText, Hash, Link2, List, Loader, Maximize2, Phone, Tags, Type, User, UserPlus, X,
  type LucideIcon,
} from 'lucide-react'
import {
  AUTOMATICOS, formatarData, formatarNumero, NOME_GRUPO_STATUS, validarValor, valorDe, type Item, type Opcao, type Propriedade, type TipoPropriedade,
} from '@/products/notas/shared/bases'
import { tituloExibido } from '@/products/notas/shared/arvore'
import { Menu } from '../Menu'
import { useNotas } from '../NotasProvider'
import type { Pessoa } from './pessoas'
import x from '../notas.module.css'

export const ICONE_TIPO: Record<TipoPropriedade | 'titulo', LucideIcon> = {
  titulo: Type, texto: List, numero: Hash, selecao: Tags, multisselecao: Tags, status: Loader, data: Calendar, pessoa: User,
  checkbox: CheckSquare, url: Link2, email: AtSign, telefone: Phone, criado_em: Clock, editado_em: Clock, criado_por: UserPlus, editado_por: UserPlus,
}

export function Etiqueta({ opcao, status }: { opcao: Opcao; status?: boolean }) {
  return <span className={`${x.tag} ${status ? x.statusTag : ''}`} data-cor={opcao.cor}>{opcao.nome}</span>
}

function PessoaChip({ id, pessoas }: { id: string; pessoas: Pessoa[] }) {
  const p = pessoas.find(q => q.id === id)
  const nome = p?.nome ?? 'Pessoa'
  return <span className={x.person}>
    <span className={x.avatar}>
      {/* eslint-disable-next-line @next/next/no-img-element -- avatar pequeno do Clerk */}
      {p?.foto ? <img src={p.foto} alt="" /> : nome.slice(0, 1).toUpperCase()}
    </span>
    <span className={x.cellText}>{nome}</span>
  </span>
}

/** O valor como aparece na tabela, no cartão do quadro e na lista. */
export function Valor({ prop, valor, pessoas, quebrar }: { prop: Propriedade; valor: unknown; pessoas: Pessoa[]; quebrar?: boolean }) {
  if (valor === null || valor === undefined || valor === '' || (Array.isArray(valor) && !valor.length)) {
    return prop.tipo === 'checkbox' ? <span className={x.check} /> : null
  }
  switch (prop.tipo) {
    case 'numero': return <span className={x.cellText} style={{ marginLeft: 'auto' }}>{formatarNumero(valor as number, prop.formato)}</span>
    case 'checkbox': return <span className={`${x.check} ${valor ? x.checkOn : ''}`}>{valor ? '✓' : ''}</span>
    case 'selecao': case 'status': {
      const o = prop.opcoes?.find(q => q.id === valor)
      return o ? <Etiqueta opcao={o} status={prop.tipo === 'status'} /> : null
    }
    case 'multisselecao': return <span className={x.tags}>{(valor as string[]).map(id => prop.opcoes?.find(o => o.id === id)).filter(Boolean).map(o => <Etiqueta key={o!.id} opcao={o!} />)}</span>
    case 'data': case 'criado_em': case 'editado_em':
      return <span className={x.cellText}>{prop.tipo === 'data' ? formatarData(valor as string)
        : new Date(valor as string).toLocaleString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
    case 'pessoa': case 'criado_por': case 'editado_por':
      return <span className={x.tags}>{(valor as string[]).map(id => <PessoaChip key={id} id={id} pessoas={pessoas} />)}</span>
    case 'url': return <a className={`${x.link} ${x.cellText}`} href={/^https?:\/\//.test(String(valor)) ? String(valor) : `https://${valor}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{String(valor)}</a>
    case 'email': return <a className={`${x.link} ${x.cellText}`} href={`mailto:${valor}`} onClick={e => e.stopPropagation()}>{String(valor)}</a>
    case 'telefone': return <a className={`${x.link} ${x.cellText}`} href={`tel:${valor}`} onClick={e => e.stopPropagation()}>{String(valor)}</a>
    default: return <span className={quebrar ? x.cellWrap : x.cellText}>{String(valor)}</span>
  }
}

/** Seleção, múltipla e status: buscar, marcar e criar opção digitando (como no Notion). */
function EditorOpcoes({ prop, valor, ancora, onFechar, onMudar, criarOpcao }: {
  prop: Propriedade; valor: unknown; ancora: HTMLElement; onFechar: () => void; onMudar: (v: unknown) => void; criarOpcao: (nome: string) => Promise<string | null>
}) {
  const [busca, setBusca] = useState('')
  const multi = prop.tipo === 'multisselecao'
  const marcados = multi ? (valor as string[] | null) ?? [] : valor ? [valor as string] : []
  const opcoes = (prop.opcoes ?? []).filter(o => o.nome.toLowerCase().includes(busca.trim().toLowerCase()))
  const exata = (prop.opcoes ?? []).some(o => o.nome.toLowerCase() === busca.trim().toLowerCase())
  const escolher = (id: string) => {
    if (multi) onMudar(marcados.includes(id) ? marcados.filter(m => m !== id) : [...marcados, id])
    else { onMudar(marcados[0] === id ? null : id); onFechar() }
  }
  const criar = async () => { const nome = busca.trim(); if (!nome) return; setBusca(''); const id = await criarOpcao(nome); if (id) { if (multi) onMudar([...marcados, id]); else { onMudar(id); onFechar() } } }
  const lista = (grupo?: string) => opcoes.filter(o => !grupo || o.grupo === grupo).map(o => <button key={o.id} type="button" className={`${x.optRow} ${marcados.includes(o.id) ? x.optRowOn : ''}`} onClick={() => escolher(o.id)}>
    <Etiqueta opcao={o} status={prop.tipo === 'status'} />{marcados.includes(o.id) && <span className={x.grip}>✓</span>}
  </button>)
  return <Menu ancora={ancora} onFechar={onFechar} className={x.menuWide}>
    <div className={x.optSearch}>
      {marcados.map(id => prop.opcoes?.find(o => o.id === id)).filter(Boolean).map(o => <span key={o!.id} className={x.tag} data-cor={o!.cor}>
        {o!.nome}<button type="button" aria-label={`Tirar ${o!.nome}`} onClick={() => escolher(o!.id)} style={{ marginLeft: 4, display: 'inline-flex' }}><X size={12} /></button>
      </span>)}
      <input autoFocus value={busca} onChange={e => setBusca(e.target.value)} placeholder={prop.tipo === 'status' ? 'Buscar…' : 'Buscar ou criar opção…'}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (opcoes.length === 1 && busca.trim()) escolher(opcoes[0].id); else if (!exata) void criar() } }} />
    </div>
    <div className={x.optList}>
      {prop.tipo === 'status'
        ? (['a_fazer', 'em_andamento', 'concluido'] as const).map(g => <div key={g}><div className={x.menuLabel}>{NOME_GRUPO_STATUS[g]}</div>{lista(g)}</div>)
        : <><div className={x.menuLabel}>Selecione uma opção ou crie uma</div>{lista()}</>}
      {busca.trim() && !exata && <button type="button" className={x.optRow} onClick={() => void criar()}>Criar <span className={x.tag} data-cor="padrao">{busca.trim()}</span></button>}
    </div>
  </Menu>
}

/** Data de hoje no fuso de quem usa (AAAA-MM-DD). */
const hojeLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

function EditorData({ valor, ancora, onFechar, onMudar }: { valor: unknown; ancora: HTMLElement; onFechar: () => void; onMudar: (v: unknown) => void }) {
  return <Menu ancora={ancora} onFechar={onFechar} className={x.menuWide}>
    <input autoFocus type="date" className={x.menuInput} defaultValue={(valor as string) ?? ''} aria-label="Data"
      onChange={e => { if (e.target.value) onMudar(e.target.value) }} onKeyDown={e => { if (e.key === 'Enter') onFechar() }} />
    <button type="button" className={x.menuItem} onClick={() => { onMudar(hojeLocal()); onFechar() }}>Hoje</button>
    <button type="button" className={x.menuItem} onClick={() => { onMudar(null); onFechar() }}>Limpar</button>
  </Menu>
}

function EditorPessoas({ valor, pessoas, ancora, onFechar, onMudar }: { valor: unknown; pessoas: Pessoa[]; ancora: HTMLElement; onFechar: () => void; onMudar: (v: unknown) => void }) {
  const [busca, setBusca] = useState('')
  const marcados = (valor as string[] | null) ?? []
  const lista = pessoas.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))
  return <Menu ancora={ancora} onFechar={onFechar} className={x.menuWide}>
    <input autoFocus className={x.menuInput} value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar pessoas…" aria-label="Buscar pessoas" />
    <div className={x.optList}>
      {!lista.length && <div className={x.menuLabel}>Ninguém encontrado.</div>}
      {lista.map(p => <button key={p.id} type="button" className={`${x.optRow} ${marcados.includes(p.id) ? x.optRowOn : ''}`}
        onClick={() => onMudar(marcados.includes(p.id) ? marcados.filter(m => m !== p.id) : [...marcados, p.id])}>
        <PessoaChip id={p.id} pessoas={pessoas} />{marcados.includes(p.id) && <span className={x.grip}>✓</span>}
      </button>)}
    </div>
  </Menu>
}

/**
 * Uma célula editável: texto, número, URL, e-mail e telefone abrem uma caixa por cima (Enter grava, Esc desiste);
 * seleção, data e pessoa abrem um menu; caixa de seleção marca direto. O título também é uma célula.
 */
export function Celula({ item, prop, pessoas, editavel, className, style, onMudar, onTitulo, criarOpcao, onAbrir, quebrar, vazio, comecarEditando }: {
  item: Item; prop: Propriedade | null; pessoas: Pessoa[]; editavel: boolean; className?: string; style?: React.CSSProperties
  onMudar: (valor: unknown) => void; onTitulo: (titulo: string) => void; criarOpcao: (nome: string) => Promise<string | null>
  onAbrir?: () => void; quebrar?: boolean; vazio?: ReactNode
  /** Item recém-criado: o título já abre para digitar. */
  comecarEditando?: boolean
}) {
  const { avisar } = useNotas()
  const [editando, setEditando] = useState<HTMLElement | true | null>(comecarEditando ? true : null)
  const tipo = prop?.tipo ?? 'titulo'
  const valor = prop ? valorDe(item, prop.id, [prop]) : item.titulo
  const automatico = prop ? AUTOMATICOS.includes(prop.tipo) : false
  const textual = ['titulo', 'texto', 'numero', 'url', 'email', 'telefone'].includes(tipo)

  const gravar = (bruto: string) => {
    setEditando(null)
    if (!prop) { if (bruto !== item.titulo) onTitulo(bruto.replace(/\n/g, ' ')); return }
    const r = validarValor(prop, bruto)
    if (!r.ok) { avisar(r.erro); return }
    if (r.valor !== valor) onMudar(r.valor)
  }
  const abrir = (e: React.MouseEvent<HTMLElement>) => {
    if (!editavel || automatico) return
    if (tipo === 'checkbox') { onMudar(!valor); return }
    setEditando(e.currentTarget)
  }

  return <div className={className} style={style} onClick={abrir} role="gridcell"
    tabIndex={editavel && !automatico ? 0 : undefined} onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) { e.preventDefault(); (e.currentTarget as HTMLElement).click() } }}>
    {prop ? <Valor prop={prop} valor={valor} pessoas={pessoas} quebrar={quebrar} />
      : <>{item.icone ? <span>{item.icone}</span> : <FileText size={16} style={{ flexShrink: 0, marginTop: 2, opacity: .6 }} />}
        <span className={quebrar ? x.cellWrap : x.cellText}>{item.titulo || <span className={x.placeholder}>{tituloExibido('')}</span>}</span>
        {onAbrir && <button type="button" className={x.open} onClick={e => { e.stopPropagation(); onAbrir() }}><Maximize2 size={12} />ABRIR</button>}</>}
    {vazio && (valor === null || valor === undefined || valor === '' || (Array.isArray(valor) && !valor.length)) && prop?.tipo !== 'checkbox' && vazio}
    {editando && textual && <textarea autoFocus className={x.cellEditor} rows={1}
      defaultValue={prop?.tipo === 'numero' && typeof valor === 'number' ? String(valor).replace('.', ',') : (valor as string) ?? ''}
      onClick={e => e.stopPropagation()} onFocus={e => { const t = e.currentTarget; t.setSelectionRange(t.value.length, t.value.length) }}
      onKeyDown={e => {
        e.stopPropagation()
        if (e.key === 'Escape') setEditando(null)
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); gravar(e.currentTarget.value) }
      }}
      onBlur={e => gravar(e.currentTarget.value)} />}
    {editando instanceof HTMLElement && prop && (prop.tipo === 'selecao' || prop.tipo === 'multisselecao' || prop.tipo === 'status')
      && <EditorOpcoes prop={prop} valor={valor} ancora={editando} onFechar={() => setEditando(null)} onMudar={onMudar} criarOpcao={criarOpcao} />}
    {editando instanceof HTMLElement && prop?.tipo === 'data' && <EditorData valor={valor} ancora={editando} onFechar={() => setEditando(null)} onMudar={onMudar} />}
    {editando instanceof HTMLElement && prop?.tipo === 'pessoa' && <EditorPessoas valor={valor} pessoas={pessoas} ancora={editando} onFechar={() => setEditando(null)} onMudar={onMudar} />}
  </div>
}
