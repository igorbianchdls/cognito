import type { ToolkitDefinition } from '@/products/integracoes/shared/types'

export const BANK_TOOLKIT_SLUGS = [
  'ITAU',
  'BRADESCO',
  'BANCO_DO_BRASIL',
  'SANTANDER',
  'CAIXA',
  'NUBANK',
  'BANCO_INTER',
  'BTG_PACTUAL',
  'C6_BANK',
  'SAFRA',
  'SICOOB',
  'SICREDI',
  'BANRISUL',
  'MERCADO_PAGO',
  'PICPAY',
] as const

export const BANK_TOOLKIT_SLUG_SET = new Set<string>(BANK_TOOLKIT_SLUGS)

export const BANK_TOOLKITS: ToolkitDefinition[] = [
  { slug: 'ITAU', name: 'Itaú', description: 'Contas, saldos e transações bancárias via Pluggy.' },
  { slug: 'BRADESCO', name: 'Bradesco', description: 'Contas, saldos e transações bancárias via Pluggy.' },
  { slug: 'BANCO_DO_BRASIL', name: 'Banco do Brasil', description: 'Contas, saldos e transações bancárias via Pluggy.' },
  { slug: 'SANTANDER', name: 'Santander', description: 'Contas, saldos e transações bancárias via Pluggy.' },
  { slug: 'CAIXA', name: 'Caixa', description: 'Contas, saldos e transações bancárias via Pluggy.' },
  { slug: 'NUBANK', name: 'Nubank', description: 'Contas, cartões, saldos e transações via Pluggy.' },
  { slug: 'BANCO_INTER', name: 'Inter', description: 'Contas, cartões, saldos e transações via Pluggy.' },
  { slug: 'BTG_PACTUAL', name: 'BTG Pactual', description: 'Contas, saldos e transações bancárias via Pluggy.' },
  { slug: 'C6_BANK', name: 'C6 Bank', description: 'Contas, cartões, saldos e transações via Pluggy.' },
  { slug: 'SAFRA', name: 'Safra', description: 'Contas, saldos e transações bancárias via Pluggy.' },
  { slug: 'SICOOB', name: 'Sicoob', description: 'Contas, saldos e transações bancárias via Pluggy.' },
  { slug: 'SICREDI', name: 'Sicredi', description: 'Contas, saldos e transações bancárias via Pluggy.' },
  { slug: 'BANRISUL', name: 'Banrisul', description: 'Contas, saldos e transações bancárias via Pluggy.' },
  { slug: 'MERCADO_PAGO', name: 'Mercado Pago', description: 'Conta digital, saldos e transações via Pluggy.' },
  { slug: 'PICPAY', name: 'PicPay', description: 'Carteira digital, saldos e transações via Pluggy.' },
]

export function isBankToolkit(slug: string) {
  return BANK_TOOLKIT_SLUG_SET.has(String(slug || '').toUpperCase())
}
