'use client'

import { Fragment, useState } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Expand, Plus, X } from 'lucide-react'
import { CellValueView, FieldControl, FieldIcon, RecordCard } from './FieldControl'
import { recordTitle, type CellValue, type DataRecord, type Field, type RecordPage, type TableBundle, type Values, type View } from '../shared/contracts'
import type { TablesApi } from './client'

export function DataGrid({ bundle, page, view, api, editable, busy, onEditField, onCreateField, onOpen, onCreate, onSave, selected, onSelect }: { bundle: TableBundle; page: RecordPage; view: View; api: TablesApi; editable: boolean; busy: boolean; onEditField: (field: Field) => void; onCreateField: () => void; onOpen: (record: DataRecord) => void; onCreate: () => void; onSave: (record: DataRecord, field: Field, value: CellValue) => Promise<boolean>; selected: Set<string>; onSelect: (ids: string[]) => void }) {
  const [editing, setEditing] = useState<{ record: string; field: string } | null>(null)
  const fields = bundle.campos.filter(f => view.campos.find(c => c.campo_id === f.id)?.visivel !== false).sort((a, b) => (view.campos.find(c => c.campo_id === a.id)?.posicao ?? Number(a.posicao)) - (view.campos.find(c => c.campo_id === b.id)?.posicao ?? Number(b.posicao)))
  const group = bundle.campos.find(f => f.id === view.configuracao.agrupamento)
  return <div className="tables-grid-scroll"><table className="tables-grid"><colgroup><col style={{ width: 42 }} /><col style={{ width: 52 }} />{fields.map(field => <col key={field.id} style={{ width: view.campos.find(c => c.campo_id === field.id)?.largura ?? (field.id === bundle.tabela.campo_principal_id ? 260 : 180) }} />)}<col style={{ width: 48 }} /></colgroup><thead><tr><th>{editable && <input type="checkbox" aria-label="Selecionar registros desta página" checked={page.registros.length > 0 && page.registros.every(r => selected.has(r.id))} onChange={e => onSelect(e.target.checked ? page.registros.map(r => r.id) : [])} />}</th><th>#</th>{fields.map(field => <th key={field.id}><button type="button" aria-label={`Editar campo ${field.nome}`} disabled={!editable} onClick={() => onEditField(field)}><FieldIcon type={field.tipo} /><span>{field.nome}</span><span className="tables-header-chevron">⌄</span></button></th>)}<th>{editable && <button type="button" aria-label="Adicionar campo" onClick={onCreateField}><Plus size={17} /></button>}</th></tr></thead><tbody>
    {page.registros.map((record, index) => {
      const groupValue = group ? String(record.valores[group.id] ?? '') : undefined
      const previousGroup = group && index > 0 ? String(page.registros[index - 1].valores[group.id] ?? '') : undefined
      const header = group && groupValue !== previousGroup
      return <Fragment key={record.id}>{header && <tr className="tables-group-row"><td colSpan={fields.length + 3}><span>{group.nome}</span><CellValueView field={group} value={record.valores[group.id]} members={bundle.usuarios} /></td></tr>}<tr className={selected.has(record.id) ? 'is-selected' : ''}>
        <td>{editable && <input type="checkbox" aria-label={`Selecionar registro ${index + 1}`} checked={selected.has(record.id)} onChange={e => onSelect(e.target.checked ? [...selected, record.id] : [...selected].filter(id => id !== record.id))} />}</td>
        <td className="tables-row-number"><span>{(page.pagina - 1) * page.tamanho + index + 1}</span><button type="button" aria-label={`Abrir ${recordTitle(record, bundle.campos, bundle.tabela.campo_principal_id)}`} onClick={() => onOpen(record)}><Expand size={13} /></button></td>
        {fields.map(field => <td key={field.id} className={editing?.record === record.id && editing.field === field.id ? 'is-editing' : ''}>
          <button type="button" className="tables-cell" disabled={busy} aria-label={`${field.nome}: ${String(record.valores[field.id] ?? 'vazio')}`} onClick={() => {
            if (!editable || field.tipo === 'anexo') onOpen(record)
            else if (field.tipo === 'checkbox') void onSave(record, field, record.valores[field.id] !== true)
            else setEditing({ record: record.id, field: field.id })
          }}><CellValueView field={field} value={record.valores[field.id]} members={bundle.usuarios} /></button>
          {editing?.record === record.id && editing.field === field.id && <CellEditor key={record.id + ':' + field.id} api={api} field={field} record={record} bundle={bundle} busy={busy} onClose={() => setEditing(null)} onSave={async value => { if (await onSave(record, field, value)) setEditing(null) }} />}
        </td>)}<td /></tr></Fragment>
    })}
    {editable && <tr className="tables-add-row"><td colSpan={fields.length + 3}><button type="button" disabled={busy} onClick={onCreate}><Plus size={16} />Adicionar registro</button></td></tr>}
    {!page.registros.length && <tr><td colSpan={fields.length + 3}><div className="tables-no-records"><strong>Nenhum registro por aqui</strong><span>Adicione seu primeiro registro ou ajuste os filtros.</span>{editable && <button className="tables-button-primary" onClick={onCreate}><Plus size={15} />Novo registro</button>}</div></td></tr>}
    <tr className="tables-grid-space" aria-hidden="true"><td /><td />{fields.map(f => <td key={f.id} />)}<td /></tr>
  </tbody><tfoot><tr><td /><td />{fields.map(field => <td key={field.id}>{page.somas[field.id] !== undefined && <span className="tables-sum"><small>Soma</small><CellValueView field={field} value={page.somas[field.id]} members={bundle.usuarios} /></span>}</td>)}<td /></tr></tfoot></table></div>
}

function CellEditor({ field, record, bundle, api, onClose, onSave, busy }: { field: Field; record: DataRecord; bundle: TableBundle; api: TablesApi; onClose: () => void; onSave: (value: CellValue) => Promise<void>; busy: boolean }) {
  const [value, setValue] = useState<CellValue>(record.valores[field.id] ?? null)
  return <form className="tables-cell-editor" onSubmit={e => { e.preventDefault(); void onSave(value) }} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }}><FieldControl autoFocus field={field} value={value} onChange={setValue} api={api} members={bundle.usuarios} disabled={busy} /><div><button type="button" aria-label="Cancelar edição" onClick={onClose} disabled={busy}><X size={14} /></button><button className="tables-button-primary" type="submit" disabled={busy} aria-label="Salvar célula"><Check size={14} /></button></div></form>
}

export function KanbanView({ bundle, page, view, editable, busy, onOpen, onMove, onCreate, onConfigure }: { bundle: TableBundle; page: RecordPage; view: View; editable: boolean; busy: boolean; onOpen: (r: DataRecord) => void; onMove: (r: DataRecord, f: Field, v: CellValue) => void; onCreate: (values: Values) => void; onConfigure: () => void }) {
  const field = bundle.campos.find(f => f.id === view.configuracao.agrupamento && f.tipo === 'selecao')
  if (!field) return <div className="tables-empty-view"><strong>Escolha como organizar os cartões</strong><p>O Kanban precisa de um campo de seleção única.</p>{editable && <button onClick={onConfigure}>Configurar visualização</button>}</div>
  const groups = [{ id: '', nome: 'Sem status', cor: '#94a3b8' }, ...field.opcoes.filter(o => !o.arquivado || page.registros.some(r => (r.valores[field.id] as string[] | undefined)?.includes(o.id)))]
  return <div className="tables-kanban">{groups.map(group => {
    const rows = page.registros.filter(r => ((r.valores[field.id] as string[] | undefined)?.[0] ?? '') === group.id)
    return <section className="tables-kanban-column" key={group.id} onDragOver={e => { if (editable && !busy) e.preventDefault() }} onDrop={e => { e.preventDefault(); if (!editable || busy) return; const record = page.registros.find(r => r.id === e.dataTransfer.getData('text/plain')); if (record) onMove(record, field, group.id ? [group.id] : []) }}><header><span className="tables-dot" style={{ background: group.cor }} /><strong>{group.nome}</strong><span>{rows.length}</span>{editable && <button aria-label={`Adicionar em ${group.nome}`} onClick={() => onCreate({ [field.id]: group.id ? [group.id] : [] })}><Plus size={15} /></button>}</header><div className="tables-kanban-cards">{rows.map(record => <div key={record.id} draggable={editable && !busy} onDragStart={e => e.dataTransfer.setData('text/plain', record.id)}><RecordCard record={record} bundle={bundle} onOpen={() => onOpen(record)} /></div>)}{!rows.length && <p className="tables-muted">Arraste um cartão para cá.</p>}</div>{editable && <button className="tables-add-card" onClick={() => onCreate({ [field.id]: group.id ? [group.id] : [] })}><Plus size={14} />Novo registro</button>}</section>
  })}</div>
}

export function CalendarView({ bundle, page, view, month, onMonth, onOpen, onCreate, editable, onConfigure }: { bundle: TableBundle; page: RecordPage; view: View; month: Date; onMonth: (date: Date) => void; onOpen: (r: DataRecord) => void; onCreate: (values: Values) => void; editable: boolean; onConfigure: () => void }) {
  const field = bundle.campos.find(f => f.id === view.configuracao.campo_data && ['data', 'data_hora'].includes(f.tipo))
  if (!field) return <div className="tables-empty-view"><CalendarDays size={30} /><strong>Escolha um campo de data</strong><p>O calendário organiza os registros pela data escolhida.</p>{editable && <button onClick={onConfigure}>Configurar visualização</button>}</div>
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first); start.setDate(1 - (first.getDay() + 6) % 7)
  const days = Array.from({ length: 42 }, (_, i) => { const day = new Date(start); day.setDate(start.getDate() + i); return day })
  const key = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const today = key(new Date())
  return <div className="tables-calendar"><header><h2>{month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2><button aria-label="Mês anterior" onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={16} /></button><button onClick={() => onMonth(new Date())}>Hoje</button><button aria-label="Próximo mês" onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={16} /></button></header><div className="tables-calendar-week">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => <span key={d}>{d}</span>)}</div><div className="tables-calendar-grid">{days.map(day => {
    const date = key(day), rows = page.registros.filter(r => { const value = r.valores[field.id]; return value && (field.tipo === 'data_hora' ? key(new Date(String(value))) : String(value)) === date })
    return <section key={date} className={`${day.getMonth() !== month.getMonth() ? 'is-outside' : ''} ${today === date ? 'is-today' : ''}`}><div><time dateTime={date}>{day.getDate()}</time>{editable && <button aria-label={`Adicionar registro em ${date}`} onClick={() => onCreate({ [field.id]: field.tipo === 'data_hora' ? new Date(date + 'T09:00').toISOString() : date })}><Plus size={13} /></button>}</div>{rows.map(record => <button key={record.id} className="tables-calendar-record" onClick={() => onOpen(record)}>{recordTitle(record, bundle.campos, bundle.tabela.campo_principal_id)}</button>)}</section>
  })}</div></div>
}
