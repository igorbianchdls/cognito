'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { ErpActionBar } from '@/products/erp/frontend/components/ErpActionBar'
import { ErpDataTable } from '@/products/erp/frontend/components/ErpDataTable'
import { ErpEmptyState } from '@/products/erp/frontend/components/ErpEmptyState'
import { ErpFiltersBar } from '@/products/erp/frontend/components/ErpFiltersBar'
import { ErpFormDrawer } from '@/products/erp/frontend/components/ErpFormDrawer'
import { ErpMetricCard } from '@/products/erp/frontend/components/ErpMetricCard'
import { ErpPageHeader } from '@/products/erp/frontend/components/ErpPageHeader'
import { ErpSearchBar } from '@/products/erp/frontend/components/ErpSearchBar'
import { erpClient } from '@/products/erp/frontend/services/erpClient'
import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export function ErpEntityPage({ config }: { config: ErpEntityConfig }) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [records, setRecords] = useState<ErpEntityRecord[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await erpClient.listEntityRecords(config, { entityId: config.id, query, filters })
      setRecords(response.records)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar os dados.')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [config, filters, query])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  async function createRecord(values: Record<string, unknown>) {
    await erpClient.createEntityRecord(config, { entityId: config.id, values })
    await loadRecords()
  }

  const metricCards = useMemo(() => config.metrics.map((metric) => (
    <ErpMetricCard key={metric.label} metric={metric} />
  )), [config.metrics])

  return (
    <div className="flex min-h-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <ErpPageHeader eyebrow="ERP" title={config.label} description={config.description} />
        <ErpActionBar
          primaryActionLabel={config.primaryActionLabel}
          refreshing={loading}
          onRefresh={() => void loadRecords()}
          onPrimaryAction={() => setDrawerOpen(true)}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">{metricCards}</div>

      <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50/60 p-3 lg:flex-row lg:items-center">
        <ErpSearchBar value={query} placeholder={config.searchPlaceholder} onChange={setQuery} />
        <ErpFiltersBar
          filters={config.filters}
          values={filters}
          onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
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
        <ErpDataTable config={config} records={records} />
      ) : (
        <ErpEmptyState
          title={config.emptyState.title}
          description={config.emptyState.description}
          actionLabel={config.primaryActionLabel}
          onAction={() => setDrawerOpen(true)}
        />
      )}

      <ErpFormDrawer config={config} open={drawerOpen} onOpenChange={setDrawerOpen} onSubmit={createRecord} />
    </div>
  )
}
