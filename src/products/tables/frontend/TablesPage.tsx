'use client'

import { useAuth } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Columns3, Database, EyeOff, Filter as FilterIcon, Layers, LoaderCircle, MoreHorizontal, Plus, Search, SlidersHorizontal, Table2, Trash2, Users, X } from 'lucide-react'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TablesError, type Base, type DataRecord, type DataTable, type Field, type Filter, type RecordDetail, type RecordPage, type SessionInfo, type TableBundle, type Values, type View } from '../shared/contracts'
import { changedBases, send, useResource, useTablesApi, type TablesApi } from './client'
import { BaseDialog, FieldDialog, Modal, NameDialog, RecordDialog, TrashDialog, ViewDialog, type ViewMode } from './dialogs'
import { CalendarView, DataGrid, KanbanView } from './views'
import './tables.css'

type OpenDialog = { type: 'base'; base?: Base } | { type: 'table'; table?: DataTable } | { type: 'field'; field?: Field } | { type: 'view'; view?: View; mode: ViewMode } | { type: 'record'; record?: DataRecord; values?: Values } | { type: 'trash' } | { type: 'members' } | null

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
    if (!bundle || view?.tipo !== 'calendario' || !view.configuracao.campo_data) return []
    const field = bundle.campos.find(f => f.id === view.configuracao.campo_data)
    if (!field) return []
    const first = new Date(month.getFullYear(), month.getMonth(), 1), next = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    const date = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    return [{ campo: field.id, operador: 'gte', valor: field.tipo === 'data_hora' ? first.toISOString() : date(first) }, { campo: field.id, operador: 'lt', valor: field.tipo === 'data_hora' ? next.toISOString() : date(next) }]
  }, [bundle, view, month])
  const query = new URLSearchParams({ pagina: String(pageNumber), tamanho: view?.tipo === 'grade' ? '50' : '100', busca: search })
  if (view) query.set('visualizacao', view.id)
  if (filters.length) query.set('filtros', JSON.stringify(filters))
  const records = useResource<RecordPage>(api, bundle && view ? `/tabelas/${bundle.tabela.id}/registros?${query}` : null, revision)
  const canEdit = session.data?.podeEditar ?? false
  const loading = session.loading || baseResource.loading || bundleResource.loading || records.loading
  const visibleError = error ?? session.error ?? baseResource.error ?? bundleResource.error ?? records.error
  const visibleModal: OpenDialog = modal ?? (path[0] === 'nova' ? { type: 'base' } : null)
  const close = () => { if (busy) return; setModal(null); setError(null); if (path[0] === 'nova') router.push('/tables') }
  const open = (dialog: OpenDialog) => { setError(null); setModal(dialog) }
  const refresh = () => { setRevision(v => v + 1); changedBases() }
  const navigate = (id: string, table?: string) => { setModal(null); setError(null); setSelection({ table: '', ids: [] }); router.push(`/tables/${id}${table ? '/' + table : ''}`) }
  useEffect(() => { const timer = setTimeout(() => setSearch(searchDraft), 250); return () => clearTimeout(timer) }, [searchDraft])

  async function act(invoke: () => Promise<unknown>, closeAfter = true) {
    if (busy) return false
    setBusy(true); setError(null)
    try { await invoke(); setSaved(new Date()); if (closeAfter) setModal(null); refresh(); return true }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.'); if (e instanceof TablesError || e && typeof e === 'object' && 'code' in e && e.code === 'VERSION_CONFLICT') refresh(); return false }
    finally { setBusy(false) }
  }

  async function saveCell(record: DataRecord, field: Field, value: Values[string]) {
    return act(() => api(`/registros/${record.id}`, send('PATCH', { valores: { [field.id]: value }, expectedVersion: record.versao, expectedStructureVersion: bundle!.tabela.versao_estrutura })), false)
  }
  const currentDialog = { busy, error, onClose: close }
  const setPage = (page: number) => setPagination({ table: tableId ?? '', page })
  const openRecord = (record: DataRecord) => open({ type: 'record', record })
  const createRecord = (values: Values = {}) => open({ type: 'record', values })

  return <main className="tables-app">
    <div className="tables-breadcrumb"><SidebarTrigger /><span>Tables</span>{base && <><span>/</span><strong>{base.nome}</strong></>}<div className="tables-sync" role="status">{busy ? <><LoaderCircle className="tables-spin" size={14} />Salvando…</> : loading ? <><LoaderCircle className="tables-spin" size={14} />Carregando…</> : saved ? <><Check size={14} />Salvo às {saved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</> : null}</div><button className="tables-icon-button" aria-label="Abrir lixeira" onClick={() => open({ type: 'trash' })}><Trash2 size={16} /></button></div>
    {visibleError && <div className="tables-error-banner" role="alert"><span>{visibleError}</span><button onClick={() => { setError(null); refresh() }}>Tentar novamente</button><button aria-label="Fechar mensagem" onClick={() => setError(null)}><X size={14} /></button></div>}
    {base ? <>
      <header className="tables-base-header"><div className="tables-base-icon" style={{ color: base.cor, background: base.cor + '18' }}><Database size={28} strokeWidth={1.6} /></div><div className="tables-base-heading"><button disabled={!canEdit} className="tables-title-button" onClick={() => open({ type: 'base', base })}><h1>{base.nome}</h1><ChevronDown size={17} /></button><p>{base.descricao || 'Organize informações, pessoas e entregas em um só lugar.'}</p></div><div className="tables-base-actions"><span className="tables-user-avatar" title={session.data?.usuario}>{session.data?.usuario.split(' ').slice(0, 2).map(n => n[0]).join('')}</span><button className="tables-button-primary" onClick={() => open({ type: 'members' })}><Users size={15} />Equipe</button></div></header>
      <nav className="tables-table-tabs" aria-label="Tabelas da base">{baseResource.data?.tabelas.map(t => <button key={t.id} className={t.id === tableId ? 'is-active' : ''} onClick={() => navigate(base.id, t.id)}>{t.nome}</button>)}{canEdit && <button aria-label="Criar tabela" onClick={() => open({ type: 'table' })}><Plus size={18} /></button>}{bundle && canEdit && <button className="tables-table-settings" aria-label="Editar tabela" onClick={() => open({ type: 'table', table: bundle.tabela })}><MoreHorizontal size={18} /></button>}</nav>
      {bundle && view ? <>
        <div className="tables-view-tabs" role="tablist" aria-label="Visualizações">{bundle.visualizacoes.map(v => { const Icon = v.tipo === 'kanban' ? Columns3 : v.tipo === 'calendario' ? CalendarDays : Table2; return <button key={v.id} type="button" role="tab" aria-selected={v.id === view.id} className={v.id === view.id ? 'is-active' : ''} onClick={() => { setViewChoice({ table: bundle.tabela.id, id: v.id }); setPage(1); setSelection({ table: '', ids: [] }) }} onDoubleClick={() => { if (canEdit) open({ type: 'view', view: v, mode: 'view' }) }}><Icon size={15} />{v.nome}</button> })}{canEdit && <button onClick={() => open({ type: 'view', mode: 'view' })}><Plus size={15} />Visualização</button>}<span>{records.data?.total ?? '…'} registros</span></div>
        <div className="tables-toolbar">{selected.size ? <><strong>{selected.size} selecionados</strong>{canEdit && <button className="tables-danger" disabled={busy} onClick={() => void act(async () => { const items = records.data!.registros.filter(r => selected.has(r.id)).map(r => ({ id: r.id, expectedVersion: r.versao })); await api(`/tabelas/${bundle.tabela.id}/remover-registros`, send('POST', { registros: items, expectedStructureVersion: bundle.tabela.versao_estrutura })); setSelection({ table: '', ids: [] }) }, false)}><Trash2 size={14} />Mover para lixeira</button>}<button onClick={() => setSelection({ table: '', ids: [] })}>Limpar seleção</button></> : <>
          <button disabled={!canEdit} onClick={() => open({ type: 'view', view, mode: 'fields' })}><EyeOff size={15} /><span>Ocultar campos</span></button>
          <button className={view.configuracao.filtros.length ? 'has-config' : ''} disabled={!canEdit} onClick={() => open({ type: 'view', view, mode: 'filters' })}><FilterIcon size={15} />Filtrar{view.configuracao.filtros.length > 0 && <em>{view.configuracao.filtros.length}</em>}</button>
          <button disabled={!canEdit || view.tipo === 'calendario'} onClick={() => open({ type: 'view', view, mode: 'group' })}><Layers size={15} />Agrupar</button>
          <button className={view.configuracao.ordenacao.length ? 'has-config' : ''} disabled={!canEdit} onClick={() => open({ type: 'view', view, mode: 'sort' })}><SlidersHorizontal size={15} />Ordenar</button>
          {canEdit && <button className="tables-icon-button" aria-label="Configurar visualização" onClick={() => open({ type: 'view', view, mode: 'view' })}><MoreHorizontal size={16} /></button>}
        </>}<div className="tables-toolbar-end"><label className="tables-search"><Search size={15} /><input aria-label="Buscar registros" placeholder="Buscar registros…" value={searchDraft} onChange={e => { setSearchDraft(e.target.value); setPage(1) }} />{searchDraft && <button aria-label="Limpar busca" onClick={() => setSearchDraft('')}><X size={13} /></button>}</label>{canEdit && <button className="tables-button-primary" disabled={busy} onClick={() => createRecord()}><Plus size={16} />Novo registro</button>}</div></div>
        <section className="tables-data-area" aria-label={view.nome} aria-busy={records.loading}>
          {records.data ? view.tipo === 'grade' ? <DataGrid bundle={bundle} page={records.data} view={view} api={api} editable={canEdit} busy={busy || records.loading} onEditField={field => open({ type: 'field', field })} onCreateField={() => open({ type: 'field' })} onOpen={openRecord} onCreate={() => createRecord()} onSave={saveCell} selected={selected} onSelect={ids => setSelection({ table: bundle.tabela.id, ids })} /> : view.tipo === 'kanban' ? <KanbanView bundle={bundle} page={records.data} view={view} editable={canEdit} busy={busy || records.loading} onOpen={openRecord} onMove={(r, f, v) => { void saveCell(r, f, v) }} onCreate={createRecord} onConfigure={() => open({ type: 'view', view, mode: 'view' })} /> : <CalendarView bundle={bundle} page={records.data} view={view} editable={canEdit} month={month} onMonth={date => { setMonth(date); setPage(1) }} onOpen={openRecord} onCreate={createRecord} onConfigure={() => open({ type: 'view', view, mode: 'view' })} /> : <div className="tables-loading" role="status"><LoaderCircle className="tables-spin" size={20} />{records.error ? 'Não foi possível carregar os registros.' : 'Carregando registros…'}</div>}
        </section>
        <footer className="tables-pagination"><span>{records.data?.total ?? 0} registros{selected.size ? ` · ${selected.size} selecionados` : ''}</span>{!canEdit && <span>Somente leitura</span>}<div><span>Página {pageNumber} de {Math.max(1, Math.ceil((records.data?.total ?? 0) / (records.data?.tamanho ?? 50)))}</span><button aria-label="Página anterior" disabled={pageNumber <= 1 || loading} onClick={() => setPage(pageNumber - 1)}><ChevronLeft size={16} /></button><button aria-label="Próxima página" disabled={loading || pageNumber * (records.data?.tamanho ?? 50) >= (records.data?.total ?? 0)} onClick={() => setPage(pageNumber + 1)}><ChevronRight size={16} /></button></div></footer>
      </> : loading ? <div className="tables-loading" role="status"><LoaderCircle size={22} className="tables-spin" />Carregando tabela…</div> : <div className="tables-empty-view"><Table2 size={32} /><strong>Esta base ainda não tem tabelas</strong>{canEdit && <button className="tables-button-primary" onClick={() => open({ type: 'table' })}><Plus size={15} />Criar tabela</button>}</div>}
    </> : session.loading || baseResource.loading ? <div className="tables-loading" role="status"><LoaderCircle size={24} className="tables-spin" />Carregando Tables…</div> : <div className="tables-welcome"><div className="tables-welcome-icon"><Database size={34} strokeWidth={1.5} /></div><span className="tables-eyebrow">TABLES</span><h1>Seu trabalho, organizado do seu jeito.</h1><p>Crie bases e tabelas para acompanhar projetos, contatos e tudo o que sua equipe precisa.</p>{canEdit && <button className="tables-button-primary" onClick={() => open({ type: 'base' })}><Plus size={17} />Criar minha primeira base</button>}<span className="tables-muted">Campos personalizados · Grade · Kanban · Calendário</span></div>}
    {visibleModal?.type === 'base' && <BaseDialog {...currentDialog} base={visibleModal.base} onSave={input => void act(async () => { if (visibleModal.base) await api(`/bases/${visibleModal.base.id}`, send('PATCH', input)); else { const created = await api<{ base: Base; tabela: DataTable }>('/bases', send('POST', input)); navigate(created.base.id, created.tabela.id) } })} onDelete={visibleModal.base ? () => void act(async () => { await api(`/bases/${visibleModal.base!.id}`, send('DELETE', { expectedVersion: visibleModal.base!.versao })); router.push('/tables') }) : undefined} />}
    {visibleModal?.type === 'table' && base && <NameDialog {...currentDialog} title={visibleModal.table ? 'Editar tabela' : 'Criar tabela'} initial={visibleModal.table?.nome} onSave={name => void act(async () => { if (visibleModal.table) await api(`/tabelas/${visibleModal.table.id}`, send('PATCH', { nome: name, expectedStructureVersion: visibleModal.table.versao_estrutura })); else { const created = await api<{ tabela: DataTable }>(`/bases/${base.id}/tabelas`, send('POST', { nome: name })); navigate(base.id, created.tabela.id) } })} onDelete={visibleModal.table ? () => void act(async () => { await api(`/tabelas/${visibleModal.table!.id}`, send('DELETE', { expectedVersion: visibleModal.table!.versao_estrutura })); navigate(base.id) }) : undefined} />}
    {visibleModal?.type === 'field' && bundle && <FieldDialog {...currentDialog} field={visibleModal.field} bundle={bundle} onSave={input => void act(() => api(`/tabelas/${bundle.tabela.id}/campos${visibleModal.field ? '/' + visibleModal.field.id : ''}`, send(visibleModal.field ? 'PATCH' : 'POST', input)))} onDelete={visibleModal.field ? () => void act(() => api(`/tabelas/${bundle.tabela.id}/campos/${visibleModal.field!.id}`, send('DELETE', { expectedVersion: bundle.tabela.versao_estrutura }))) : undefined} />}
    {visibleModal?.type === 'view' && bundle && <ViewDialog {...currentDialog} api={api} mode={visibleModal.mode} view={visibleModal.view} bundle={bundle} onSave={input => void act(async () => { const result = await api<{ visualizacao: View }>(`/tabelas/${bundle.tabela.id}/visualizacoes${visibleModal.view ? '/' + visibleModal.view.id : ''}`, send(visibleModal.view ? 'PATCH' : 'POST', input)); setViewChoice({ table: bundle.tabela.id, id: result.visualizacao.id }); setPage(1) })} onDelete={visibleModal.view ? () => void act(() => api(`/tabelas/${bundle.tabela.id}/visualizacoes/${visibleModal.view!.id}`, send('DELETE', { expectedVersion: visibleModal.view!.versao }))) : undefined} />}
    {visibleModal?.type === 'record' && bundle && <RecordDialog key={visibleModal.record?.id ?? 'new'} {...currentDialog} readOnly={!canEdit} initialValues={visibleModal.values} record={visibleModal.record} bundle={bundle} api={api} onSave={values => void act(() => api(visibleModal.record ? `/registros/${visibleModal.record.id}` : `/tabelas/${bundle.tabela.id}/registros`, send(visibleModal.record ? 'PATCH' : 'POST', { valores: values, expectedStructureVersion: bundle.tabela.versao_estrutura, ...(visibleModal.record ? { expectedVersion: visibleModal.record.versao } : {}) })))} onDelete={visibleModal.record && canEdit ? () => void act(() => api(`/registros/${visibleModal.record!.id}`, send('DELETE', { expectedVersion: visibleModal.record!.versao }))) : undefined} onRefresh={async () => { if (visibleModal.record) { const data = await api<RecordDetail>(`/registros/${visibleModal.record.id}`); setModal({ type: 'record', record: data.registro }); refresh() } }} />}
    {visibleModal?.type === 'trash' && <TrashDialog key={revision} {...currentDialog} api={api} onRestore={(type, id) => void act(() => api(`/lixeira/${type}/${id}`, send('POST')), false)} />}
    {visibleModal?.type === 'members' && <Modal title="Equipe da empresa" description="Nesta etapa, Tables usa os acessos já existentes da sua empresa." onClose={close}><div className="tables-member-list">{bundle?.usuarios.map(member => <div key={member.id}><span className="tables-avatar">{member.nome.slice(0, 2).toUpperCase()}</span><span><strong>{member.nome}</strong><small>{member.email}</small></span></div>)}</div></Modal>}
  </main>
}
