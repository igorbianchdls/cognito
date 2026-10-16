'use client'

import { useState } from 'react'
import { CheckSquare, CalendarDays, Hash, Link2, ListFilter, Type, Users, Paperclip, AtSign, Globe } from 'lucide-react'
import type { CellValue, DataRecord, Field, Member, RecordPage, TableBundle } from '../shared/contracts'
import { recordTitle } from '../shared/contracts'
import { useResource, type TablesApi } from './client'

export function FieldIcon({ type }: { type: Field['tipo'] }) {
  const Icon = type === 'checkbox' ? CheckSquare : ['data', 'data_hora'].includes(type) ? CalendarDays : ['numero', 'moeda'].includes(type) ? Hash : ['selecao', 'selecao_multipla'].includes(type) ? ListFilter : ['usuario', 'usuarios'].includes(type) ? Users : type === 'vinculo' ? Link2 : type === 'anexo' ? Paperclip : type === 'email' ? AtSign : type === 'url' ? Globe : Type
  return <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
}

const idsOf = (value: CellValue | undefined) => Array.isArray(value) ? value : value ? [String(value)] : []

export function FieldControl({ field, value, onChange, members, api, disabled, autoFocus }: { field: Field; value: CellValue | undefined; onChange: (v: CellValue) => void; members: Member[]; api: TablesApi; disabled?: boolean; autoFocus?: boolean }) {
  const [search, setSearch] = useState('')
  const target = useResource<TableBundle>(api, field.tipo === 'vinculo' && field.tabela_destino_id ? `/tabelas/${field.tabela_destino_id}` : null)
  const links = useResource<RecordPage>(api, field.tipo === 'vinculo' && field.tabela_destino_id ? `/tabelas/${field.tabela_destino_id}/registros?tamanho=100&busca=${encodeURIComponent(search)}` : null)
  const label = field.nome
  if (field.tipo === 'anexo') return <span className="tables-muted">Envie arquivos na seção de anexos do registro.</span>
  if (field.tipo === 'checkbox') return <input aria-label={label} type="checkbox" checked={value === true} disabled={disabled} onChange={e => onChange(e.target.checked)} autoFocus={autoFocus} />
  if (['selecao', 'selecao_multipla', 'usuario', 'usuarios', 'vinculo'].includes(field.tipo)) {
    const multiple = ['selecao_multipla', 'usuarios', 'vinculo'].includes(field.tipo)
    const options = ['selecao', 'selecao_multipla'].includes(field.tipo) ? field.opcoes.map(o => ({ id: o.id, nome: o.nome, disabled: o.arquivado })) : ['usuario', 'usuarios'].includes(field.tipo) ? members : (links.data?.registros ?? []).map(r => ({ id: r.id, nome: recordTitle(r, target.data?.campos ?? [], target.data?.tabela.campo_principal_id) }))
    const selected = idsOf(value)
    const missing = selected.filter(id => !options.some(o => o.id === id))
    return <div className="tables-control-stack">{field.tipo === 'vinculo' && <input aria-label={`Buscar em ${field.nome}`} placeholder="Buscar registros…" value={search} onChange={e => setSearch(e.target.value)} />}
      <select aria-label={label} multiple={multiple} size={multiple ? Math.min(5, Math.max(2, options.length + missing.length)) : undefined} value={multiple ? selected : selected[0] ?? ''} disabled={disabled} autoFocus={autoFocus} onChange={e => onChange(multiple ? [...e.target.selectedOptions].map(o => o.value) : e.target.value ? [e.target.value] : [])}>
        {!multiple && <option value="">Sem seleção</option>}{missing.map(id => <option key={id} value={id}>Item indisponível ({id.slice(0, 6)})</option>)}{options.map(o => <option key={o.id} value={o.id} disabled={'disabled' in o && Boolean(o.disabled)}>{o.nome}</option>)}
      </select>{multiple && <small className="tables-muted">Use Ctrl ou ⌘ para selecionar vários.</small>}{links.error && <small role="alert">{links.error}</small>}
    </div>
  }
  if (field.tipo === 'texto_longo') return <textarea aria-label={label} value={String(value ?? '')} disabled={disabled} autoFocus={autoFocus} rows={3} onChange={e => onChange(e.target.value || null)} />
  const type = field.tipo === 'data' ? 'date' : field.tipo === 'data_hora' ? 'datetime-local' : field.tipo === 'numero' ? 'number' : field.tipo === 'email' ? 'email' : field.tipo === 'url' ? 'url' : 'text'
  const text = field.tipo === 'data_hora' && value ? toLocalDateTime(String(value)) : String(value ?? '')
  return <input aria-label={label} type={type} inputMode={field.tipo === 'moeda' ? 'decimal' : undefined} step={field.tipo === 'numero' ? 'any' : undefined} value={text} disabled={disabled} autoFocus={autoFocus} onChange={e => {
    const next = e.target.value
    onChange(!next ? null : field.tipo === 'numero' ? Number(next) : field.tipo === 'data_hora' ? new Date(next).toISOString() : field.tipo === 'moeda' ? next.replace(',', '.') : next)
  }} />
}

function toLocalDateTime(iso: string) {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function CellValueView({ field, value, members }: { field: Field; value?: CellValue; members: Member[] }) {
  if (value == null || value === '' || Array.isArray(value) && !value.length) return <span className="tables-empty-cell">—</span>
  if (field.tipo === 'checkbox') return <span aria-label={value ? 'Marcado' : 'Desmarcado'} className={value ? 'tables-checked' : 'tables-unchecked'}>{value ? '✓' : ''}</span>
  if (['selecao', 'selecao_multipla'].includes(field.tipo)) return <span className="tables-pills">{idsOf(value).map(id => { const option = field.opcoes.find(o => o.id === id); return <span key={id} className="tables-pill" style={{ background: (option?.cor ?? '#94a3b8') + '22', color: option?.cor ?? '#666' }}>{option?.nome ?? 'Opção arquivada'}</span> })}</span>
  if (['usuario', 'usuarios'].includes(field.tipo)) return <span className="tables-pills">{idsOf(value).map(id => { const name = members.find(m => m.id === id)?.nome ?? 'Usuário removido'; return <span key={id} className="tables-person"><span className="tables-avatar">{name.split(' ').slice(0, 2).map(s => s[0]).join('')}</span>{name}</span> })}</span>
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
