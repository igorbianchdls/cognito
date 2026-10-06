'use client'

import { ErpContractDetails } from './ErpContractDetails'
import { ErpStockCountEditor } from './ErpStockCountEditor'
import { ErpMutation } from '@/products/erp/frontend/services/erpMutation'
import { useErpAccess } from '@/products/erp/frontend/hooks/useErpAccess'
import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Download, Loader2, Play, Plus, RefreshCw, Search, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ErpRecordIdentity } from './ErpRecordIdentity'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErpStatusBadge } from '@/products/erp/frontend/components/ErpStatusBadge'
import { ErpPagination } from '@/products/erp/frontend/components/ErpPagination'
import { ErpModuleWorkspaceTabs, ErpPeriodSummary, ErpSalesTabs, ErpSearchToolbar, ErpStatusBadge as WorkspaceStatusBadge, ErpWorkspaceHeader } from '@/products/erp/frontend/components/ErpWorkspaceChrome'
import { getErpSection } from '@/products/erp/shared/navigation'
import { parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'
import type { ErpOperationConfig, ErpOperationField } from '@/products/erp/shared/operations'
import { getErpOperationCapability } from '@/products/erp/shared/operationAccess'

type OperationRecord = Record<string, unknown> & { id: string }
type CatalogOption = { value: string; label: string }

async function parseResponse<T>(response: Response): Promise<T> {
  return parseErpResponse<T>(response)
}

function formatValue(value: unknown, kind?: string) {
  if (value === null || value === undefined || value === '') return '-'
  if (kind === 'currency') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
  if (kind === 'number') return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(Number(value))
  if (kind === 'date') {
    const normalized = String(value).slice(0, 10)
    const [year, month, day] = normalized.split('-')
    return year && month && day ? `${day}/${month}/${year}` : String(value)
  }
  if (typeof value === 'boolean') return value ? 'Sim' : 'Nao'
  return String(value).replaceAll('_', ' ')
}

function toneForStatus(value: unknown) {
  const status = String(value || '').toLowerCase()
  if (['ativo', 'finalizado', 'finalizada', 'concluida', 'conciliada', 'normal', 'credito', 'receita'].includes(status)) return 'success' as const
  if (['cancelado', 'cancelada', 'falha', 'erro', 'vencido', 'repor', 'debito', 'despesa'].includes(status)) return 'danger' as const
  if (['pendente', 'rascunho', 'em_contagem', 'parcial', 'a_vencer'].includes(status)) return 'warning' as const
  return 'default' as const
}

function AsyncCatalogSelect({ resource, source, value, onChange, required }: {
  resource: string
  source: NonNullable<ErpOperationField['optionSource']>
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [options, setOptions] = useState<CatalogOption[]>([])
  const [selection, setSelection] = useState({ value: '', label: '' })
  const selectedLabel = value && selection.value === value ? selection.label : ''
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    queueMicrotask(() => { if (!controller.signal.aborted) setLoading(true) })
    const params = new URLSearchParams({ resource, source, q: deferredQuery, limit: '20' })
    fetch(`/api/erp/operacoes/catalogos?${params}`, { cache: 'no-store', signal: controller.signal })
      .then((response) => parseResponse<{ records: CatalogOption[] }>(response))
      .then((body) => { if (!controller.signal.aborted) setOptions(body.records) })
      .catch((error) => { if (error instanceof Error && error.name !== 'AbortError') setOptions([]) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [deferredQuery, open, resource, source])

  return (
    <div className="relative">
      <Input
        value={open ? query : selectedLabel}
        placeholder={value && !selectedLabel ? `Selecionado: ${value}` : 'Buscar e selecionar'}
        required={required && !value}
        role="combobox"
        aria-expanded={open}
        onFocus={() => { setQuery(''); setOpen(true) }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => { setQuery(event.target.value); setOpen(true) }}
      />
      {open ? (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg">
          {loading ? <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500"><Loader2 className="size-4 animate-spin" />Buscando</div> : null}
          {!loading && !options.length ? <div className="px-3 py-2 text-sm text-gray-500">Nenhum resultado.</div> : null}
          {!loading ? options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="block w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onChange(option.value); setSelection({ value: option.value, label: option.label }); setOpen(false) }}
            >
              {option.label}
            </button>
          )) : null}
        </div>
      ) : null}
    </div>
  )
}

function FieldControl({ field, value, resource, onChange }: {
  field: ErpOperationField
  value: string
  resource: string
  onChange: (value: string) => void
}) {
  if (field.type === 'select' && field.optionSource) {
    return <AsyncCatalogSelect resource={resource} source={field.optionSource} value={value} onChange={onChange} required={field.required} />
  }
  if (field.type === 'select') {
    const options = field.options || []
    return (
      <select
        id={field.key}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={field.required}
        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
      >
        <option value="">Selecione</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    )
  }
  return (
    <Input
      id={field.key}
      type={field.type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={field.required}
      placeholder={field.placeholder}
      step={field.type === 'number' ? '0.0001' : undefined}
      className="h-10"
    />
  )
}

export function ErpOperationsWorkspacePage({ config }: { config: ErpOperationConfig }) {
  const isSalesWorkspace = config.resource === 'contratos'
  const isStockWorkspace = getErpSection('estoque').modules.some(module => module.id === config.moduleId)
  const isWorkspace = isSalesWorkspace || isStockWorkspace
  const workspaceTitles: Record<string, string> = {
    'posicao-estoque': 'Situação do estoque', movimentacoes: 'Movimentações de estoque',
    inventarios: 'Inventários', transferencias: 'Transferências de estoque',
    'locais-estoque': 'Locais de estoque', kits: 'Kits de produtos', 'conversoes-unidades': 'Conversões de unidades',
  }
  const [records, setRecords] = useState<OperationRecord[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'row'>('create')
  const [contractId,setContractId] = useState<string|null>(null)
  const [selectedRecord, setSelectedRecord] = useState<OperationRecord | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [ofxOpen, setOfxOpen] = useState(false)
  const [ofxAccountId, setOfxAccountId] = useState('')
  const [ofxFile, setOfxFile] = useState<File | null>(null)
  const loadRevision=useRef(0)

  const load = useCallback(async () => {
    const revision=++loadRevision.current
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '50', query: deferredQuery })
      const recordsResponse = await fetch(`/api/erp/operacoes/${encodeURIComponent(config.resource)}?${params}`, { cache: 'no-store' })
      const result = await parseResponse<{ records: OperationRecord[]; total: number }>(recordsResponse)
      if(revision!==loadRevision.current) return
      setRecords(result.records)
      setTotal(result.total)
    } catch (loadError) {
      if(revision!==loadRevision.current) return
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar os dados.')
    } finally {
      if(revision===loadRevision.current) setLoading(false)
    }
  }, [config.resource, deferredQuery, page])

  useEffect(() => { void load(); return()=>{++loadRevision.current} }, [load])

  const currencyColumn = config.resource === 'posicao-estoque' ? config.columns.find(column => column.key === 'valor_estoque') : config.columns.find((column) => column.kind === 'currency')
  const monetaryTotal = currencyColumn
    ? records.reduce((sum, record) => sum + Number(record[currencyColumn.key] || 0), 0)
    : null
  const attentionCount = records.filter((record) => ['pendente', 'repor', 'vencido', 'falha', 'erro'].includes(String(record.status || record.situacao || ''))).length

  const openCreate = () => {
    setDialogMode('create')
    setSelectedRecord(null)
    setValues({})
    setError('')
    setDialogOpen(true)
  }

  const openRowAction = (record: OperationRecord) => {
    setDialogMode('row')
    setSelectedRecord(record)
    setValues({})
    setError('')
    setDialogOpen(true)
  }

  const activeFields = dialogMode === 'row' ? config.rowAction?.fields || [] : config.fields || []
  const activeResource = dialogMode === 'row' ? config.rowAction?.resource || config.resource : config.resource

  const access = useErpAccess()
  const canCreate = access.can(getErpOperationCapability(config.resource, true)) || (config.resource === 'movimentacoes' && access.can('erp.estoque.ajustar'))
  const canSubmit = access.can(activeResource === 'movimentacoes' && values.tipo?.startsWith('ajuste') ? 'erp.estoque.ajustar' : getErpOperationCapability(activeResource, true))
  const [createOperation] = useState(()=>new ErpMutation(undefined,true))
  const submit = async (additionalValues: Record<string, unknown> = {}) => {
    if (saving || !canSubmit) return
    setSaving(true)
    setError('')
    try {
      const bodyValues: Record<string, unknown> = { ...values, ...additionalValues }
      if (dialogMode === 'row' && selectedRecord) bodyValues.transacao_bancaria_id = selectedRecord.id
      await createOperation.submit(`/api/erp/operacoes/${encodeURIComponent(activeResource)}`,{values:bodyValues})
      setDialogOpen(false)
      setSuccess(dialogMode === 'row' ? 'Operacao concluida.' : 'Registro salvo.')
      await load()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Nao foi possivel salvar.')
    } finally {
      setSaving(false)
    }
  }

  const process = async () => {
    if (!config.processAction || saving || !canCreate) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch(config.processAction.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const result = await parseResponse<{ total?: number; skipped?: Array<{contractId:string;reason:string}> }>(response)
      setSuccess(`${result.total || 0} venda(s) gerada(s). ${result.skipped?.map(item=>`Contrato ${item.contractId}: ${item.reason}`).join(' ') || ''}`)
      await load()
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : 'Nao foi possivel processar.')
    } finally {
      setSaving(false)
    }
  }

  const importOfx = async () => {
    if (!ofxFile || !ofxAccountId) { setError('Selecione a conta financeira e o arquivo OFX.'); return }
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/erp/bancos/importar-ofx', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: ofxAccountId, fileName: ofxFile.name, content: await ofxFile.text() }),
      })
      const result = await parseResponse<{ imported?: number; ignored?: number }>(response)
      setSuccess(`${result.imported || 0} transacao(oes) importada(s); ${result.ignored || 0} ignorada(s).`)
      setOfxOpen(false)
      setOfxFile(null)
      await load()
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Nao foi possivel importar o OFX.')
    } finally { setSaving(false) }
  }

  return (
    <div className={isWorkspace ? 'flex min-h-full min-w-0 flex-col bg-white' : 'space-y-6'}>
      {contractId && <ErpContractDetails id={contractId} onClose={()=>setContractId(null)} onSaved={()=>void load()} />}
      {isWorkspace ? <>
        <ErpWorkspaceHeader section={isStockWorkspace ? 'Estoque' : 'Vendas'} title={isStockWorkspace ? workspaceTitles[config.moduleId] ?? config.title : 'Contratos'} menuItems={[{ label: 'Atualizar dados', onSelect: () => void load() }]} primaryAction={config.primaryAction && canCreate ? <Button aria-label={isSalesWorkspace ? 'Adicionar contrato' : config.primaryAction} className="h-11 rounded-md bg-[#c9f20a] px-5 font-medium text-[#142000] shadow-none hover:bg-[#b9df09]" onClick={openCreate}><Plus className="size-4" />{isStockWorkspace ? config.primaryAction : 'Adicionar'}</Button> : undefined} />
        {isStockWorkspace ? <ErpModuleWorkspaceTabs sectionId="estoque" moduleId={config.moduleId} /> : <ErpSalesTabs activeHref="/erp/vendas/contratos" />}
      </> : <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-normal text-gray-950">{config.title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">{config.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/erp/operacoes/${encodeURIComponent(config.resource)}?format=csv&query=${encodeURIComponent(deferredQuery)}`}><Download className="size-4" />Exportar</a>
          </Button>
          {config.moduleId === 'conciliacao-bancaria' ? <Button variant="outline" size="sm" onClick={() => { setError(''); setOfxOpen(true) }}><Upload className="size-4" />Importar OFX</Button> : null}
          {config.processAction && canCreate ? <Button variant="outline" size="sm" onClick={() => void process()} disabled={saving}><Play className="size-4" />{config.processAction.label}</Button> : null}
          {config.primaryAction && canCreate ? <Button size="sm" onClick={openCreate}><Plus className="size-4" />{config.primaryAction}</Button> : null}
        </div>
      </header>}

      {isWorkspace ? <ErpPeriodSummary title="Resumo desta página" description="Considera os registros carregados com os filtros atuais." metrics={isSalesWorkspace ? [
        { label: 'Contratos', value: String(records.length) },
        { label: 'Ativos', value: String(records.filter(record => record.status === 'ativo').length), tone: 'success' },
        { label: 'Valor listado', value: formatValue(monetaryTotal, 'currency') },
      ] : [
        { label: 'Registros carregados', value: String(records.length) },
        { label: 'Requerem atenção', value: String(attentionCount), tone: attentionCount ? 'danger' : 'default' },
        ...(currencyColumn && config.resource === 'posicao-estoque' ? [{ label: 'Valor do estoque listado', value: formatValue(monetaryTotal, 'currency') }] : []),
      ]} /> : <section className="grid border-y border-gray-200 bg-gray-50/60 sm:grid-cols-3">
        <div className="px-4 py-4"><div className="text-xs font-medium text-gray-500">Registros</div><div className="mt-1 text-xl font-semibold text-gray-950">{total}</div></div>
        <div className="border-t border-gray-200 px-4 py-4 sm:border-l sm:border-t-0"><div className="text-xs font-medium text-gray-500">Atencao nesta pagina</div><div className="mt-1 text-xl font-semibold text-gray-950">{attentionCount}</div></div>
        <div className="border-t border-gray-200 px-4 py-4 sm:border-l sm:border-t-0"><div className="text-xs font-medium text-gray-500">{currencyColumn ? `${currencyColumn.label} nesta pagina` : 'Atualizacao'}</div><div className="mt-1 text-xl font-semibold text-gray-950">{monetaryTotal === null ? 'Em tempo real' : formatValue(monetaryTotal, 'currency')}</div></div>
      </section>}

      {error && !dialogOpen ? <div role="alert" className={`${isWorkspace ? 'mx-5 mt-4 md:mx-8 lg:mx-10' : ''} rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700`}>{error}</div> : null}
      {success ? <div role="status" className={`${isWorkspace ? 'mx-5 mt-4 md:mx-8 lg:mx-10' : ''} flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700`}><CheckCircle2 className="size-4" />{success}</div> : null}

      {isWorkspace ? <ErpSearchToolbar query={query} onQueryChange={value => { setQuery(value); setPage(1) }} placeholder={isStockWorkspace ? 'Pesquisar registros…' : 'Pesquisar contratos…'} resultLabel={<>{total ? (page - 1) * 50 + 1 : 0}–{Math.min(page * 50, total)} de {total}</>}>
        <Button variant="outline" className="h-10 rounded-lg border-[#dfdfdc] font-normal" asChild><a href={`/api/erp/operacoes/${encodeURIComponent(config.resource)}?format=csv&query=${encodeURIComponent(deferredQuery)}`}><Download className="size-4" />Exportar</a></Button>
        {config.processAction && canCreate ? <Button variant="outline" className="h-10 rounded-lg border-[#dfdfdc] font-normal" onClick={() => void process()} disabled={saving}><Play className="size-4" />{config.processAction.label}</Button> : null}
      </ErpSearchToolbar> : <div className="flex items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Buscar em todos os registros" className="h-10 pl-9" />
        </div>
        <Button variant="ghost" size="icon" onClick={() => void load()} title="Atualizar"><RefreshCw className="size-4" /></Button>
      </div>}

      {loading ? (
        <div className={isWorkspace ? 'space-y-2 px-5 py-4 md:px-8 lg:px-10' : 'space-y-2'}><Skeleton className="h-10 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
      ) : (
        <div className={isWorkspace ? 'min-h-[300px] min-w-0 flex-1 overflow-x-auto' : 'overflow-x-auto rounded-md border border-gray-200 bg-white'}>
          <Table className={isWorkspace ? 'erp-workspace-table min-w-[1000px] border-b border-[#e7e7e4]' : undefined}>
            <TableHeader><TableRow className={isWorkspace ? 'bg-[#fbfbfa] hover:bg-[#fbfbfa]' : 'hover:bg-white'}>{config.columns.map((column) => <TableHead key={column.key} className={isWorkspace ? (['currency', 'number'].includes(column.kind ?? '') ? 'text-right' : undefined) : 'h-10 whitespace-nowrap bg-gray-50 text-xs font-semibold uppercase tracking-normal text-gray-500'}>{column.label}</TableHead>)}{config.rowAction ? <TableHead className="w-28 bg-gray-50" /> : null}</TableRow></TableHeader>
            <TableBody>
              {records.length ? records.map((record) => (
                <TableRow key={record.id}>
                  {config.columns.map((column) => (
                    <TableCell key={column.key} className={isWorkspace && ['currency', 'number'].includes(column.kind ?? '') ? 'whitespace-nowrap text-right font-medium tabular-nums' : 'whitespace-nowrap text-sm text-gray-700'}>
                      {config.resource === 'contratos' && column.key === 'numero' ? <button className="font-medium text-[#245ea6] hover:underline" onClick={()=>setContractId(String(record.id))}>{String(record.numero)}</button> : ['nome', 'produto'].includes(column.key) ? <ErpRecordIdentity name={String(record[column.key] || '')} category={String(record.categoria || (config.resource === 'locais-estoque' ? record.tipo : '') || '')} identityKey={`${config.resource}:${record.id}`} /> : column.kind === 'status' ? (isWorkspace ? <WorkspaceStatusBadge status={String(record[column.key] || '')} tone={toneForStatus(record[column.key])} /> : <ErpStatusBadge label={formatValue(record[column.key])} tone={toneForStatus(record[column.key])} />) : formatValue(record[column.key], column.kind)}
                    </TableCell>
                  ))}
                  {config.rowAction ? <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => openRowAction(record)} disabled={String(record.status) !== 'pendente' || !access.can(getErpOperationCapability(config.rowAction.resource, true))}>{config.rowAction.label}</Button></TableCell> : null}
                </TableRow>
              )) : <TableRow><TableCell colSpan={config.columns.length + (config.rowAction ? 1 : 0)} className="h-32 text-center text-sm text-gray-500">Nenhum registro encontrado.</TableCell></TableRow>}
            </TableBody>
          </Table>
          <div className={isWorkspace ? 'px-5 py-3 md:px-8 lg:px-10' : undefined}><ErpPagination page={page} pageSize={50} total={total} onPageChange={setPage} /></div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{dialogMode === 'row' ? config.rowAction?.label : config.primaryAction}</DialogTitle><DialogDescription>Preencha os dados obrigatorios para concluir a operacao.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            {activeFields.filter(field => activeResource !== 'inventarios' || !['produto_id', 'quantidade_contada'].includes(field.key)).map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}{field.required ? ' *' : ''}</Label>
                <FieldControl field={activeResource === 'movimentacoes' && field.key === 'tipo' ? { ...field, options: field.options?.filter(option => access.can(option.value.startsWith('ajuste') ? 'erp.estoque.ajustar' : 'erp.estoque.movimentar')) } : field} value={values[field.key] || ''} resource={activeResource} onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))} />
              </div>
            ))}
          </div>
          {activeResource === 'inventarios' && <ErpStockCountEditor key={`${dialogOpen}`} localId={values.local_estoque_id || ''} reason={values.motivo || ''} saving={saving} onSave={submit} />}
          {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            {activeResource !== 'inventarios' && <Button onClick={() => void submit()} disabled={saving || !canSubmit}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Salvar</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ofxOpen} onOpenChange={setOfxOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Importar extrato OFX</DialogTitle><DialogDescription>Transacoes repetidas sao identificadas automaticamente pelo banco e pelo arquivo.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label htmlFor="ofx-account">Conta financeira *</Label><AsyncCatalogSelect resource={config.resource} source="accounts" value={ofxAccountId} onChange={setOfxAccountId} required /></div>
            <div className="space-y-2"><Label htmlFor="ofx-file">Arquivo OFX *</Label><Input id="ofx-file" type="file" accept=".ofx,application/x-ofx" onChange={(event) => setOfxFile(event.target.files?.[0] || null)} /></div>
            {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOfxOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={() => void importOfx()} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}Importar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
