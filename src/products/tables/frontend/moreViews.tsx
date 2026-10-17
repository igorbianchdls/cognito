'use client'
import { useState } from 'react'
import { ChartGantt, ChevronLeft, ChevronRight, ClipboardList, LayoutGrid } from 'lucide-react'
import { isComputed, recordTitle, type DataRecord, type Field, type RecordPage, type TableBundle, type Values, type View } from '../shared/contracts'
import { send, type TablesApi } from './client'
import { CellValueView, FieldControl, FieldIcon } from './FieldControl'

/** Fields shown by a view, in its column order, without the hidden ones. */
function shown(bundle: TableBundle, view: View) {
  const order = new Map(view.campos.map(c => [c.campo_id, c]))
  return bundle.campos.filter(f => order.get(f.id)?.visivel ?? true).sort((a, b) => (order.get(a.id)?.posicao ?? 0) - (order.get(b.id)?.posicao ?? 0))
}

export function GalleryView({ bundle, page, view, onOpen }: { bundle: TableBundle; page: RecordPage; view: View; onOpen: (r: DataRecord) => void }) {
  const fields = shown(bundle, view).filter(f => f.id !== bundle.tabela.campo_principal_id && f.tipo !== 'anexo').slice(0, 6)
  if (!page.registros.length) return <div className="tables-empty-view"><LayoutGrid size={30} /><strong>Nenhum registro</strong><p>Os registros aparecem aqui como cartões.</p></div>
  const filled = (record: DataRecord, f: Field) => { const v = record.valores[f.id]; return v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length) }
  // Cards are articles, not buttons: they grow with their content and still open with click or Enter.
  return <div className="tables-gallery">{page.registros.map(record => <article key={record.id} role="button" tabIndex={0} className="tables-gallery-card" onClick={() => onOpen(record)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(record) } }}>
    <strong>{recordTitle(record, bundle.campos, bundle.tabela.campo_principal_id)}</strong>
    <dl>{fields.filter(f => filled(record, f)).map(f => <div key={f.id}><dt><FieldIcon type={f.tipo} />{f.nome}</dt><dd><CellValueView field={f} value={record.valores[f.id]} members={bundle.usuarios} /></dd></div>)}</dl>
  </article>)}</div>
}

/** A form that adds records with the fields chosen for the view. */
export function FormView({ bundle, view, api, editable, onCreated }: { bundle: TableBundle; view: View; api: TablesApi; editable: boolean; onCreated: () => void }) {
  const fields = shown(bundle, view).filter(f => f.tipo !== 'anexo' && !isComputed(f.tipo))
  const [values, setValues] = useState<Values>({}), [busy, setBusy] = useState(false), [error, setError] = useState(''), [sent, setSent] = useState(false)
  if (!editable) return <div className="tables-empty-view"><ClipboardList size={30} /><strong>Formulário</strong><p>Seu papel nesta base permite apenas consultar.</p></div>
  async function submit() {
    setBusy(true); setError('')
    try { await api(`/tabelas/${bundle.tabela.id}/registros`, send('POST', { valores: values, expectedStructureVersion: bundle.tabela.versao_estrutura })); setSent(true); setValues({}); onCreated() }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível enviar.') }
    finally { setBusy(false) }
  }
  return <div className="tables-form-view"><form onSubmit={e => { e.preventDefault(); void submit() }}>
    <h2>{view.nome}</h2><p className="tables-muted">Novo registro em {bundle.tabela.nome}.</p>
    {sent ? <div className="tables-form-sent" role="status"><strong>{view.configuracao.mensagem || 'Registro enviado.'}</strong><button type="button" className="tables-button-primary" onClick={() => setSent(false)}>Enviar outro</button></div> : <>
      {fields.map(f => <label key={f.id}><span>{f.nome}{f.obrigatorio ? ' *' : ''}</span><FieldControl field={f} value={values[f.id]} members={bundle.usuarios} api={api} disabled={busy} onChange={v => setValues(x => ({ ...x, [f.id]: v }))} /></label>)}
      {error && <p className="tables-error" role="alert">{error}</p>}
      <div className="tables-dialog-footer"><button type="submit" className="tables-button-primary" disabled={busy}>{busy ? 'Enviando…' : 'Enviar'}</button></div>
    </>}
  </form></div>
}

const monthTitle = (d: Date) => { const t = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return t[0].toUpperCase() + t.slice(1) }
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dateOf = (field: Field, value: unknown) => !value ? null : field.tipo === 'data_hora' ? dayKey(new Date(String(value))) : String(value)

/** Bars between the start and end dates of each record, one month at a time. */
export function TimelineView({ bundle, page, view, month, onMonth, onOpen, editable, onConfigure }: { bundle: TableBundle; page: RecordPage; view: View; month: Date; onMonth: (date: Date) => void; onOpen: (r: DataRecord) => void; editable: boolean; onConfigure: () => void }) {
  const start = bundle.campos.find(f => f.id === view.configuracao.campo_data), end = bundle.campos.find(f => f.id === view.configuracao.campo_fim)
  if (!start) return <div className="tables-empty-view"><ChartGantt size={30} /><strong>Escolha as datas</strong><p>A linha do tempo mostra cada registro entre a data de início e a de fim.</p>{editable && <button onClick={onConfigure}>Configurar visualização</button>}</div>
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(), first = dayKey(new Date(month.getFullYear(), month.getMonth(), 1)), last = dayKey(new Date(month.getFullYear(), month.getMonth(), days))
  const today = dayKey(new Date())
  const rows = page.registros.map(r => { const s = dateOf(start, r.valores[start.id]), e = end ? dateOf(end, r.valores[end.id]) ?? s : s; return { r, s, e: e && s && e < s ? s : e } })
    .filter((x): x is { r: DataRecord; s: string; e: string } => Boolean(x.s && x.e && x.s <= last && x.e >= first))
  const template = `minmax(140px,220px) repeat(${days}, minmax(26px,1fr))`
  const column = (date: string) => date < first ? 1 : date > last ? days : Number(date.slice(8, 10))
  return <div className="tables-timeline">
    <header><h2>{monthTitle(month)}</h2><button aria-label="Mês anterior" onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={16} /></button><button onClick={() => onMonth(new Date())}>Hoje</button><button aria-label="Próximo mês" onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={16} /></button></header>
    <div className="tables-timeline-grid" style={{ gridTemplateColumns: template }}>
      <span className="tables-timeline-corner" />{Array.from({ length: days }, (_, i) => { const date = `${first.slice(0, 8)}${String(i + 1).padStart(2, '0')}`; return <span key={i} className={`tables-timeline-day ${date === today ? 'is-today' : ''}`}>{i + 1}</span> })}
      {rows.map(({ r, s, e }) => <div key={r.id} className="tables-timeline-row" style={{ gridColumn: "1 / -1", gridTemplateColumns: template }}>
        <button type="button" className="tables-timeline-label" onClick={() => onOpen(r)}>{recordTitle(r, bundle.campos, bundle.tabela.campo_principal_id)}</button>
        <button type="button" className="tables-timeline-bar" title={`${s.split('-').reverse().join('/')} – ${e.split('-').reverse().join('/')}`} style={{ gridColumn: `${column(s) + 1} / ${column(e) + 2}` }} onClick={() => onOpen(r)}>{recordTitle(r, bundle.campos, bundle.tabela.campo_principal_id)}</button>
      </div>)}
      {!rows.length && <p className="tables-muted tables-timeline-empty">Nenhum registro neste mês.</p>}
    </div>
  </div>
}
