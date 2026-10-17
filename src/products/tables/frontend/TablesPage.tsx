'use client'

import { useAuth } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChartGantt, KeyRound, Zap, Check, ChevronDown, ClipboardList, Download, LayoutGrid, Upload, ChevronLeft, ChevronRight, Columns3, Database, EyeOff, Filter as FilterIcon, Layers, LoaderCircle, MoreHorizontal, Plus, Search, SlidersHorizontal, Table2, Trash2, Users, X } from 'lucide-react'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { type Base, type CellValue, type DataRecord, type DataTable, type Field, type Filter, type RecordDetail, type RecordPage, type SessionInfo, type TableBundle, type Values, type View } from '../shared/contracts'
import { changedBases, send, TablesClientError, useResource, useTablesApi, useTablesDownload, type TablesApi } from './client'
import { BaseDialog, FieldDialog, NameDialog, RecordDialog, TrashDialog, ViewDialog, type PersonalQuery, type ViewMode } from './dialogs'
import { CalendarView, DataGrid, KanbanView } from './views'
import { FormView, GalleryView, TimelineView } from './moreViews'
import { SharingDialog } from './SharingDialog'
import { CsvImportDialog } from './CsvImportDialog'
import { AutomationsDialog } from './AutomationsDialog'
import { ApiKeysDialog } from './ApiKeysDialog'
import './tables.css'

/** Cell edits shown before the server answers, per table. Pending entries win over reloaded pages. */
type LocalEdits = { table: string; records: Record<string, { record: DataRecord; pending: number }> }
type LocalEntry = LocalEdits['records'][string]
function changeLocal(state: LocalEdits, table: string, id: string, change: (entry?: LocalEntry) => LocalEntry | undefined): LocalEdits {
  const records = state.table === table ? { ...state.records } : {}
  const next = change(records[id])
  if (next) records[id] = next; else delete records[id]
  return { table, records }
}

type OpenDialog = { type: 'base'; base?: Base } | { type: 'table'; table?: DataTable } | { type: 'field'; field?: Field } | { type: 'view'; view?: View; mode: ViewMode } | { type: 'record'; record?: DataRecord; values?: Values } | { type: 'trash' } | { type: 'members' } | { type: 'import' } | { type: 'automations' } | { type: 'api' } | null

export default function TablesPage() {
  const auth = useAuth(), api = useTablesApi()
  const identity = JSON.stringify([auth.userId, auth.orgId, auth.sessionId])
  return <SidebarProvider><SidebarShadcn /><SidebarInset className="h-svh overflow-hidden"><TablesWorkspace key={identity} api={api} /></SidebarInset></SidebarProvider>
}

export function TablesWorkspace({ api }: { api: TablesApi }) {
  const router = useRouter(), params = useParams<{ path?: string[] }>()
  const path = params.path ?? []
  const [revision, setRevision] = useState(0), [modal, setModal] = useState<OpenDialog>(null), [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null)
  const [viewChoice, setViewChoice] = useState<{ table: string; id: string } | null>(null), [searchDraft, setSearchDraft] = useState(''), [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ table: '', page: 1 }), [selection, setSelection] = useState<{ table: string; ids: string[] }>({ table: '', ids: [] })
  const [month, setMonth] = useState(() => new Date()), [saved, setSaved] = useState<Date | null>(null)
  const [recordsRevision, setRecordsRevision] = useState(0), [local, setLocal] = useState<LocalEdits>({ table: '', records: {} })
  const [personal, setPersonal] = useState<(PersonalQuery & { view: string }) | null>(null)
  const saveQueue = useRef(new Map<string, Promise<unknown>>()), knownVersions = useRef(new Map<string, number>())
  const session = useResource<SessionInfo>(api, '/sessao', revision)
  const baseId = path[0] === 'nova' ? undefined : path[0] ?? session.data?.bases[0]?.id
  const baseResource = useResource<{ base: Base; tabelas: DataTable[] }>(api, baseId ? `/bases/${baseId}` : null, revision)
  const base = baseResource.data?.base
  const tableId = path[1] ?? baseResource.data?.tabelas[0]?.id
  const bundleResource = useResource<TableBundle>(api, tableId ? `/tabelas/${tableId}` : null, revision)
  const bundle = bundleResource.data?.tabela.base_id === baseId ? bundleResource.data : undefined
  const view = bundle?.visualizacoes.find(v => viewChoice?.table === tableId && v.id === viewChoice.id) ?? bundle?.visualizacoes[0]
  const pageNumber = pagination.table === tableId ? pagination.page : 1
  const selected = new Set(selection.table === tableId ? selection.ids : [])
  const filters = useMemo<Filter[]>(() => {
    if (!bundle || !view || !['calendario', 'linha_do_tempo'].includes(view.tipo) || !view.configuracao.campo_data) return []
    const field = bundle.campos.find(f => f.id === view.configuracao.campo_data)
    if (!field) return []
    const first = new Date(month.getFullYear(), month.getMonth(), 1), next = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    const date = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const before = { campo: field.id, operador: 'lt' as const, valor: field.tipo === 'data_hora' ? next.toISOString() : date(next) }
    return view.tipo === 'linha_do_tempo' ? [before] : [{ campo: field.id, operador: 'gte', valor: field.tipo === 'data_hora' ? first.toISOString() : date(first) }, before]
  }, [bundle, view, month])
  // A personal query replaces the saved filters and sorting of this view without changing it for the team.
  const personalQuery = personal && view && personal.view === view.id ? personal : null
  const query = new URLSearchParams({ pagina: String(pageNumber), tamanho: view?.tipo === 'grade' ? '50' : '100', busca: search })
  if (view && !personalQuery) query.set('visualizacao', view.id)
  const allFilters = [...filters, ...(personalQuery?.filtros ?? [])]
  if (allFilters.length) query.set('filtros', JSON.stringify(allFilters))
  if (personalQuery?.combinacao === 'ou') query.set('combinacao', 'ou')
  if (personalQuery && view) {
    const group = view.configuracao.agrupamento
    const order = group ? [{ campo: group, direcao: 'asc' as const }, ...personalQuery.ordenacao.filter(s => s.campo !== group)] : personalQuery.ordenacao
    if (order.length) query.set('ordenacao', JSON.stringify(order))
  }
  // Export follows what is on screen: view or personal query, filters and search, without pagination.
  const exportQuery = new URLSearchParams(query); exportQuery.delete('pagina'); exportQuery.delete('tamanho')
  const download = useTablesDownload()
  const records = useResource<RecordPage>(api, bundle && view ? `/tabelas/${bundle.tabela.id}/registros?${query}` : null, revision + recordsRevision)
  const localRecords = local.table === tableId ? local.records : undefined
  const page = useMemo<RecordPage | undefined>(() => records.data && { ...records.data, registros: records.data.registros.map(r => { const edit = localRecords?.[r.id]; return edit && (edit.pending > 0 || edit.record.versao > r.versao) ? edit.record : r }) }, [records.data, localRecords])
  const pending = new Set(Object.entries(localRecords ?? {}).filter(([, e]) => e.pending > 0).map(([id]) => id))
  // Role in the open base: editors change records and views, administrators also the structure.
  const canCreateBase = session.data?.podeEditar ?? false, papel = base?.papel ?? null
  const canEdit = papel === 'editor' || papel === 'administrador', canStructure = papel === 'administrador'
  const loading = session.loading || baseResource.loading || bundleResource.loading || records.loading && !records.data
  const visibleError = error ?? session.error ?? baseResource.error ?? bundleResource.error ?? records.error
  const visibleModal: OpenDialog = modal ?? (path[0] === 'nova' ? { type: 'base' } : null)
  const close = () => { if (busy) return; setModal(null); setError(null); if (path[0] === 'nova') router.push('/tables') }
  const open = (dialog: OpenDialog) => { setError(null); setModal(dialog) }
  const refresh = () => { setRevision(v => v + 1); changedBases() }
  const navigate = (id: string, table?: string) => { setModal(null); setError(null); setSelection({ table: '', ids: [] }); router.push(`/tables/${id}${table ? '/' + table : ''}`) }
  useEffect(() => { const timer = setTimeout(() => setSearch(searchDraft), 250); return () => clearTimeout(timer) }, [searchDraft])
  // Changes made by other people appear on their own: every few seconds the screen asks for a cheap
  // signature of the table and reloads only when it changed, never in the middle of your own edit.
  const quiet = useRef(false), lastState = useRef('')
  quiet.current = busy || pending.size > 0 || modal !== null
  const watchedTable = bundle?.tabela.id, watchedStructure = bundle?.tabela.versao_estrutura
  useEffect(() => {
    if (!watchedTable) return
    let stopped = false
    lastState.current = ''
    const tick = async () => {
      if (stopped || document.hidden || quiet.current) return
      try {
        const state = await api<{ versao_estrutura: number; alterado_em: string | null; total: number }>(`/tabelas/${watchedTable}/estado`)
        const key = JSON.stringify(state)
        if (!stopped && lastState.current && lastState.current !== key) { if (state.versao_estrutura !== watchedStructure) setRevision(v => v + 1); else setRecordsRevision(v => v + 1) }
        lastState.current = key
      } catch { /* the next tick tries again */ }
    }
    void tick()
    const timer = setInterval(() => void tick(), 8000)
    return () => { stopped = true; clearInterval(timer) }
  }, [api, watchedTable, watchedStructure])

  async function act(invoke: () => Promise<unknown>, closeAfter = true) {
    if (busy) return false
    setBusy(true); setError(null)
    try { await invoke(); setSaved(new Date()); if (closeAfter) setModal(null); refresh(); return true }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.'); if (e instanceof TablesClientError && e.code === 'VERSION_CONFLICT') refresh(); return false }
    finally { setBusy(false) }
  }

  /** Shows the new value at once, saves in the background and reloads only the records (totals, filters). */
  function saveCell(record: DataRecord, field: Field, value: CellValue): Promise<boolean> {
    if (!bundle) return Promise.resolve(false)
    const table = bundle.tabela.id, structure = bundle.tabela.versao_estrutura
    setError(null)
    setLocal(s => changeLocal(s, table, record.id, entry => { const base = entry?.record ?? record; return { record: { ...base, valores: { ...base.valores, [field.id]: value } }, pending: (entry?.pending ?? 0) + 1 } }))
    // Edits to the same record run in order, each one with the version returned by the previous save.
    const run = async () => {
      try {
        const expectedVersion = Math.max(record.versao, knownVersions.current.get(record.id) ?? 0)
        const { registro } = await api<{ registro: DataRecord }>(`/registros/${record.id}`, send('PATCH', { valores: { [field.id]: value }, expectedVersion, expectedStructureVersion: structure }))
        knownVersions.current.set(record.id, registro.versao)
        setLocal(s => changeLocal(s, table, record.id, entry => entry && entry.pending > 1 ? { record: { ...entry.record, versao: registro.versao }, pending: entry.pending - 1 } : { record: registro, pending: 0 }))
        setSaved(new Date()); setRecordsRevision(v => v + 1)
        return true
      } catch (e) {
        setLocal(s => changeLocal(s, table, record.id, () => undefined))
        setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
        if (e instanceof TablesClientError && e.code === 'VERSION_CONFLICT') refresh(); else setRecordsRevision(v => v + 1)
        return false
      }
    }
    const result = (saveQueue.current.get(record.id) ?? Promise.resolve()).then(run)
    saveQueue.current.set(record.id, result)
    return result
  }
  const applyPersonal = (next: PersonalQuery) => { if (!view) return; setPersonal({ view: view.id, ...next }); setPage(1); setModal(null) }
  const currentDialog = { busy, error, onClose: close }
  const setPage = (page: number) => setPagination({ table: tableId ?? '', page })
  const openRecord = (record: DataRecord) => open({ type: 'record', record })
  const createRecord = (values: Values = {}) => open({ type: 'record', values })

  return <main className="tables-app">
    <div className="tables-breadcrumb"><SidebarTrigger /><span>Tables</span>{base && <><span>/</span><strong>{base.nome}</strong></>}<div className="tables-sync" role="status">{busy || pending.size ? <><LoaderCircle className="tables-spin" size={14} />Salvando…</> : loading ? <><LoaderCircle className="tables-spin" size={14} />Carregando…</> : saved ? <><Check size={14} />Salvo às {saved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</> : null}</div>{canCreateBase && <button className="tables-icon-button" aria-label="API e chaves de acesso" title="API e chaves de acesso" onClick={() => open({ type: 'api' })}><KeyRound size={16} /></button>}<button className="tables-icon-button" aria-label="Abrir lixeira" onClick={() => open({ type: 'trash' })}><Trash2 size={16} /></button></div>
    {visibleError && <div className="tables-error-banner" role="alert"><span>{visibleError}</span><button onClick={() => { setError(null); refresh() }}>Tentar novamente</button><button aria-label="Fechar mensagem" onClick={() => setError(null)}><X size={14} /></button></div>}
    {base ? <>
      <header className="tables-base-header"><div className="tables-base-icon" style={{ color: base.cor, background: base.cor + '18' }}><Database size={28} strokeWidth={1.6} /></div><div className="tables-base-heading"><button disabled={!canStructure} className="tables-title-button" onClick={() => open({ type: 'base', base })}><h1>{base.nome}</h1><ChevronDown size={17} /></button><p>{base.descricao || 'Organize informações, pessoas e entregas em um só lugar.'}</p></div><div className="tables-base-actions"><span className="tables-user-avatar" title={session.data?.usuario}>{session.data?.usuario.split(' ').slice(0, 2).map(n => n[0]).join('')}</span><button className="tables-button-primary" onClick={() => open({ type: 'members' })}><Users size={15} />{canStructure ? 'Compartilhar' : 'Acesso'}</button></div></header>
      <nav className="tables-table-tabs" aria-label="Tabelas da base">{baseResource.data?.tabelas.map(t => <button key={t.id} className={t.id === tableId ? 'is-active' : ''} onClick={() => navigate(base.id, t.id)}>{t.nome}</button>)}{canStructure && <button aria-label="Criar tabela" onClick={() => open({ type: 'table' })}><Plus size={18} /></button>}{bundle && canStructure && <button className="tables-table-settings" aria-label="Editar tabela" onClick={() => open({ type: 'table', table: bundle.tabela })}><MoreHorizontal size={18} /></button>}</nav>
      {bundle && view ? <>
        <div className="tables-view-tabs" role="tablist" aria-label="Visualizações">{bundle.visualizacoes.map(v => { const Icon = v.tipo === 'kanban' ? Columns3 : v.tipo === 'calendario' ? CalendarDays : v.tipo === 'galeria' ? LayoutGrid : v.tipo === 'formulario' ? ClipboardList : v.tipo === 'linha_do_tempo' ? ChartGantt : Table2; return <button key={v.id} type="button" role="tab" aria-selected={v.id === view.id} className={v.id === view.id ? 'is-active' : ''} onClick={() => { setViewChoice({ table: bundle.tabela.id, id: v.id }); setPage(1); setSelection({ table: '', ids: [] }) }} onDoubleClick={() => { if (canEdit) open({ type: 'view', view: v, mode: 'view' }) }}><Icon size={15} />{v.nome}</button> })}{canEdit && <button onClick={() => open({ type: 'view', mode: 'view' })}><Plus size={15} />Visualização</button>}<span>{records.data?.total ?? '…'} registros</span></div>
        <div className="tables-toolbar">{selected.size ? <><strong>{selected.size} selecionados</strong>{canEdit && <button className="tables-danger" disabled={busy} onClick={() => void act(async () => { const items = page!.registros.filter(r => selected.has(r.id)).map(r => ({ id: r.id, expectedVersion: r.versao })); await api(`/tabelas/${bundle.tabela.id}/remover-registros`, send('POST', { registros: items, expectedStructureVersion: bundle.tabela.versao_estrutura })); setSelection({ table: '', ids: [] }) }, false)}><Trash2 size={14} />Mover para lixeira</button>}<button onClick={() => setSelection({ table: '', ids: [] })}>Limpar seleção</button></> : <>
          <button disabled={!canEdit} onClick={() => open({ type: 'view', view, mode: 'fields' })}><EyeOff size={15} /><span>Ocultar campos</span></button>
          <button className={(personalQuery ?? view.configuracao).filtros.length ? 'has-config' : ''} onClick={() => open({ type: 'view', view, mode: 'filters' })}><FilterIcon size={15} />Filtrar{(personalQuery ?? view.configuracao).filtros.length > 0 && <em>{(personalQuery ?? view.configuracao).filtros.length}</em>}</button>
          <button disabled={!canEdit || view.tipo === 'calendario'} onClick={() => open({ type: 'view', view, mode: 'group' })}><Layers size={15} />Agrupar</button>
          <button className={(personalQuery ?? view.configuracao).ordenacao.length ? 'has-config' : ''} onClick={() => open({ type: 'view', view, mode: 'sort' })}><SlidersHorizontal size={15} />Ordenar</button>
          <button disabled={busy} onClick={() => void act(async () => { if (!bundle) return; const count = await download(`/tabelas/${bundle.tabela.id}/exportar?${exportQuery}`, `${bundle.tabela.nome}.csv`); setSaved(null); if (!count) throw new Error('Não há registros para exportar com esses filtros.') }, false)}><Download size={15} />Exportar</button>
          {canEdit && <button disabled={busy} onClick={() => open({ type: 'import' })}><Upload size={15} />Importar</button>}
          {canStructure && <button onClick={() => open({ type: 'automations' })}><Zap size={15} />Automações</button>}
          {personalQuery && <span className="tables-personal-chip">Só para você<button aria-label="Voltar aos filtros da visualização" onClick={() => { setPersonal(null); setPage(1) }}><X size={13} /></button></span>}
          {canEdit && <button className="tables-icon-button" aria-label="Configurar visualização" onClick={() => open({ type: 'view', view, mode: 'view' })}><MoreHorizontal size={16} /></button>}
        </>}<div className="tables-toolbar-end"><label className="tables-search"><Search size={15} /><input aria-label="Buscar registros" placeholder="Buscar registros…" value={searchDraft} onChange={e => { setSearchDraft(e.target.value); setPage(1) }} />{searchDraft && <button aria-label="Limpar busca" onClick={() => setSearchDraft('')}><X size={13} /></button>}</label>{canEdit && <button className="tables-button-primary" disabled={busy} onClick={() => createRecord()}><Plus size={16} />Novo registro</button>}</div></div>
        <section className="tables-data-area" aria-label={view.nome} aria-busy={records.loading}>
          {page ? view.tipo === 'grade' ? <DataGrid bundle={bundle} page={page} view={view} api={api} editable={canEdit} structure={canStructure} busy={busy} pending={pending} onEditField={field => open({ type: 'field', field })} onCreateField={() => open({ type: 'field' })} onOpen={openRecord} onCreate={() => createRecord()} onSave={saveCell} selected={selected} onSelect={ids => setSelection({ table: bundle.tabela.id, ids })} /> : view.tipo === 'kanban' ? <KanbanView bundle={bundle} page={page} view={view} editable={canEdit} busy={busy} onOpen={openRecord} onMove={(r, f, v) => { void saveCell(r, f, v) }} onCreate={createRecord} onConfigure={() => open({ type: 'view', view, mode: 'view' })} /> : view.tipo === 'calendario' ? <CalendarView bundle={bundle} page={page} view={view} editable={canEdit} month={month} onMonth={date => { setMonth(date); setPage(1) }} onOpen={openRecord} onCreate={createRecord} onConfigure={() => open({ type: 'view', view, mode: 'view' })} /> : view.tipo === 'galeria' ? <GalleryView bundle={bundle} page={page} view={view} onOpen={openRecord} /> : view.tipo === 'formulario' ? <FormView bundle={bundle} view={view} api={api} editable={canEdit} onCreated={() => { setSaved(new Date()); setRecordsRevision(v => v + 1) }} /> : <TimelineView bundle={bundle} page={page} view={view} editable={canEdit} month={month} onMonth={date => { setMonth(date); setPage(1) }} onOpen={openRecord} onConfigure={() => open({ type: 'view', view, mode: 'view' })} /> : <div className="tables-loading" role="status"><LoaderCircle className="tables-spin" size={20} />{records.error ? 'Não foi possível carregar os registros.' : 'Carregando registros…'}</div>}
        </section>
        <footer className="tables-pagination"><span>{records.data?.total ?? 0} registros{selected.size ? ` · ${selected.size} selecionados` : ''}</span>{!canEdit && <span>Somente leitura</span>}{canEdit && !canStructure && <span>Editor: a estrutura é do administrador da base</span>}<div><span>Página {pageNumber} de {Math.max(1, Math.ceil((records.data?.total ?? 0) / (records.data?.tamanho ?? 50)))}</span><button aria-label="Página anterior" disabled={pageNumber <= 1 || loading} onClick={() => setPage(pageNumber - 1)}><ChevronLeft size={16} /></button><button aria-label="Próxima página" disabled={loading || pageNumber * (records.data?.tamanho ?? 50) >= (records.data?.total ?? 0)} onClick={() => setPage(pageNumber + 1)}><ChevronRight size={16} /></button></div></footer>
      </> : loading ? <div className="tables-loading" role="status"><LoaderCircle size={22} className="tables-spin" />Carregando tabela…</div> : <div className="tables-empty-view"><Table2 size={32} /><strong>Esta base ainda não tem tabelas</strong>{canStructure && <button className="tables-button-primary" onClick={() => open({ type: 'table' })}><Plus size={15} />Criar tabela</button>}</div>}
    </> : session.loading || baseResource.loading ? <div className="tables-loading" role="status"><LoaderCircle size={24} className="tables-spin" />Carregando Tables…</div> : <div className="tables-welcome"><div className="tables-welcome-icon"><Database size={34} strokeWidth={1.5} /></div><span className="tables-eyebrow">TABLES</span><h1>Seu trabalho, organizado do seu jeito.</h1><p>Crie bases e tabelas para acompanhar projetos, contatos e tudo o que sua equipe precisa.</p>{canCreateBase && <button className="tables-button-primary" onClick={() => open({ type: 'base' })}><Plus size={17} />Criar minha primeira base</button>}<span className="tables-muted">Campos personalizados · Grade · Kanban · Calendário</span></div>}
    {visibleModal?.type === 'base' && <BaseDialog {...currentDialog} base={visibleModal.base} onSave={input => void act(async () => { if (visibleModal.base) await api(`/bases/${visibleModal.base.id}`, send('PATCH', input)); else { const created = await api<{ base: Base; tabela: DataTable }>('/bases', send('POST', input)); navigate(created.base.id, created.tabela.id) } })} onDelete={visibleModal.base ? () => void act(async () => { await api(`/bases/${visibleModal.base!.id}`, send('DELETE', { expectedVersion: visibleModal.base!.versao })); router.push('/tables') }) : undefined} />}
    {visibleModal?.type === 'table' && base && <NameDialog {...currentDialog} title={visibleModal.table ? 'Editar tabela' : 'Criar tabela'} initial={visibleModal.table?.nome} onSave={name => void act(async () => { if (visibleModal.table) await api(`/tabelas/${visibleModal.table.id}`, send('PATCH', { nome: name, expectedStructureVersion: visibleModal.table.versao_estrutura })); else { const created = await api<{ tabela: DataTable }>(`/bases/${base.id}/tabelas`, send('POST', { nome: name })); navigate(base.id, created.tabela.id) } })} onDelete={visibleModal.table ? () => void act(async () => { await api(`/tabelas/${visibleModal.table!.id}`, send('DELETE', { expectedVersion: visibleModal.table!.versao_estrutura })); navigate(base.id) }) : undefined} />}
    {visibleModal?.type === 'field' && bundle && <FieldDialog {...currentDialog} api={api} field={visibleModal.field} bundle={bundle} onSave={input => void act(() => api(`/tabelas/${bundle.tabela.id}/campos${visibleModal.field ? '/' + visibleModal.field.id : ''}`, send(visibleModal.field ? 'PATCH' : 'POST', input)))} onDelete={visibleModal.field ? () => void act(() => api(`/tabelas/${bundle.tabela.id}/campos/${visibleModal.field!.id}`, send('DELETE', { expectedVersion: bundle.tabela.versao_estrutura }))) : undefined} />}
    {visibleModal?.type === 'view' && bundle && <ViewDialog {...currentDialog} api={api} mode={visibleModal.mode} view={visibleModal.view} bundle={bundle} canSave={canEdit} personal={visibleModal.view && personal?.view === visibleModal.view.id ? personal : null} onApplyPersonal={applyPersonal} onSave={input => void act(async () => { const result = await api<{ visualizacao: View }>(`/tabelas/${bundle.tabela.id}/visualizacoes${visibleModal.view ? '/' + visibleModal.view.id : ''}`, send(visibleModal.view ? 'PATCH' : 'POST', input)); if (personal?.view === result.visualizacao.id) setPersonal(null); setViewChoice({ table: bundle.tabela.id, id: result.visualizacao.id }); setPage(1) })} onDelete={visibleModal.view ? () => void act(() => api(`/tabelas/${bundle.tabela.id}/visualizacoes/${visibleModal.view!.id}`, send('DELETE', { expectedVersion: visibleModal.view!.versao }))) : undefined} />}
    {visibleModal?.type === 'record' && bundle && <RecordDialog key={visibleModal.record?.id ?? 'new'} {...currentDialog} readOnly={!canEdit} initialValues={visibleModal.values} record={visibleModal.record} bundle={bundle} api={api} onSave={values => void act(() => api(visibleModal.record ? `/registros/${visibleModal.record.id}` : `/tabelas/${bundle.tabela.id}/registros`, send(visibleModal.record ? 'PATCH' : 'POST', { valores: values, expectedStructureVersion: bundle.tabela.versao_estrutura, ...(visibleModal.record ? { expectedVersion: visibleModal.record.versao } : {}) })))} onDelete={visibleModal.record && canEdit ? () => void act(() => api(`/registros/${visibleModal.record!.id}`, send('DELETE', { expectedVersion: visibleModal.record!.versao }))) : undefined} onRefresh={async () => { if (visibleModal.record) { const data = await api<RecordDetail>(`/registros/${visibleModal.record.id}`); setModal({ type: 'record', record: data.registro }); refresh() } }} />}
    {visibleModal?.type === 'trash' && <TrashDialog key={revision} {...currentDialog} api={api} onRestore={(type, id) => void act(() => api(`/lixeira/${type}/${id}`, send('POST')), false)} />}
    {visibleModal?.type === 'api' && <ApiKeysDialog api={api} onClose={close} />}
    {visibleModal?.type === 'automations' && bundle && <AutomationsDialog api={api} bundle={bundle} onClose={close} />}
    {visibleModal?.type === 'import' && bundle && <CsvImportDialog api={api} bundle={bundle} onClose={close} onDone={() => setRecordsRevision(v => v + 1)} />}
    {visibleModal?.type === 'members' && base && <SharingDialog api={api} baseId={base.id} onClose={close} onSaved={refresh} />}
  </main>
}
