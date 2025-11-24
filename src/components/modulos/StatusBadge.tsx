import React from 'react'

type StatusBadgeProps = {
  value?: unknown
  type:
    | 'status'
    | 'prioridade'
    | 'departamento'
    | 'condicao_pagamento'
    | 'estagio'
    | 'fin_tipo_conta'
    | 'fin_transacao'
    | 'bool'
}

export default function StatusBadge({ value, type }: StatusBadgeProps) {
  const valueStr = String(value || '').toLowerCase()

  let bgColor = '#f3f4f6'
  let textColor = '#6b7280'

  if (type === 'status') {
    if (valueStr === 'pago' || valueStr === 'recebido' || valueStr === 'concluída' || valueStr === 'concluida' || valueStr === 'concluído' || valueStr === 'concluido' || valueStr === 'ativo' || valueStr === 'entregue') {
      bgColor = '#dcfce7'
      textColor = '#16a34a'
    } else if (valueStr === 'aberta' || valueStr === 'em aberto' || valueStr === 'faturado') {
      bgColor = '#dbeafe'
      textColor = '#2563eb'
    } else if (valueStr === 'pendente' || valueStr === 'parcial') {
      bgColor = '#fef3c7'
      textColor = '#ca8a04'
    } else if (valueStr === 'vencido' || valueStr === 'atrasado' || valueStr === 'inativo' || valueStr === 'cancelado') {
      bgColor = '#fee2e2'
      textColor = '#dc2626'
    }
  } else if (type === 'prioridade') {
    if (valueStr === 'alta') {
      bgColor = '#fee2e2'
      textColor = '#dc2626'
    } else if (valueStr === 'média' || valueStr === 'media') {
      bgColor = '#fef3c7'
      textColor = '#ca8a04'
    } else if (valueStr === 'baixa') {
      bgColor = '#dcfce7'
      textColor = '#16a34a'
    }
  } else if (type === 'departamento') {
    if (valueStr === 'comercial') {
      bgColor = '#dbeafe'
      textColor = '#2563eb'
    } else if (valueStr === 'logística' || valueStr === 'logistica') {
      bgColor = '#e9d5ff'
      textColor = '#7c3aed'
    } else if (valueStr === 'financeiro') {
      bgColor = '#dcfce7'
      textColor = '#16a34a'
    } else if (valueStr === 'diretoria') {
      bgColor = '#fef3c7'
      textColor = '#ca8a04'
    }
  } else if (type === 'condicao_pagamento') {
    // Extract number of days from string (e.g., "60 dias" -> 60)
    const match = valueStr.match(/(\d+)/)
    const dias = match ? parseInt(match[1], 10) : 0

    if (valueStr.includes('vista') || valueStr.includes('à vista')) {
      bgColor = '#f3f4f6'
      textColor = '#6b7280'
    } else if (dias >= 60) {
      bgColor = '#dcfce7'
      textColor = '#16a34a'
    } else if (dias >= 30) {
      bgColor = '#fef3c7'
      textColor = '#ca8a04'
    } else if (dias > 0) {
      bgColor = '#fee2e2'
      textColor = '#dc2626'
    }
  } else if (type === 'estagio') {
    // Progressive colors based on sales funnel stage
    if (valueStr.includes('fechado') || valueStr.includes('ganho') || valueStr.includes('ganha')) {
      bgColor = '#dcfce7'
      textColor = '#16a34a'
    } else if (valueStr.includes('proposta') || valueStr.includes('enviada') || valueStr.includes('apresentação') || valueStr.includes('apresentacao')) {
      bgColor = '#dbeafe'
      textColor = '#2563eb'
    } else if (valueStr.includes('negociação') || valueStr.includes('negociacao')) {
      bgColor = '#fef3c7'
      textColor = '#ca8a04'
    } else if (valueStr.includes('perdido') || valueStr.includes('perdida')) {
      bgColor = '#fee2e2'
      textColor = '#dc2626'
    } else {
      // inicial, qualificação, prospecção, etc (gray)
      bgColor = '#f3f4f6'
      textColor = '#6b7280'
    }
  }

  // Finanças: tipo de conta (corrente/poupança)
  if (type === 'fin_tipo_conta') {
    if (valueStr.includes('corr')) {
      bgColor = '#dbeafe'
      textColor = '#2563eb'
    } else if (valueStr.includes('poup')) {
      bgColor = '#ede9fe'
      textColor = '#7c3aed'
    } else {
      bgColor = '#f3f4f6'
      textColor = '#6b7280'
    }
  }

  // Finanças: tipo de transação (crédito/débito)
  if (type === 'fin_transacao') {
    if (valueStr.includes('cred')) {
      bgColor = '#d1fae5'
      textColor = '#047857'
    } else if (valueStr.includes('deb')) {
      bgColor = '#fee2e2'
      textColor = '#dc2626'
    } else {
      bgColor = '#f3f4f6'
      textColor = '#6b7280'
    }
  }

  // Booleano: Sim/Não
  if (type === 'bool') {
    const truthy = valueStr === 'true' || valueStr === 't' || valueStr === '1' || valueStr === 'sim' || valueStr === 'yes'
    if (truthy) {
      bgColor = '#d1fae5'
      textColor = '#047857'
    } else {
      bgColor = '#f3f4f6'
      textColor = '#6b7280'
    }
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {String(value)}
    </span>
  )
}
