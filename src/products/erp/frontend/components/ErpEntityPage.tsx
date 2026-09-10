'use client'

import { useErpAccess } from '@/products/erp/frontend/hooks/useErpAccess'
import { ErpMutation } from '@/products/erp/frontend/services/erpMutation'
import { getErpModuleCapability, isErpConnectedModuleId } from '@/products/erp/shared/moduleAccess'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ErpActionBar } from '@/products/erp/frontend/components/ErpActionBar'
import { ErpDataTable } from '@/products/erp/frontend/components/ErpDataTable'
import { ErpEmptyState } from '@/products/erp/frontend/components/ErpEmptyState'
import { ErpFiltersBar } from '@/products/erp/frontend/components/ErpFiltersBar'
import { ErpFormDrawer } from '@/products/erp/frontend/components/ErpFormDrawer'
import { ErpMetricCard } from '@/products/erp/frontend/components/ErpMetricCard'
import { ErpPagination } from '@/products/erp/frontend/components/ErpPagination'
import { ErpPageHeader } from '@/products/erp/frontend/components/ErpPageHeader'
import { ErpSearchBar } from '@/products/erp/frontend/components/ErpSearchBar'
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
  const [records, setRecords] = useState<ErpEntityRecord[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ErpEntityRecord | null>(null)
  const [metrics, setMetrics] = useState(config.metrics)
  const [fieldOptions, setFieldOptions] = useState<Record<string, Array<{ value: string; label: string }>>>({})
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 50
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await erpClient.listEntityRecords(config, { entityId: config.id, query, filters, page, pageSize })
      setRecords(response.records)
      setTotal(response.total)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar os dados.')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [config, filters, page, query])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  useEffect(() => {
    const categoryType = config.id === 'produtos' ? 'produto' : config.id === 'servicos' ? 'servico' : ''
    void Promise.all([
      fetch(`/api/erp/${encodeURIComponent(config.id)}/resumo`, { cache: 'no-store' })
        .then((response) => response.ok ? response.json() : Promise.reject())
        .then((body: { metrics?: typeof config.metrics }) => setMetrics(body.metrics || config.metrics))
        .catch(() => setMetrics(config.metrics)),
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

  const metricCards = useMemo(() => metrics.map((metric) => (
    <ErpMetricCard key={metric.label} metric={metric} />
  )), [metrics])

  return (
    <div className="flex min-h-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <ErpPageHeader eyebrow="ERP" title={config.label} description={config.description} />
        <ErpActionBar
          primaryActionLabel={config.primaryActionLabel}
          refreshing={loading}
          showPrimaryAction={canManage && config.fields.length > 0}
          onRefresh={() => void loadRecords()}
          onPrimaryAction={() => { setEditingRecord(null); setDrawerOpen(true) }}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">{metricCards}</div>

      <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50/60 p-3 lg:flex-row lg:items-center">
        <ErpSearchBar value={query} placeholder={config.searchPlaceholder} onChange={(value) => { setQuery(value); setPage(1) }} />
        <ErpFiltersBar
          filters={config.filters}
          values={filters}
          onChange={(key, value) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1) }}
        />
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
          Carregando dados...
        </div>
      ) : records.length > 0 ? (
        <div>
          <ErpDataTable config={visibleConfig} records={records} onAction={(action, record) => void runAction(action, record)}
            onEdit={canManage ? (record) => void editRecord(record) : undefined} onDeactivate={canManage ? (record) => void deactivateRecord(record) : undefined} />
          <ErpPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      ) : (
        <ErpEmptyState
          title={config.emptyState.title}
          description={config.emptyState.description}
          actionLabel={canManage && config.fields.length > 0 ? config.primaryActionLabel : undefined}
          onAction={canManage && config.fields.length > 0 ? () => { setEditingRecord(null); setDrawerOpen(true) } : undefined}
        />
      )}

      <ErpFormDrawer config={config} open={drawerOpen} onOpenChange={(open) => { setDrawerOpen(open); if (!open) setEditingRecord(null) }}
        onSubmit={createRecord} initialValues={editingRecord} fieldOptions={fieldOptions} />
    </div>
  )
}
