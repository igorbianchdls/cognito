import { createElement, type ReactNode } from 'react'
import { SiHubspot, SiTotvs } from '@icons-pack/react-simple-icons'
import {
  BadgeDollarSign,
  Bell,
  CalendarClock,
  Database,
  FileText,
  Megaphone,
  ShoppingCart,
  Table2,
  Zap,
} from 'lucide-react'

export type ToolTone = 'erp' | 'crm' | 'ecommerce' | 'marketing' | 'sql' | 'neutral'

type ToolVisual = {
  label: string
  icon: ReactNode
  tone: ToolTone
}

const moneyWords = [
  'amount',
  'custo',
  'faturamento',
  'gasto',
  'liquido',
  'lucro',
  'preco',
  'receita',
  'saldo',
  'ticket',
  'total',
  'valor',
]

const dateWords = ['date', 'data', 'dt_', '_dt', 'vencimento']

export function humanizeKey(value: string) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase())
}

export function isMoneyKey(key: string) {
  const normalized = key.toLowerCase()
  return moneyWords.some((word) => normalized.includes(word))
}

export function isDateKey(key: string) {
  const normalized = key.toLowerCase()
  return dateWords.some((word) => normalized.includes(word))
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value)
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(value: unknown) {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatCellValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Nao'
  if (typeof value === 'number') return isMoneyKey(key) ? formatCurrency(value) : formatNumber(value)
  if (isDateKey(key)) return formatDate(value)
  return String(value)
}

export function getToolLabel(tool?: string) {
  if (tool === 'erp') return 'ERP'
  if (tool === 'erp_acoes') return 'ERP Acoes'
  if (tool === 'crm') return 'CRM'
  if (tool === 'data_catalog') return 'Catalogo de Dados'
  if (tool === 'analysis') return 'Analise'
  if (tool === 'table') return 'Tabela'
  if (tool === 'actions') return 'Acoes'
  if (tool === 'alerts') return 'Alertas'
  if (tool === 'schedules') return 'Agendamentos'
  if (tool === 'sql' || tool === 'sql_execution') return 'SQL'
  if (tool === 'ecommerce') return 'Ecommerce'
  if (tool === 'marketing') return 'Marketing'
  return humanizeKey(tool || 'Resultado')
}

export function getToolVisual(tool?: string): ToolVisual {
  if (tool === 'erp' || tool === 'erp_acoes') {
    return { label: 'ERP', icon: createElement(SiTotvs, { size: 23, color: 'default', title: 'TOTVS logo' }), tone: 'erp' }
  }
  if (tool === 'crm') {
    return { label: 'CRM', icon: createElement(SiHubspot, { size: 21, color: 'default', title: 'HubSpot logo' }), tone: 'crm' }
  }
  if (tool === 'ecommerce') return { label: 'Ecommerce', icon: createElement(ShoppingCart, { size: 19, strokeWidth: 2.4 }), tone: 'ecommerce' }
  if (tool === 'marketing') return { label: 'Marketing', icon: createElement(Megaphone, { size: 19, strokeWidth: 2.4 }), tone: 'marketing' }
  if (tool === 'data_catalog') return { label: 'Catalogo de Dados', icon: createElement(Database, { size: 19, strokeWidth: 2.4 }), tone: 'sql' }
  if (tool === 'analysis') return { label: 'Analise', icon: createElement(FileText, { size: 19, strokeWidth: 2.4 }), tone: 'neutral' }
  if (tool === 'table') return { label: 'Tabela', icon: createElement(Table2, { size: 19, strokeWidth: 2.4 }), tone: 'sql' }
  if (tool === 'actions') return { label: 'Acoes', icon: createElement(Zap, { size: 19, strokeWidth: 2.4 }), tone: 'marketing' }
  if (tool === 'alerts') return { label: 'Alertas', icon: createElement(Bell, { size: 19, strokeWidth: 2.4 }), tone: 'marketing' }
  if (tool === 'schedules') return { label: 'Agendamentos', icon: createElement(CalendarClock, { size: 19, strokeWidth: 2.4 }), tone: 'crm' }
  if (tool === 'sql' || tool === 'sql_execution') return { label: 'SQL', icon: createElement(Database, { size: 19, strokeWidth: 2.4 }), tone: 'sql' }
  return { label: humanizeKey(tool || 'Resultado'), icon: createElement(BadgeDollarSign, { size: 19, strokeWidth: 2.4 }), tone: 'neutral' }
}
