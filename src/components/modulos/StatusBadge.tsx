import React from 'react'

type StatusBadgeProps = {
  value?: unknown
  type: 'status' | 'prioridade' | 'departamento'
}

export default function StatusBadge({ value, type }: StatusBadgeProps) {
  const valueStr = String(value || '').toLowerCase()

  let bgColor = '#f3f4f6'
  let textColor = '#6b7280'

  if (type === 'status') {
    if (valueStr === 'pago' || valueStr === 'recebido' || valueStr === 'concluída' || valueStr === 'concluida' || valueStr === 'ativo') {
      bgColor = '#dcfce7'
      textColor = '#16a34a'
    } else if (valueStr === 'aberta' || valueStr === 'em aberto') {
      bgColor = '#dbeafe'
      textColor = '#2563eb'
    } else if (valueStr === 'pendente') {
      bgColor = '#fef3c7'
      textColor = '#ca8a04'
    } else if (valueStr === 'vencido' || valueStr === 'atrasado' || valueStr === 'inativo') {
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
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: 9999,
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
