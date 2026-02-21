'use client'

import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import {
  fetchModuleDashboard,
  fetchModuleRows,
  getCurrentMonthDateRange,
  hasChartsData,
} from '@/products/apps/data/modulosApiClient'
import type { DataRecord, DateRange } from '@/products/apps/shared/types'

function normalizeRange(range?: DateRange): Required<DateRange> {
  if (range?.from && range?.to) {
    return { from: range.from, to: range.to }
  }

  return getCurrentMonthDateRange()
}

function mergeByNamespace(prev: DataRecord, patch: DataRecord): DataRecord {
  const next = { ...(prev || {}) }

  for (const [namespace, payload] of Object.entries(patch)) {
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const previousNamespace = (prev?.[namespace] ?? {}) as DataRecord
      next[namespace] = { ...previousNamespace, ...(payload as DataRecord) }
      continue
    }

    next[namespace] = payload
  }

  return next
}

async function buildAppsHomePatch(range?: DateRange): Promise<DataRecord> {
  const effectiveRange = normalizeRange(range)

  const [finDash, venDash, comDash, finAp, finAr, venRows, comRows] = await Promise.all([
    fetchModuleDashboard('financeiro', { de: effectiveRange.from, ate: effectiveRange.to, limit: 6 }),
    fetchModuleDashboard('vendas', { de: effectiveRange.from, ate: effectiveRange.to, limit: 6 }),
    fetchModuleDashboard('compras', { de: effectiveRange.from, ate: effectiveRange.to, limit: 6 }),
    fetchModuleRows('financeiro', 'contas-a-pagar'),
    fetchModuleRows('financeiro', 'contas-a-receber'),
    fetchModuleRows('vendas', 'pedidos'),
    fetchModuleRows('compras', 'compras'),
  ])

  const patch: DataRecord = {}

  if (finDash) {
    patch.financeiro = {
      ...(patch.financeiro || {}),
      dashboard: finDash.charts || {},
      kpis: finDash.kpis || {},
    }
  }

  if (venDash) {
    patch.vendas = {
      ...(patch.vendas || {}),
      dashboard: venDash.charts || {},
      kpis: venDash.kpis || {},
    }
  }

  if (comDash) {
    patch.compras = {
      ...(patch.compras || {}),
      dashboard: comDash.charts || {},
      kpis: comDash.kpis || {},
    }
  }

  patch.financeiro = {
    ...(patch.financeiro || {}),
    'contas-a-pagar': finAp,
    'contas-a-receber': finAr,
  }

  patch.vendas = {
    ...(patch.vendas || {}),
    pedidos: venRows,
  }

  patch.compras = {
    ...(patch.compras || {}),
    compras: comRows,
  }

  return patch
}

async function buildVendasPatch(range?: DateRange): Promise<DataRecord> {
  const effectiveRange = normalizeRange(range)

  const [rows, dashboard] = await Promise.all([
    fetchModuleRows('vendas', 'pedidos'),
    fetchModuleDashboard('vendas', { de: effectiveRange.from, ate: effectiveRange.to, limit: 8 }),
  ])

  return {
    vendas: {
      pedidos: rows,
      dashboard: dashboard?.charts || {},
      kpis: dashboard?.kpis || {},
    },
  }
}

async function buildComprasPatch(range?: DateRange): Promise<DataRecord> {
  const queryRange = range?.from && range?.to ? { de: range.from, ate: range.to } : {}

  const [rows, dashboard] = await Promise.all([
    fetchModuleRows('compras', 'compras'),
    fetchModuleDashboard('compras', { ...queryRange, limit: 8 }),
  ])

  return {
    compras: {
      compras: rows,
      dashboard: dashboard?.charts || {},
      kpis: dashboard?.kpis || {},
    },
  }
}

async function buildFinanceiroPatch(range?: DateRange): Promise<DataRecord> {
  const effectiveRange = normalizeRange(range)

  const [dashboard, contasPagarRows, contasReceberRows] = await Promise.all([
    fetchModuleDashboard('financeiro', { de: effectiveRange.from, ate: effectiveRange.to, limit: 8 }),
    fetchModuleRows('financeiro', 'contas-a-pagar'),
    fetchModuleRows('financeiro', 'contas-a-receber'),
  ])

  return {
    financeiro: {
      'contas-a-pagar': contasPagarRows,
      'contas-a-receber': contasReceberRows,
      dashboard: dashboard?.charts || {},
      kpis: dashboard?.kpis || {},
    },
  }
}

async function buildEstoquePatch(range?: DateRange): Promise<DataRecord> {
  const effectiveRange = normalizeRange(range)

  const [dashboard, estoqueAtualRows] = await Promise.all([
    fetchModuleDashboard('estoque', { de: effectiveRange.from, ate: effectiveRange.to, limit: 8 }),
    fetchModuleRows('estoque', 'estoque-atual'),
  ])

  return {
    estoque: {
      'estoque-atual': estoqueAtualRows,
      dashboard: dashboard?.charts || {},
      kpis: dashboard?.kpis || {},
    },
  }
}

async function buildCrmPatch(range?: DateRange): Promise<DataRecord> {
  const effectiveRange = normalizeRange(range)

  const [dashboard, oportunidadesRows] = await Promise.all([
    fetchModuleDashboard('crm', { de: effectiveRange.from, ate: effectiveRange.to, limit: 8 }),
    fetchModuleRows('crm', 'oportunidades'),
  ])

  return {
    crm: {
      oportunidades: oportunidadesRows,
      dashboard: dashboard?.charts || {},
      kpis: dashboard?.kpis || {},
    },
  }
}

async function buildDocumentosPatch(range?: DateRange): Promise<DataRecord> {
  const effectiveRange = normalizeRange(range)

  const [dashboard, documentosRows, templatesRows, versoesRows] = await Promise.all([
    fetchModuleDashboard('documentos', { de: effectiveRange.from, ate: effectiveRange.to, limit: 8 }),
    fetchModuleRows('documentos', 'documentos'),
    fetchModuleRows('documentos', 'templates'),
    fetchModuleRows('documentos', 'template-versions'),
  ])

  return {
    documentos: {
      documentos: documentosRows,
      templates: templatesRows,
      'template-versions': versoesRows,
      dashboard: dashboard?.charts || {},
      kpis: dashboard?.kpis || {},
    },
  }
}

async function buildContabilidadePatch(range?: DateRange): Promise<DataRecord> {
  const effectiveRange = normalizeRange(range)

  const [dashboard, lancamentosRows, planoContasRows] = await Promise.all([
    fetchModuleDashboard('contabilidade', { de: effectiveRange.from, ate: effectiveRange.to, limit: 8 }),
    fetchModuleRows('contabilidade', 'lancamentos'),
    fetchModuleRows('contabilidade', 'plano-contas'),
  ])

  return {
    contabilidade: {
      lancamentos: lancamentosRows,
      'plano-contas': planoContasRows,
      dashboard: dashboard?.charts || {},
      kpis: dashboard?.kpis || {},
    },
  }
}

export async function refreshAppsHomeData(setData: Dispatch<SetStateAction<DataRecord>>, range?: DateRange) {
  const patch = await buildAppsHomePatch(range)
  setData((prev) => mergeByNamespace(prev || {}, patch))
}

export async function refreshAppsVendasData(setData: Dispatch<SetStateAction<DataRecord>>, range?: DateRange) {
  const patch = await buildVendasPatch(range)
  setData((prev) => mergeByNamespace(prev || {}, patch))
}

export async function refreshAppsComprasData(
  setData: Dispatch<SetStateAction<DataRecord>>,
  range?: DateRange,
  options?: { fallbackWithoutRange?: boolean },
) {
  let patch = await buildComprasPatch(range)

  if (options?.fallbackWithoutRange) {
    const currentCharts = patch.compras?.dashboard as Record<string, unknown> | undefined
    if (!hasChartsData(currentCharts)) {
      patch = await buildComprasPatch(undefined)
    }
  }

  setData((prev) => mergeByNamespace(prev || {}, patch))
}

export async function refreshAppsFinanceiroData(setData: Dispatch<SetStateAction<DataRecord>>, range?: DateRange) {
  const patch = await buildFinanceiroPatch(range)
  setData((prev) => mergeByNamespace(prev || {}, patch))
}

export async function refreshAppsEstoqueData(setData: Dispatch<SetStateAction<DataRecord>>, range?: DateRange) {
  const patch = await buildEstoquePatch(range)
  setData((prev) => mergeByNamespace(prev || {}, patch))
}

export async function refreshAppsCrmData(setData: Dispatch<SetStateAction<DataRecord>>, range?: DateRange) {
  const patch = await buildCrmPatch(range)
  setData((prev) => mergeByNamespace(prev || {}, patch))
}

export async function refreshAppsDocumentosData(setData: Dispatch<SetStateAction<DataRecord>>, range?: DateRange) {
  const patch = await buildDocumentosPatch(range)
  setData((prev) => mergeByNamespace(prev || {}, patch))
}

export async function refreshAppsContabilidadeData(setData: Dispatch<SetStateAction<DataRecord>>, range?: DateRange) {
  const patch = await buildContabilidadePatch(range)
  setData((prev) => mergeByNamespace(prev || {}, patch))
}

export function useAppsHomeBootstrap(setData: Dispatch<SetStateAction<DataRecord>>) {
  useEffect(() => {
    let active = true

    void (async () => {
      const patch = await buildAppsHomePatch(undefined)
      if (!active) return
      setData((prev) => mergeByNamespace(prev || {}, patch))
    })()

    return () => {
      active = false
    }
  }, [setData])
}

export function useAppsVendasBootstrap(setData: Dispatch<SetStateAction<DataRecord>>) {
  useEffect(() => {
    let active = true

    void (async () => {
      const patch = await buildVendasPatch(undefined)
      if (!active) return
      setData((prev) => mergeByNamespace(prev || {}, patch))
    })()

    return () => {
      active = false
    }
  }, [setData])
}

export function useAppsComprasBootstrap(setData: Dispatch<SetStateAction<DataRecord>>) {
  useEffect(() => {
    let active = true

    void (async () => {
      const currentMonth = normalizeRange(undefined)
      let patch = await buildComprasPatch(currentMonth)
      const currentCharts = patch.compras?.dashboard as Record<string, unknown> | undefined

      if (!hasChartsData(currentCharts)) {
        patch = await buildComprasPatch(undefined)
      }

      if (!active) return
      setData((prev) => mergeByNamespace(prev || {}, patch))
    })()

    return () => {
      active = false
    }
  }, [setData])
}

export function useAppsFinanceiroBootstrap(setData: Dispatch<SetStateAction<DataRecord>>) {
  useEffect(() => {
    let active = true

    void (async () => {
      const patch = await buildFinanceiroPatch(undefined)
      if (!active) return
      setData((prev) => mergeByNamespace(prev || {}, patch))
    })()

    return () => {
      active = false
    }
  }, [setData])
}

export function useAppsEstoqueBootstrap(setData: Dispatch<SetStateAction<DataRecord>>) {
  useEffect(() => {
    let active = true

    void (async () => {
      const patch = await buildEstoquePatch(undefined)
      if (!active) return
      setData((prev) => mergeByNamespace(prev || {}, patch))
    })()

    return () => {
      active = false
    }
  }, [setData])
}

export function useAppsCrmBootstrap(setData: Dispatch<SetStateAction<DataRecord>>) {
  useEffect(() => {
    let active = true

    void (async () => {
      const patch = await buildCrmPatch(undefined)
      if (!active) return
      setData((prev) => mergeByNamespace(prev || {}, patch))
    })()

    return () => {
      active = false
    }
  }, [setData])
}

export function useAppsDocumentosBootstrap(setData: Dispatch<SetStateAction<DataRecord>>) {
  useEffect(() => {
    let active = true

    void (async () => {
      const patch = await buildDocumentosPatch(undefined)
      if (!active) return
      setData((prev) => mergeByNamespace(prev || {}, patch))
    })()

    return () => {
      active = false
    }
  }, [setData])
}

export function useAppsContabilidadeBootstrap(setData: Dispatch<SetStateAction<DataRecord>>) {
  useEffect(() => {
    let active = true

    void (async () => {
      const patch = await buildContabilidadePatch(undefined)
      if (!active) return
      setData((prev) => mergeByNamespace(prev || {}, patch))
    })()

    return () => {
      active = false
    }
  }, [setData])
}
