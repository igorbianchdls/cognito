'use client'

import type { DashboardTreeNode } from '@/products/dashboard/workspace/dashboardJsxParser'

type DashboardTreeChild = DashboardTreeNode | string

const SUPPORTED_COMPONENTS = new Set([
  'DashboardTemplate',
  'Theme',
  'Dashboard',
  'Card',
  'Tabs',
  'Tab',
  'TabPanel',
  'Query',
  'Chart',
  'BarChart',
  'LineChart',
  'PieChart',
  'HorizontalBarChart',
  'ScatterChart',
  'RadarChart',
  'TreemapChart',
  'ComposedChart',
  'FunnelChart',
  'SankeyChart',
  'Gauge',
  'KPI',
  'Table',
  'PivotTable',
  'Filter',
  'Select',
  'OptionList',
  'DatePicker',
  'Insights',
  'Text',
  'TextNode',
  'Br',
])

const SUPPORTED_HTML_TAGS = new Set([
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'aside',
  'p',
  'span',
  'strong',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
])

const SUPPORTED_DATE_PICKER_PRESETS = new Set(['7d', '14d', '30d', '90d', 'month', 'quarter'])

function normalizeChartType(input: unknown): string {
  const raw = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
  if (raw === 'barchart') return 'bar'
  if (raw === 'linechart') return 'line'
  if (raw === 'piechart') return 'pie'
  if (raw === 'horizontalbar' || raw === 'horizontal-bar') return 'horizontal-bar'
  if (raw === 'horizontalbarchart' || raw === 'horizontal-bar-chart') return 'horizontal-bar'
  if (raw === 'scatterchart') return 'scatter'
  if (raw === 'radarchart') return 'radar'
  if (raw === 'treemapchart') return 'treemap'
  if (raw === 'composedchart') return 'composed'
  if (raw === 'funnelchart') return 'funnel'
  if (raw === 'sankeychart') return 'sankey'
  if (raw === 'gaugechart') return 'gauge'
  return raw
}

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
  const normalizedType = normalizeChartType(node.props.type)
  if (!normalizedType) {
    throw new Error(`Chart.type invalido em ${formatNodePath(path)}`)
  }

  const allowed = new Set(['bar', 'line', 'pie', 'horizontal-bar', 'scatter', 'radar', 'treemap', 'composed', 'funnel', 'sankey', 'gauge'])
  if (!allowed.has(normalizedType)) {
    throw new Error(`Chart.type="${String(node.props.type)}" nao suportado em ${formatNodePath(path)}`)
  }

  ensureObjectProp(node, 'dataQuery', path)
}

function validateQueryNode(node: DashboardTreeNode, path: number[]) {
  if (node.type !== 'Query') return
  const dataQuery = ensureObjectProp(node, 'dataQuery', path)
  if (typeof dataQuery.query !== 'string' || !String(dataQuery.query).trim()) {
    throw new Error(`Query.dataQuery.query obrigatorio em ${formatNodePath(path)}`)
  }
}

function validateTableNode(node: DashboardTreeNode, path: number[]) {
  if (node.type !== 'Table' && node.type !== 'PivotTable') return
  const dataQuery = ensureObjectProp(node, 'dataQuery', path)
  if (typeof dataQuery.query !== 'string' || !String(dataQuery.query).trim()) {
    throw new Error(`${node.type}.dataQuery.query obrigatorio em ${formatNodePath(path)}`)
  }
}

function validateDatePickerNode(node: DashboardTreeNode, path: number[]) {
  if (node.type !== 'DatePicker') return
  ensureStringProp(node, 'field', path)
  ensureStringProp(node, 'table', path)
  const presets = node.props?.presets
  if (!Array.isArray(presets)) return
  for (let index = 0; index < presets.length; index += 1) {
    const preset = String(presets[index] || '').trim()
    if (!SUPPORTED_DATE_PICKER_PRESETS.has(preset)) {
      throw new Error(`DatePicker.presets[${index}]="${preset}" nao suportado em ${formatNodePath(path)}`)
    }
  }
}

function validateFilterNode(node: DashboardTreeNode, path: number[]) {
  if (node.type !== 'Filter') return
  ensureStringProp(node, 'field', path)
  ensureStringProp(node, 'table', path)
}

function validateThemeNode(node: DashboardTreeNode, path: number[]) {
  if (node.type !== 'Theme') return
  ensureStringProp(node, 'name', path)
}

function validateDashboardNode(node: DashboardTreeNode, path: number[]) {
  if (node.type !== 'DashboardTemplate' && node.type !== 'Dashboard') return
  ensureStringProp(node, 'title', path)
  if (node.type === 'Dashboard') ensureStringProp(node, 'id', path)
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
  const type = String(node.type || '').trim()
  const isSupported =
    SUPPORTED_COMPONENTS.has(type) || SUPPORTED_HTML_TAGS.has(type.toLowerCase())

  if (!isSupported) {
    throw new Error(`Componente nao suportado: ${type || 'Unknown'} em ${formatNodePath(path)}`)
  }

  validateThemeNode(node, path)
  validateDashboardNode(node, path)
  validateFilterNode(node, path)
  validateQueryNode(node, path)
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
