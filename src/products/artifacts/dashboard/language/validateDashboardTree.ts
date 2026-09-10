'use client'

import { DASHBOARD_QUERY_RETIRED_MESSAGE } from '@/products/artifacts/dashboard/query/dashboardQueryPolicy'

import {
  DASHBOARD_SUPPORTED_CHART_PALETTE_SET,
  DASHBOARD_SUPPORTED_CHART_TYPE_SET,
  DASHBOARD_SUPPORTED_COMPONENT_SET,
  DASHBOARD_SUPPORTED_DATE_PICKER_PRESET_SET,
  DASHBOARD_SUPPORTED_HTML_TAG_SET,
  normalizeDashboardChartType,
} from '@/products/artifacts/dashboard/language/dashboardLanguageManifest'
import type { DashboardTreeNode } from '@/products/artifacts/dashboard/language/parseDashboardJsx'

type DashboardTreeChild = DashboardTreeNode | string

function formatNodePath(path: number[]): string {
  return path.length === 0 ? 'root' : path.join('.')
}

function isTreeNode(node: DashboardTreeChild): node is DashboardTreeNode {
  return typeof node === 'object' && node !== null && !Array.isArray(node)
}

function ensureStringProp(node: DashboardTreeNode, propName: string, path: number[]) {
  const value = node.props?.[propName]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${node.type}.${propName} obrigatorio em ${formatNodePath(path)}`)
  }
}

function ensureObjectProp(node: DashboardTreeNode, propName: string, path: number[]) {
  const value = node.props?.[propName]
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${node.type}.${propName} obrigatorio em ${formatNodePath(path)}`)
  }
  return value as Record<string, unknown>
}

function validateChartNode(node: DashboardTreeNode, path: number[]) {
  if (node.type !== 'Chart') return
  ensureStringProp(node, 'type', path)
  if (!DASHBOARD_SUPPORTED_CHART_TYPE_SET.has(normalizeDashboardChartType(node.props.type))) throw new Error('Tipo de gráfico não suportado.')
  if (!Array.isArray(node.props.data)) throw new Error('Chart.data deve ser uma lista de registros.')
}

function validateKpiNode(node: DashboardTreeNode, path: number[]) {
  if (node.type !== 'KPI') return
  if (!Object.prototype.hasOwnProperty.call(node.props, 'value') && !node.props.valuePath) throw new Error('KPI requer value ou valuePath.')
}

function validateQueryNode(node: DashboardTreeNode, path: number[]) {
  if (node.type === 'Query' || node.props?.dataQuery != null || node.props?.query != null) throw new Error(DASHBOARD_QUERY_RETIRED_MESSAGE)
  const source = node.props?.source
  if (source && typeof source === 'object' && ('query' in source || ('type' in source && source.type === 'query'))) throw new Error(DASHBOARD_QUERY_RETIRED_MESSAGE)
}

function validateTableNode(node: DashboardTreeNode, path: number[]) {
  if (node.type !== 'Table' && node.type !== 'PivotTable') return
  if (!Array.isArray(node.props.data) && !(node.type === 'Table' && node.props.dataPath)) throw new Error(node.type + '.data deve ser uma lista de registros.')
}

function validateDatePickerNode(node: DashboardTreeNode, path: number[]) {
  if (node.type !== 'DatePicker') return
  ensureStringProp(node, 'field', path)
  ensureStringProp(node, 'table', path)
  const presets = node.props?.presets
  if (!Array.isArray(presets)) return
  for (let index = 0; index < presets.length; index += 1) {
    const preset = String(presets[index] || '').trim()
    if (!DASHBOARD_SUPPORTED_DATE_PICKER_PRESET_SET.has(preset)) {
      throw new Error(`DatePicker.presets[${index}]="${preset}" nao suportado em ${formatNodePath(path)}`)
    }
  }
}

function validateFilterNode(node: DashboardTreeNode, path: number[]) {
  if (node.type !== 'Filter') return
  ensureStringProp(node, 'field', path)
  ensureStringProp(node, 'table', path)
}

function validateDashboardNode(node: DashboardTreeNode, path: number[]) {
  if (node.type !== 'DashboardTemplate' && node.type !== 'Dashboard') return
  ensureStringProp(node, 'title', path)
  if (node.type === 'Dashboard') {
    ensureStringProp(node, 'id', path)

    const themeName = node.props?.theme
    if (themeName != null && (typeof themeName !== 'string' || !themeName.trim())) {
      throw new Error(`Dashboard.theme invalido em ${formatNodePath(path)}`)
    }

    const chartPalette = node.props?.chartPalette
    if (chartPalette != null) {
      const normalizedChartPalette = String(chartPalette || '').trim().toLowerCase()
      if (!normalizedChartPalette || !DASHBOARD_SUPPORTED_CHART_PALETTE_SET.has(normalizedChartPalette)) {
        throw new Error(`Dashboard.chartPalette="${String(chartPalette)}" nao suportado em ${formatNodePath(path)}`)
      }
    }
  }
}

function collectTabsContract(node: DashboardTreeNode) {
  const tabValues = new Set<string>()
  const panelValues = new Set<string>()

  function walk(children: DashboardTreeChild[]) {
    for (const child of children) {
      if (!isTreeNode(child)) continue
      if (child.type === 'Tab') {
        const value = typeof child.props?.value === 'string' ? child.props.value.trim() : ''
        if (value) tabValues.add(value)
      }
      if (child.type === 'TabPanel') {
        const value = typeof child.props?.value === 'string' ? child.props.value.trim() : ''
        if (value) panelValues.add(value)
      }
      walk(child.children || [])
    }
  }

  walk(node.children || [])
  return { tabValues, panelValues }
}

function validateTabsNode(node: DashboardTreeNode, path: number[]) {
  if (node.type !== 'Tabs') return
  const { tabValues, panelValues } = collectTabsContract(node)
  if (tabValues.size === 0) {
    throw new Error(`Tabs sem filhos Tab validos em ${formatNodePath(path)}`)
  }

  for (const panelValue of panelValues) {
    if (!tabValues.has(panelValue)) {
      throw new Error(`TabPanel.value="${panelValue}" sem Tab correspondente em ${formatNodePath(path)}`)
    }
  }

  const defaultValue = typeof node.props?.defaultValue === 'string' ? node.props.defaultValue.trim() : ''
  if (defaultValue && !tabValues.has(defaultValue)) {
    throw new Error(`Tabs.defaultValue="${defaultValue}" sem Tab correspondente em ${formatNodePath(path)}`)
  }
}

function validateNode(node: DashboardTreeNode, path: number[]) {
  validateQueryNode(node, path)
  const type = String(node.type || '').trim()
  const isSupported =
    DASHBOARD_SUPPORTED_COMPONENT_SET.has(type) || DASHBOARD_SUPPORTED_HTML_TAG_SET.has(type.toLowerCase())

  if (!isSupported) {
    throw new Error(`Componente nao suportado: ${type || 'Unknown'} em ${formatNodePath(path)}`)
  }

  validateDashboardNode(node, path)
  validateFilterNode(node, path)
  validateKpiNode(node, path)
  validateChartNode(node, path)
  validateTableNode(node, path)
  validateDatePickerNode(node, path)
  validateTabsNode(node, path)
}

function walkTree(node: DashboardTreeNode, path: number[]) {
  validateNode(node, path)
  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index]
    if (!isTreeNode(child)) continue
    walkTree(child, [...path, index])
  }
}

export function validateDashboardTree(tree: DashboardTreeNode) {
  walkTree(tree, [])
}
