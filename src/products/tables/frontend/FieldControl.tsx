'use client'

import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Check, CheckSquare, CalendarDays, Clock, Hash, Link2, ListFilter, Percent, Phone, Search, Sigma, Star, Type, UserCheck, Users, Paperclip, AtSign, Globe, Variable, X } from 'lucide-react'
import type { CellValue, DataRecord, Field, Member, RecordPage, TableBundle } from '../shared/contracts'
import { isComputed, recordTitle } from '../shared/contracts'
import { useResource, type TablesApi } from './client'

export function FieldIcon({ type }: { type: Field['tipo'] }) {
  const Icon = type === 'telefone' ? Phone : type === 'porcentagem' ? Percent : type === 'avaliacao' ? Star : type === 'formula' ? Variable : type === 'agregacao' ? Sigma : type === 'busca' ? Search : ['criado_em', 'alterado_em'].includes(type) ? Clock : ['criado_por', 'alterado_por'].includes(type) ? UserCheck : type === 'autonumero' ? Hash : type === 'checkbox' ? CheckSquare : ['data', 'data_hora'].includes(type) ? CalendarDays : ['numero', 'moeda'].includes(type) ? Hash : ['selecao', 'selecao_multipla'].includes(type) ? ListFilter : ['usuario', 'usuarios'].includes(type) ? Users : type === 'vinculo' ? Link2 : type === 'anexo' ? Paperclip : type === 'email' ? AtSign : type === 'url' ? Globe : Type
  return <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
}

const idsOf = (value: CellValue | undefined) => Array.isArray(value) ? value : value ? [String(value)] : []

export function FieldControl({ field, value, onChange, members, api, disabled, autoFocus }: { field: Field; value: CellValue | undefined; onChange: (v: CellValue) => void; members: Member[]; api: TablesApi; disabled?: boolean; autoFocus?: boolean }) {
  const [search, setSearch] = useState(''), [query, setQuery] = useState('')
  useEffect(() => { const timer = setTimeout(() => setQuery(search), 250); return () => clearTimeout(timer) }, [search])
  const target = useResource<TableBundle>(api, field.tipo === 'vinculo' && field.tabela_destino_id ? `/tabelas/${field.tabela_destino_id}` : null)
  const links = useResource<RecordPage>(api, field.tipo === 'vinculo' && field.tabela_destino_id ? `/tabelas/${field.tabela_destino_id}/registros?tamanho=100&busca=${encodeURIComponent(query)}` : null)
  const label = field.nome
  if (field.tipo === 'anexo') return <span className="tables-muted">Envie arquivos na seção de anexos do registro.</span>
  // Filled by the system or calculated: shown, never edited.
  if (isComputed(field.tipo)) return <span className="tables-computed"><CellValueView field={field} value={value} members={members} /></span>
  if (field.tipo === 'avaliacao') { const max = Number(field.configuracao.maximo ?? 5), current = Number(value ?? 0); return <span className="tables-rating" role="radiogroup" aria-label={label}>{Array.from({ length: max }, (_, i) => <button key={i} type="button" role="radio" aria-checked={current === i + 1} aria-label={`${i + 1} de ${max}`} disabled={disabled} autoFocus={autoFocus && i === 0} className={i < current ? 'is-on' : ''} onClick={() => onChange(current === i + 1 ? null : i + 1)}><Star size={16} /></button>)}</span> }
  if (field.tipo === 'checkbox') return <input aria-label={label} type="checkbox" checked={value === true} disabled={disabled} onChange={e => onChange(e.target.checked)} autoFocus={autoFocus} />
  if (['selecao', 'selecao_multipla', 'usuario', 'usuarios', 'vinculo'].includes(field.tipo)) {
    const multiple = ['selecao_multipla', 'usuarios', 'vinculo'].includes(field.tipo)
    const options = ['selecao', 'selecao_multipla'].includes(field.tipo) ? field.opcoes.map(o => ({ id: o.id, nome: o.nome, disabled: o.arquivado })) : ['usuario', 'usuarios'].includes(field.tipo) ? members : (links.data?.registros ?? []).map(r => ({ id: r.id, nome: recordTitle(r, target.data?.campos ?? [], target.data?.tabela.campo_principal_id) }))
    const selected = idsOf(value)
    if (multiple) {
      const remote = field.tipo === 'vinculo' ? { value: search, onChange: setSearch, loading: links.loading, error: links.error, truncated: (links.data?.total ?? 0) > (links.data?.registros.length ?? 0) } : undefined
      return <ChoicePicker label={label} options={options} selected={selected} disabled={disabled} autoFocus={autoFocus} unknownLabel={field.tipo === 'vinculo' ? 'Registro vinculado' : 'Item indisponível'} remote={remote} onChange={onChange} />
    }
    const missing = selected.filter(id => !options.some(o => o.id === id))
    return <select aria-label={label} value={selected[0] ?? ''} disabled={disabled} autoFocus={autoFocus} onChange={e => onChange(e.target.value ? [e.target.value] : [])}>
      <option value="">Sem seleção</option>{missing.map(id => <option key={id} value={id}>Item indisponível ({id.slice(0, 6)})</option>)}{options.map(o => <option key={o.id} value={o.id} disabled={'disabled' in o && Boolean(o.disabled)}>{o.nome}</option>)}
    </select>
  }
  if (field.tipo === 'texto_longo') return <textarea aria-label={label} value={String(value ?? '')} disabled={disabled} autoFocus={autoFocus} rows={3} onChange={e => onChange(e.target.value || null)} />
  const type = field.tipo === 'data' ? 'date' : field.tipo === 'data_hora' ? 'datetime-local' : ['numero', 'porcentagem'].includes(field.tipo) ? 'number' : field.tipo === 'telefone' ? 'tel' : field.tipo === 'email' ? 'email' : field.tipo === 'url' ? 'url' : 'text'
  const text = field.tipo === 'data_hora' && value ? toLocalDateTime(String(value)) : String(value ?? '')
  return <input aria-label={label} type={type} inputMode={field.tipo === 'moeda' ? 'decimal' : undefined} step={['numero', 'porcentagem'].includes(field.tipo) ? 'any' : undefined} value={text} disabled={disabled} autoFocus={autoFocus} onChange={e => {
    const next = e.target.value
    onChange(!next ? null : ['numero', 'porcentagem'].includes(field.tipo) ? Number(next) : field.tipo === 'data_hora' ? new Date(next).toISOString() : field.tipo === 'moeda' ? next.replace(',', '.') : next)
  }} />
}

function toLocalDateTime(iso: string) {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function CellValueView({ field, value, members }: { field: Field; value?: CellValue; members: Member[] }) {
  if (value == null || value === '' || Array.isArray(value) && !value.length) return <span className="tables-empty-cell">—</span>
  if (field.tipo === 'porcentagem') return <span>{new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(value))}%</span>
  if (field.tipo === 'avaliacao') { const max = Number(field.configuracao.maximo ?? 5), n = Number(value); return <span className="tables-stars" aria-label={`${n} de ${max}`}>{'★'.repeat(n)}<span>{'★'.repeat(Math.max(0, max - n))}</span></span> }
  if (field.tipo === 'autonumero') return <span className="tables-autonumber">{String(value)}</span>
  if (['criado_em', 'alterado_em'].includes(field.tipo)) return <span>{new Date(String(value)).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
  if (field.tipo === 'agregacao') return <span>{new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(value))}</span>
  if (field.tipo === 'busca') return <span className="tables-pills">{idsOf(value).map((text, i) => <span key={i} className="tables-pill tables-pill-plain">{text}</span>)}</span>
  if (field.tipo === 'formula') return value === '#ERRO' ? <span className="tables-formula-error" title="Confira a fórmula e os valores usados">#ERRO</span> : typeof value === 'boolean' ? <span>{value ? 'Sim' : 'Não'}</span> : typeof value === 'number' ? <span>{new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 6 }).format(value)}</span> : <span className="tables-truncate">{String(value)}</span>
  if (field.tipo === 'checkbox') return <span aria-label={value ? 'Marcado' : 'Desmarcado'} className={value ? 'tables-checked' : 'tables-unchecked'}>{value ? '✓' : ''}</span>
  if (['selecao', 'selecao_multipla'].includes(field.tipo)) return <span className="tables-pills">{idsOf(value).map(id => { const option = field.opcoes.find(o => o.id === id); return <span key={id} className="tables-pill" style={{ background: (option?.cor ?? '#94a3b8') + '22', color: option?.cor ?? '#666' }}>{option?.nome ?? 'Opção arquivada'}</span> })}</span>
  if (['usuario', 'usuarios', 'criado_por', 'alterado_por'].includes(field.tipo)) return <span className="tables-pills">{idsOf(value).map(id => { const name = members.find(m => m.id === id)?.nome ?? 'Usuário removido'; return <span key={id} className="tables-person"><span className="tables-avatar">{name.split(' ').slice(0, 2).map(s => s[0]).join('')}</span>{name}</span> })}</span>
  if (field.tipo === 'moeda') return <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: String(field.configuracao.moeda ?? 'BRL') }).format(Number(value))}</span>
  if (field.tipo === 'numero') return <span>{new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 6 }).format(Number(value))}</span>
  if (field.tipo === 'data') { const [y, m, d] = String(value).split('-'); return <span>{d}/{m}/{y}</span> }
  if (field.tipo === 'data_hora') return <span>{new Date(String(value)).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
  if (field.tipo === 'vinculo' || field.tipo === 'anexo') return <span className="tables-link-count">{idsOf(value).length} {field.tipo === 'vinculo' ? 'vínculo(s)' : 'arquivo(s)'}</span>
  return <span className="tables-truncate">{String(value)}</span>
}

export function RecordCard({ record, bundle, onOpen }: { record: DataRecord; bundle: TableBundle; onOpen: () => void }) {
  const secondary = bundle.campos.filter(f => f.id !== bundle.tabela.campo_principal_id && record.valores[f.id] != null).slice(0, 3)
  return <button type="button" className="tables-record-card" onClick={onOpen}><strong>{recordTitle(record, bundle.campos, bundle.tabela.campo_principal_id)}</strong>{secondary.map(field => <span key={field.id} className="tables-card-line"><FieldIcon type={field.tipo} /><CellValueView field={field} value={record.valores[field.id]} members={bundle.usuarios} /></span>)}</button>
}

type Choice = { id: string; nome: string; disabled?: boolean }
type RemoteSearch = { value: string; onChange: (value: string) => void; loading: boolean; error?: string; truncated: boolean }

/** Multiple choice with chips and a searchable list: works with mouse, touch and keyboard (↑ ↓ Enter). */
export function ChoicePicker({ label, options, selected, onChange, disabled, autoFocus, remote, unknownLabel }: { label: string; options: Choice[]; selected: string[]; onChange: (ids: string[]) => void; disabled?: boolean; autoFocus?: boolean; remote?: RemoteSearch; unknownLabel: string }) {
  const [filter, setFilter] = useState(''), [active, setActive] = useState(0)
  const listId = useId()
  // Linked records chosen from an earlier search keep their names after the search changes.
  const [picked, setPicked] = useState<Record<string, string>>({})
  const names = new Map([...Object.entries(picked), ...options.map(o => [o.id, o.nome] as [string, string])])
  const term = remote ? remote.value : filter
  const normalized = term.trim().toLocaleLowerCase('pt-BR')
  const visible = remote || !normalized ? options : options.filter(o => o.nome.toLocaleLowerCase('pt-BR').includes(normalized))
  const current = Math.min(active, Math.max(0, visible.length - 1))
  const toggle = (option: Choice) => {
    if (disabled || option.disabled && !selected.includes(option.id)) return
    setPicked(p => ({ ...p, [option.id]: option.nome }))
    onChange(selected.includes(option.id) ? selected.filter(id => id !== option.id) : [...selected, option.id])
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(Math.max(0, Math.min(visible.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))))
    } else if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault()
      if (visible[current]) toggle(visible[current])
    } else if (event.key === 'Backspace' && !term && selected.length) onChange(selected.slice(0, -1))
  }
  return <div className="tables-picker">
    <div className="tables-picker-chips" aria-live="polite">
      {selected.map(id => { const name = names.get(id) ?? unknownLabel; return <span key={id} className="tables-chip">{name}<button type="button" aria-label={`Remover ${name}`} disabled={disabled} onClick={() => onChange(selected.filter(x => x !== id))}><X size={12} /></button></span> })}
      {!selected.length && <span className="tables-muted">Nada selecionado</span>}
    </div>
    <input type="search" role="combobox" aria-label={label} aria-expanded="true" aria-controls={listId} aria-autocomplete="list" aria-activedescendant={visible[current] ? `${listId}-${current}` : undefined} placeholder={remote ? 'Buscar registros…' : 'Buscar opções…'} value={term} disabled={disabled} autoFocus={autoFocus} onKeyDown={onKeyDown} onChange={e => { setActive(0); if (remote) remote.onChange(e.target.value); else setFilter(e.target.value) }} />
    <ul id={listId} role="listbox" aria-multiselectable="true" aria-label={`Opções de ${label}`} className="tables-picker-list">
      {visible.map((option, index) => { const checked = selected.includes(option.id); return <li key={option.id} id={`${listId}-${index}`} role="option" aria-selected={checked} aria-disabled={Boolean(disabled || option.disabled && !checked)} className={index === current ? 'is-active' : ''} onMouseDown={e => e.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => toggle(option)}><span className="tables-picker-check" aria-hidden="true">{checked && <Check size={12} />}</span>{option.nome}</li> })}
      {!visible.length && <li role="presentation" className="tables-muted">{remote?.loading ? 'Buscando…' : 'Nenhum resultado'}</li>}
    </ul>
    {remote?.truncated && <small className="tables-muted">Mostrando os primeiros resultados. Refine a busca para encontrar outros.</small>}
    {remote?.error && <small role="alert">{remote.error}</small>}
  </div>
}

/** Destructive actions ask for a second click instead of a blocking browser dialog. */
export function ConfirmButton({ children, confirmLabel, onConfirm, disabled, className = 'tables-danger' }: { children: ReactNode; confirmLabel: string; onConfirm: () => void; disabled?: boolean; className?: string }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => { if (!armed) return; const timer = setTimeout(() => setArmed(false), 5000); return () => clearTimeout(timer) }, [armed])
  return <button type="button" className={`${className} ${armed ? 'is-armed' : ''}`} disabled={disabled} onClick={() => { if (!armed) return setArmed(true); setArmed(false); onConfirm() }}>{armed ? confirmLabel : children}</button>
}
