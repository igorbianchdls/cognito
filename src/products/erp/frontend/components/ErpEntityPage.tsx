'use client'

import { useErpAccess } from '@/products/erp/frontend/hooks/useErpAccess'
import { ErpMutation } from '@/products/erp/frontend/services/erpMutation'
import { getErpModuleCapability, isErpConnectedModuleId } from '@/products/erp/shared/moduleAccess'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { ErpDataTable } from '@/products/erp/frontend/components/ErpDataTable'
import { ErpEmptyState } from '@/products/erp/frontend/components/ErpEmptyState'
import { ErpFiltersBar } from '@/products/erp/frontend/components/ErpFiltersBar'
import { ErpFormDrawer } from '@/products/erp/frontend/components/ErpFormDrawer'
import { ErpPagination } from '@/products/erp/frontend/components/ErpPagination'
import { ErpFilterButton, ErpModuleWorkspaceTabs, ErpPeriodSummary, ErpSearchToolbar, ErpWorkspaceHeader } from '@/products/erp/frontend/components/ErpWorkspaceChrome'
import { getErpSection } from '@/products/erp/shared/navigation'
import { ERP_STATUS_ALL_VALUE } from '@/products/erp/shared/constants'
import { erpClient } from '@/products/erp/frontend/services/erpClient'
import type { ErpEntityAction, ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export function ErpEntityPage({ config }: { config: ErpEntityConfig }) {
  const access = useErpAccess()
  const canManage = isErpConnectedModuleId(config.id) && access.can(getErpModuleCapability(config.id, 'manage'))
  const canAct = (action: ErpEntityAction) => action.id === 'baixar' ? access.can('erp.financeiro.baixar') : canManage
  const visibleConfig = { ...config, actions: config.actions?.filter(canAct) }
  const createOperation = useRef(new ErpMutation())
  const actionOperations = useRef(new Map<string, ErpMutation>())
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [records, setRecords] = useState<ErpEntityRecord[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ErpEntityRecord | null>(null)
  const [metrics, setMetrics] = useState<typeof config.metrics>([])
  const [metricsError, setMetricsError] = useState(false)
  const loadRevision = useRef(0)
  const [fieldOptions, setFieldOptions] = useState<Record<string, Array<{ value: string; label: string }>>>({})
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 50
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecords = useCallback(async () => {
    const revision = ++loadRevision.current
    setLoading(true)
    setError(null)
    try {
      const [response, summary] = await Promise.all([
        erpClient.listEntityRecords(config, { entityId: config.id, query, filters, page, pageSize }),
        fetch(`/api/erp/${encodeURIComponent(config.id)}/resumo`, { cache: 'no-store' })
          .then(async response => { if (!response.ok) throw new Error('Resumo indisponível'); return response.json() as Promise<{ metrics?: typeof config.metrics }> })
          .catch(() => null),
      ])
      if (revision !== loadRevision.current) return
      setRecords(response.records)
      setTotal(response.total)
      setMetrics(summary?.metrics || [])
      setMetricsError(!summary?.metrics)
    } catch (loadError) {
      if (revision !== loadRevision.current) return
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar os dados.')
      setRecords([])
    } finally {
      if (revision === loadRevision.current) setLoading(false)
    }
  }, [config, filters, page, query])

  useEffect(() => {
    void loadRecords()
    return () => { ++loadRevision.current }
  }, [loadRecords])

  useEffect(() => {
    const categoryType = config.id === 'produtos' ? 'produto' : config.id === 'servicos' ? 'servico' : ''
    void Promise.all([
      categoryType
        ? fetch(`/api/erp/catalogos/categorias?tipo=${categoryType}${config.id === 'servicos' ? '&identificador=id' : ''}`, { cache: 'no-store' })
          .then((response) => response.ok ? response.json() : Promise.reject())
          .then((body: { options?: Array<{ value: string; label: string }> }) => setFieldOptions({ [config.id === 'servicos' ? 'categoria_id' : 'categoria']: body.options || [] }))
          .catch(() => setFieldOptions({}))
        : Promise.resolve(),
    ])
  }, [config])

  async function createRecord(values: Record<string, unknown>) {
    if (!canManage) throw new Error('Você não tem permissão para salvar este cadastro.')
    if (editingRecord) {
      await erpClient.updateEntityRecord(config, editingRecord.id, {
        values,
        expectedVersion: Number(editingRecord.versao || 0),
      })
    } else {
      await erpClient.createEntityRecord(config, { entityId: config.id, values, operation: createOperation.current })
    }
    setEditingRecord(null)
    await loadRecords()
  }

  async function editRecord(record: ErpEntityRecord) {
    setError(null)
    try {
      const response = await erpClient.getEntityRecord(config, record.id)
      setEditingRecord(response.record)
      setDrawerOpen(true)
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : 'Nao foi possivel abrir o registro.')
    }
  }

  async function deactivateRecord(record: ErpEntityRecord) {
    if (!window.confirm(`Desativar este ${config.singularLabel}?`)) return
    setLoading(true)
    setError(null)
    try {
      await erpClient.deactivateEntityRecord(config, record.id, Number(record.versao || 0))
      await loadRecords()
    } catch (deactivateError) {
      setError(deactivateError instanceof Error ? deactivateError.message : 'Nao foi possivel desativar o registro.')
    } finally { setLoading(false) }
  }

  async function runAction(action: ErpEntityAction, record: ErpEntityRecord) {
    if (!canAct(action)) return
    const message = action.confirmMessage || `${action.label} este registro?`
    if (!window.confirm(message)) return

    const actionRecordId = action.id === 'baixar' ? String(record.parcela_id || '') : record.id
    if (!actionRecordId) {
      setError('Nao foi possivel localizar a parcela aberta para baixa.')
      return
    }

    const values: Record<string, unknown> = config.id === 'pedidos' ? {expectedVersion:Number(record.versao)} : {}
    if (action.id === 'baixar') {
      const defaultValue = Math.max(0, Number(record.valor || 0) - Number(record.valor_pago || 0))
      const typedValue = window.prompt('Valor da baixa', defaultValue ? String(defaultValue) : '')
      if (typedValue === null) return
      values.valor = typedValue
    }

    setLoading(true)
    setError(null)
    try {
      const key = action.id + ':' + actionRecordId
      if (!actionOperations.current.has(key)) actionOperations.current.set(key, new ErpMutation(undefined, action.id === 'baixar'))
      await erpClient.runEntityAction(config, { actionId: action.id, recordId: actionRecordId, values, operation: actionOperations.current.get(key) })
      await loadRecords()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Nao foi possivel executar a acao.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full min-w-0 flex-col bg-white">
      <ErpWorkspaceHeader
        section={['produtos', 'servicos', 'categorias'].includes(config.id) ? 'Produtos e serviços' : getErpSection(config.sectionId).label}
        title={config.id === 'servicos' ? 'Serviços' : config.label}
        menuItems={[{ label: 'Atualizar dados', onSelect: () => void loadRecords() }]}
        primaryAction={canManage && config.fields.length > 0 ? <Button aria-label={`Adicionar ${config.singularLabel}`} className="h-11 rounded-md bg-[#c9f20a] px-5 font-medium text-[#142000] shadow-none hover:bg-[#b9df09]" onClick={() => { setEditingRecord(null); setDrawerOpen(true) }}><Plus className="size-4" />Adicionar</Button> : undefined}
      />
      <ErpModuleWorkspaceTabs sectionId={config.sectionId} moduleId={config.id} />
      {metricsError ? <p role="status" className="mx-5 my-4 text-sm text-amber-700 md:mx-8 lg:mx-10">Os indicadores estão indisponíveis. Atualize para tentar novamente.</p> : metrics.length > 0 ? <ErpPeriodSummary title="Resumo dos cadastros" description="Indicadores gerais da base cadastrada." metrics={metrics.map(metric => ({ label: metric.label, value: metric.value, tone: metric.tone === 'warning' ? 'default' : metric.tone }))} /> : null}
      <ErpSearchToolbar query={query} onQueryChange={value => { setQuery(value); setPage(1) }} placeholder={config.searchPlaceholder} resultLabel={<>{total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} de {total}</>}>
        {config.filters.length > 0 ? <ErpFilterButton active={Object.values(filters).some(value => Boolean(value) && value !== ERP_STATUS_ALL_VALUE)} onClick={() => setFiltersOpen(current => !current)} /> : null}
      </ErpSearchToolbar>
      {filtersOpen ? <div className="border-b border-[#e7e7e4] bg-[#fafaf8] px-5 py-3 md:px-8 lg:px-10">
        <ErpFiltersBar
          filters={config.filters}
          values={filters}
          onChange={(key, value) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1) }}
        />
      </div> : null}

      {error ? (
        <div role="alert" className="mx-5 mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:mx-8 lg:mx-10">
          {error}
        </div>
      ) : null}

      <div className="min-h-[300px] min-w-0 flex-1">{loading ? (
        <div role="status" className="px-5 py-10 text-center text-sm text-gray-500">
          Carregando dados...
        </div>
      ) : records.length > 0 ? (
        <div>
          <ErpDataTable config={visibleConfig} records={records} onAction={(action, record) => void runAction(action, record)}
            onEdit={canManage ? (record) => void editRecord(record) : undefined} onDeactivate={canManage ? (record) => void deactivateRecord(record) : undefined} />
          <div className="px-5 py-3 md:px-8 lg:px-10"><ErpPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} /></div>
        </div>
      ) : (
        <div className="px-5 py-6 md:px-8 lg:px-10"><ErpEmptyState
          title={config.emptyState.title}
          description={config.emptyState.description}
          actionLabel={canManage && config.fields.length > 0 ? config.primaryActionLabel : undefined}
          onAction={canManage && config.fields.length > 0 ? () => { setEditingRecord(null); setDrawerOpen(true) } : undefined}
        /></div>
      )}</div>

      <ErpFormDrawer config={config} open={drawerOpen} onOpenChange={(open) => { setDrawerOpen(open); if (!open) setEditingRecord(null) }}
        onSubmit={createRecord} initialValues={editingRecord} fieldOptions={fieldOptions} />
    </div>
  )
}
