'use client'

import { Fragment, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Expand, Plus, X } from 'lucide-react'
import { CellValueView, FieldControl, FieldIcon, RecordCard } from './FieldControl'
import { recordTitle, type CellValue, type DataRecord, type Field, type RecordPage, type TableBundle, type Values, type View } from '../shared/contracts'
import type { TablesApi } from './client'

type Editing = { record: string; field: string; draft?: CellValue }
const TYPING_FIELDS: Field['tipo'][] = ['texto', 'texto_longo', 'email', 'url', 'numero', 'moeda']

/** Value used when the user starts typing on a selected cell, as in a spreadsheet. */
function typedDraft(field: Field, key: string): CellValue | undefined {
  if (!TYPING_FIELDS.includes(field.tipo)) return undefined
  if (field.tipo === 'numero') return /\d/.test(key) ? Number(key) : null
  if (field.tipo === 'moeda') return /[\d-]/.test(key) ? key : null
  return key
}

export function DataGrid({ bundle, page, view, api, editable, busy, pending, onEditField, onCreateField, onOpen, onCreate, onSave, selected, onSelect }: { bundle: TableBundle; page: RecordPage; view: View; api: TablesApi; editable: boolean; busy: boolean; pending: Set<string>; onEditField: (field: Field) => void; onCreateField: () => void; onOpen: (record: DataRecord) => void; onCreate: () => void; onSave: (record: DataRecord, field: Field, value: CellValue) => Promise<boolean>; selected: Set<string>; onSelect: (ids: string[]) => void }) {
  const [editing, setEditing] = useState<Editing | null>(null)
  const [active, setActive] = useState({ row: 0, col: 0 })
  const gridRef = useRef<HTMLTableElement>(null)
  const columnOf = (id: string) => view.campos.find(c => c.campo_id === id)
  const fields = bundle.campos.filter(f => columnOf(f.id)?.visivel !== false).sort((a, b) => (columnOf(a.id)?.posicao ?? Number(a.posicao)) - (columnOf(b.id)?.posicao ?? Number(b.posicao)))
  const group = bundle.campos.find(f => f.id === view.configuracao.agrupamento)
  const rows = page.registros
  const row = Math.min(active.row, Math.max(0, rows.length - 1)), col = Math.min(active.col, Math.max(0, fields.length - 1))

  function focusCell(r: number, c: number) {
    const cell = () => gridRef.current?.querySelector<HTMLElement>(`[data-cell="${r}:${c}"]`)
    // Cells already on screen take focus at once; after closing an editor, wait for the next frame.
    const target = cell(); if (target) target.focus(); else requestAnimationFrame(() => cell()?.focus())
  }
  function move(r: number, c: number) {
    const next = { row: Math.max(0, Math.min(rows.length - 1, r)), col: Math.max(0, Math.min(fields.length - 1, c)) }
    setActive(next); focusCell(next.row, next.col)
  }
  function activate(record: DataRecord, field: Field, draft?: CellValue) {
    if (!editable || field.tipo === 'anexo') onOpen(record)
    else if (busy) return
    else if (field.tipo === 'checkbox') void onSave(record, field, record.valores[field.id] !== true)
    else setEditing({ record: record.id, field: field.id, draft })
  }
  function onCellKeyDown(event: KeyboardEvent<HTMLButtonElement>, r: number, c: number, record: DataRecord, field: Field) {
    const jump = event.ctrlKey || event.metaKey
    const keys: Record<string, () => void> = {
      ArrowUp: () => move(jump ? 0 : r - 1, c), ArrowDown: () => move(jump ? rows.length - 1 : r + 1, c),
      ArrowLeft: () => move(r, jump ? 0 : c - 1), ArrowRight: () => move(r, jump ? fields.length - 1 : c + 1),
      Home: () => move(jump ? 0 : r, 0), End: () => move(jump ? rows.length - 1 : r, fields.length - 1),
      PageUp: () => move(r - 10, c), PageDown: () => move(r + 10, c),
      Enter: () => activate(record, field), F2: () => activate(record, field), ' ': () => activate(record, field),
      Delete: () => { if (editable && !busy && !['anexo', 'checkbox'].includes(field.tipo) && record.valores[field.id] != null) void onSave(record, field, null) },
    }
    keys.Backspace = keys.Delete
    const handler = keys[event.key]
    if (handler && !event.altKey) { event.preventDefault(); handler(); return }
    if (event.key.length === 1 && !jump && !event.altKey && editable && !busy) {
      const draft = typedDraft(field, event.key)
      if (draft !== undefined) { event.preventDefault(); setEditing({ record: record.id, field: field.id, draft }) }
    }
  }
  function closeEditor(r: number, c: number) { setEditing(null); focusCell(r, c) }

  return <div className="tables-grid-scroll"><table ref={gridRef} className="tables-grid" role="grid" aria-label={`${bundle.tabela.nome}: ${view.nome}`} aria-rowcount={page.total + 1}><colgroup><col style={{ width: 42 }} /><col style={{ width: 52 }} />{fields.map(field => <col key={field.id} style={{ width: columnOf(field.id)?.largura ?? (field.id === bundle.tabela.campo_principal_id ? 260 : 180) }} />)}<col style={{ width: 48 }} /></colgroup>
    <thead><tr><th>{editable && <input type="checkbox" aria-label="Selecionar registros desta página" checked={rows.length > 0 && rows.every(r => selected.has(r.id))} onChange={e => onSelect(e.target.checked ? rows.map(r => r.id) : [])} />}</th><th>#</th>{fields.map(field => <th key={field.id}><button type="button" aria-label={`Editar campo ${field.nome}`} disabled={!editable} onClick={() => onEditField(field)}><FieldIcon type={field.tipo} /><span>{field.nome}</span><span className="tables-header-chevron">⌄</span></button></th>)}<th>{editable && <button type="button" aria-label="Adicionar campo" onClick={onCreateField}><Plus size={17} /></button>}</th></tr></thead>
    <tbody>
      {rows.map((record, index) => {
        const groupValue = group ? String(record.valores[group.id] ?? '') : undefined
        const header = group && (index === 0 || groupValue !== String(rows[index - 1].valores[group.id] ?? ''))
        return <Fragment key={record.id}>{header && <tr className="tables-group-row"><td colSpan={fields.length + 3}><span>{group.nome}</span><CellValueView field={group} value={record.valores[group.id]} members={bundle.usuarios} /></td></tr>}
          <tr className={`${selected.has(record.id) ? 'is-selected' : ''} ${pending.has(record.id) ? 'is-saving' : ''}`} aria-busy={pending.has(record.id)}>
            <td>{editable && <input type="checkbox" aria-label={`Selecionar registro ${index + 1}`} checked={selected.has(record.id)} onChange={e => onSelect(e.target.checked ? [...selected, record.id] : [...selected].filter(id => id !== record.id))} />}</td>
            <td className="tables-row-number"><span>{(page.pagina - 1) * page.tamanho + index + 1}</span><button type="button" tabIndex={-1} aria-label={`Abrir ${recordTitle(record, bundle.campos, bundle.tabela.campo_principal_id)}`} onClick={() => onOpen(record)}><Expand size={13} /></button></td>
            {fields.map((field, c) => {
              const isEditing = editing?.record === record.id && editing.field === field.id
              return <td key={field.id} className={`${isEditing ? 'is-editing' : ''} ${row === index && col === c ? 'is-active' : ''}`}>
                <button type="button" className="tables-cell" data-cell={`${index}:${c}`} tabIndex={row === index && col === c ? 0 : -1} aria-label={`${field.nome}: ${String(record.valores[field.id] ?? 'vazio')}`} onFocus={() => setActive({ row: index, col: c })} onKeyDown={e => onCellKeyDown(e, index, c, record, field)} onClick={() => { setActive({ row: index, col: c }); activate(record, field) }}><CellValueView field={field} value={record.valores[field.id]} members={bundle.usuarios} /></button>
                {isEditing && <CellEditor key={record.id + ':' + field.id} api={api} field={field} initial={editing.draft !== undefined ? editing.draft : record.valores[field.id] ?? null} bundle={bundle} onClose={() => closeEditor(index, c)} onSave={value => {
                  closeEditor(index, c)
                  void onSave(record, field, value).then(ok => { if (!ok) setEditing({ record: record.id, field: field.id, draft: value }) })
                }} />}
              </td>
            })}<td /></tr></Fragment>
      })}
      {editable && <tr className="tables-add-row"><td colSpan={fields.length + 3}><button type="button" disabled={busy} onClick={onCreate}><Plus size={16} />Adicionar registro</button></td></tr>}
      {!rows.length && <tr><td colSpan={fields.length + 3}><div className="tables-no-records"><strong>Nenhum registro por aqui</strong><span>Adicione seu primeiro registro ou ajuste os filtros.</span>{editable && <button className="tables-button-primary" onClick={onCreate}><Plus size={15} />Novo registro</button>}</div></td></tr>}
      <tr className="tables-grid-space" aria-hidden="true"><td /><td />{fields.map(f => <td key={f.id} />)}<td /></tr>
    </tbody>
    <tfoot><tr><td /><td />{fields.map(field => <td key={field.id}>{page.somas[field.id] !== undefined && <span className="tables-sum"><small>Soma</small><CellValueView field={field} value={page.somas[field.id]} members={bundle.usuarios} /></span>}</td>)}<td /></tr></tfoot>
  </table>
  {rows.length > 0 && <p className="tables-grid-hint">Use as setas para navegar, Enter para editar, comece a digitar para substituir e Delete para limpar.</p>}
  </div>
}

function CellEditor({ field, initial, bundle, api, onClose, onSave }: { field: Field; initial: CellValue; bundle: TableBundle; api: TablesApi; onClose: () => void; onSave: (value: CellValue) => void }) {
  const [value, setValue] = useState<CellValue>(initial)
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    // Typing on a cell starts the editor with that character: keep the caret after it.
    const input = formRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input:not([type=checkbox]),textarea')
    try { if (input && typeof input.value === 'string') input.setSelectionRange(input.value.length, input.value.length) } catch { /* number and email inputs have no selection API */ }
  }, [])
  return <form ref={formRef} className="tables-cell-editor" onSubmit={e => { e.preventDefault(); onSave(value) }} onKeyDown={e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose() }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onSave(value) }
  }}><FieldControl autoFocus field={field} value={value} onChange={setValue} api={api} members={bundle.usuarios} /><div><button type="button" aria-label="Cancelar edição" onClick={onClose}><X size={14} /></button><button className="tables-button-primary" type="submit" aria-label="Salvar célula"><Check size={14} /></button></div></form>
}

export function KanbanView({ bundle, page, view, editable, busy, onOpen, onMove, onCreate, onConfigure }: { bundle: TableBundle; page: RecordPage; view: View; editable: boolean; busy: boolean; onOpen: (r: DataRecord) => void; onMove: (r: DataRecord, f: Field, v: CellValue) => void; onCreate: (values: Values) => void; onConfigure: () => void }) {
  const field = bundle.campos.find(f => f.id === view.configuracao.agrupamento && f.tipo === 'selecao')
  if (!field) return <div className="tables-empty-view"><strong>Escolha como organizar os cartões</strong><p>O Kanban precisa de um campo de seleção única.</p>{editable && <button onClick={onConfigure}>Configurar visualização</button>}</div>
  const groupOf = (record: DataRecord) => (record.valores[field.id] as string[] | undefined)?.[0] ?? ''
  const groups = [{ id: '', nome: 'Sem status', cor: '#94a3b8' }, ...field.opcoes.filter(o => !o.arquivado || page.registros.some(r => groupOf(r) === o.id))]
  const move = (record: DataRecord, groupId: string) => { if (groupId !== groupOf(record)) onMove(record, field, groupId ? [groupId] : []) }
  return <div className="tables-kanban">{groups.map(group => {
    const rows = page.registros.filter(r => groupOf(r) === group.id)
    return <section className="tables-kanban-column" key={group.id} onDragOver={e => { if (editable && !busy) e.preventDefault() }} onDrop={e => { e.preventDefault(); if (!editable || busy) return; const record = page.registros.find(r => r.id === e.dataTransfer.getData('text/plain')); if (record) move(record, group.id) }}>
      <header><span className="tables-dot" style={{ background: group.cor }} /><strong>{group.nome}</strong><span>{rows.length}</span>{editable && <button aria-label={`Adicionar em ${group.nome}`} onClick={() => onCreate({ [field.id]: group.id ? [group.id] : [] })}><Plus size={15} /></button>}</header>
      <div className="tables-kanban-cards">
        {rows.map(record => <div key={record.id} className="tables-kanban-card" draggable={editable && !busy} onDragStart={e => e.dataTransfer.setData('text/plain', record.id)}>
          <RecordCard record={record} bundle={bundle} onOpen={() => onOpen(record)} />
          {editable && <select className="tables-card-move" aria-label={`Mover ${recordTitle(record, bundle.campos, bundle.tabela.campo_principal_id)} para`} value="" disabled={busy} onChange={e => move(record, e.target.value.slice(1))}><option value="" disabled hidden>Mover para…</option>{groups.filter(g => g.id !== group.id).map(g => <option key={g.id} value={'#' + g.id}>{g.nome}</option>)}</select>}
        </div>)}
        {!rows.length && <p className="tables-muted">{editable ? 'Arraste um cartão para cá ou use “Mover para”.' : 'Nenhum cartão.'}</p>}
      </div>
      {editable && <button className="tables-add-card" onClick={() => onCreate({ [field.id]: group.id ? [group.id] : [] })}><Plus size={14} />Novo registro</button>}
    </section>
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
