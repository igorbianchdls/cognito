'use client'

import * as React from 'react'

type AnyRecord = Record<string, any>

type InsightTone = 'danger' | 'success' | 'warning' | 'accent' | 'info'

type InsightItem = {
  title: string
  body: string
  action: string
  tone: InsightTone
  metric?: string
  icon?: 'trendDown' | 'bars' | 'alert' | 'people' | 'mobile'
}

const HEADER_ICON = '#6D5DF6'

const V1_INSIGHTS: InsightItem[] = [
  {
    title: 'Queda de receita',
    body: 'A receita diminuiu 18% no Nordeste nos ultimos 7 dias.',
    action: 'Entender motivo',
    tone: 'danger',
    icon: 'trendDown',
  },
  {
    title: 'Melhor desempenho',
    body: 'Google Ads gerou R$ 490k, crescimento de 32%.',
    action: 'Ver detalhe',
    tone: 'success',
    icon: 'bars',
  },
  {
    title: 'Atencao no ticket medio',
    body: 'Ticket medio caiu 9% entre clientes recorrentes.',
    action: 'Analisar causas',
    tone: 'warning',
    icon: 'alert',
  },
  {
    title: 'Oportunidade',
    body: '15% dos clientes podem gerar 35% mais receita.',
    action: 'Ver clientes',
    tone: 'accent',
    icon: 'people',
  },
]

const V5_INSIGHTS: InsightItem[] = [
  {
    title: 'Percebi que sua receita caiu 18% no Nordeste nos ultimos 7 dias. Quer que eu investigue o motivo?',
    body: '',
    action: 'Sim, investigar',
    tone: 'danger',
  },
  {
    title: 'Otimo! O Google Ads esta performando muito bem, gerando R$ 490k (+32%). Quer ver o detalhamento por campanha?',
    body: '',
    action: 'Ver campanhas',
    tone: 'success',
  },
  {
    title: 'Notei que o ticket medio caiu 9% entre clientes recorrentes. Quer que eu analise os produtos que mais impactaram?',
    body: '',
    action: 'Analisar produtos',
    tone: 'warning',
  },
  {
    title: 'Identifiquei 15% dos clientes com potencial para gerar 35% mais receita. Quer ver quem sao eles?',
    body: '',
    action: 'Ver clientes',
    tone: 'accent',
  },
]

function toneTokens(tone: InsightTone) {
  switch (tone) {
    case 'danger':
      return {
        text: '#FF3B30',
        softText: '#FF5A52',
        chipBg: '#FFF1F0',
        cardBg: '#FFF9F8',
        border: '#FFE5E2',
        iconBg: '#FFF2F1',
      }
    case 'success':
      return {
        text: '#14AE78',
        softText: '#1DBF89',
        chipBg: '#EAFBF3',
        cardBg: '#FBFEFC',
        border: '#DFF5E8',
        iconBg: '#F1FBF6',
      }
    case 'warning':
      return {
        text: '#FF7A00',
        softText: '#FF9B3D',
        chipBg: '#FFF4E9',
        cardBg: '#FFFDFC',
        border: '#FFEBD8',
        iconBg: '#FFF6EE',
      }
    case 'info':
      return {
        text: '#2D73FF',
        softText: '#5B92FF',
        chipBg: '#EFF5FF',
        cardBg: '#FBFDFF',
        border: '#DFEAFF',
        iconBg: '#F4F8FF',
      }
    default:
      return {
        text: '#6D5DF6',
        softText: '#9D8FFF',
        chipBg: '#F3F0FF',
        cardBg: '#FCFBFF',
        border: '#E9E4FF',
        iconBg: '#F7F5FF',
      }
  }
}

function SparkHeaderIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M10 1.8 11.5 6l4.2 1.5-4.2 1.5L10 13.2 8.5 9 4.3 7.5 8.5 6 10 1.8Z" fill={HEADER_ICON} />
      <path d="M15.9 10.8 16.8 13l2.2.9-2.2.8-.9 2.3-.8-2.3-2.3-.8 2.3-.9.8-2.2Z" fill={HEADER_ICON} opacity="0.7" />
      <path d="M4.2 11.7 5 13.8l2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z" fill={HEADER_ICON} opacity="0.7" />
    </svg>
  )
}

function InsightVisual({ tone, icon }: { tone: InsightTone; icon?: InsightItem['icon'] }) {
  const tokens = toneTokens(tone)

  if (icon === 'bars') {
    return (
      <svg viewBox="0 0 72 46" width="72" height="46" fill="none" aria-hidden="true">
        <rect x="8" y="16" width="6" height="22" rx="3" fill={tokens.softText} opacity="0.45" />
        <rect x="24" y="24" width="6" height="14" rx="3" fill={tokens.softText} opacity="0.6" />
        <rect x="40" y="28" width="6" height="10" rx="3" fill={tokens.softText} opacity="0.75" />
        <rect x="56" y="11" width="6" height="27" rx="3" fill={tokens.softText} />
      </svg>
    )
  }

  if (icon === 'people') {
    return (
      <svg viewBox="0 0 72 46" width="72" height="46" fill="none" aria-hidden="true">
        <circle cx="27" cy="16" r="4.5" stroke={tokens.softText} strokeWidth="2" />
        <circle cx="45" cy="16" r="4.5" stroke={tokens.softText} strokeWidth="2" />
        <circle cx="36" cy="11" r="5" stroke={tokens.softText} strokeWidth="2" />
        <path d="M18 33c0-5.3 4.4-9.5 9.8-9.5" stroke={tokens.softText} strokeWidth="2" strokeLinecap="round" />
        <path d="M54 33c0-5.3-4.4-9.5-9.8-9.5" stroke={tokens.softText} strokeWidth="2" strokeLinecap="round" />
        <path d="M28 34c0-5.9 4.1-10.4 8-10.4s8 4.5 8 10.4" stroke={tokens.softText} strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  if (icon === 'mobile') {
    return (
      <svg viewBox="0 0 72 46" width="72" height="46" fill="none" aria-hidden="true">
        <rect x="27" y="6" width="18" height="32" rx="4" stroke={tokens.softText} strokeWidth="2" />
        <path d="M32 11h8" stroke={tokens.softText} strokeWidth="2" strokeLinecap="round" />
        <circle cx="36" cy="33" r="1.5" fill={tokens.softText} />
      </svg>
    )
  }

  if (icon === 'alert') {
    return (
      <svg viewBox="0 0 72 46" width="72" height="46" fill="none" aria-hidden="true">
        <path d="M8 31 18 16l8 4 10-10 9 14 10-8 7 15" stroke={tokens.softText} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="16" r="2.4" fill={tokens.softText} />
        <circle cx="26" cy="20" r="2.4" fill={tokens.softText} />
        <circle cx="36" cy="10" r="2.4" fill={tokens.softText} />
        <circle cx="45" cy="24" r="2.4" fill={tokens.softText} />
        <circle cx="55" cy="16" r="2.4" fill={tokens.softText} />
        <circle cx="62" cy="31" r="2.4" fill={tokens.softText} />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 72 46" width="72" height="46" fill="none" aria-hidden="true">
      <path d="M8 14 18 24l9-2 10 11 12-18 13 10" stroke={tokens.softText} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="24" r="2.4" fill={tokens.softText} />
      <circle cx="27" cy="22" r="2.4" fill={tokens.softText} />
      <circle cx="37" cy="33" r="2.4" fill={tokens.softText} />
      <circle cx="49" cy="15" r="2.4" fill={tokens.softText} />
      <circle cx="62" cy="25" r="2.4" fill={tokens.softText} />
    </svg>
  )
}

function HeaderAction({
  label,
  onClick,
}: {
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: 0,
        border: 'none',
        background: 'transparent',
        color: '#695BFF',
        fontSize: 14,
        fontWeight: 600,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span>{label}</span>
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3.5 8h9" />
        <path d="m9 3.5 4.5 4.5L9 12.5" />
      </svg>
    </button>
  )
}

function V1Card({ item, onAction }: { item: InsightItem; onAction?: (item: InsightItem) => void }) {
  const tokens = toneTokens(item.tone)
  return (
    <div
      style={{
        display: 'flex',
        minHeight: 112,
        alignItems: 'stretch',
        gap: 14,
        borderRadius: 16,
        border: `1px solid ${tokens.border}`,
        background: tokens.cardBg,
        padding: '14px 16px',
      }}
    >
      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ color: tokens.text, fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
          {item.title}
        </div>
        <div style={{ marginTop: 10, color: '#26324B', fontSize: 14, lineHeight: 1.45 }}>
          {item.body}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <button
            type="button"
            onClick={() => onAction?.(item)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: 'none',
              borderRadius: 999,
              background: tokens.chipBg,
              color: tokens.text,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 600,
              cursor: onAction ? 'pointer' : 'default',
            }}
          >
            {item.action}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', width: 78, alignItems: 'center', justifyContent: 'center' }}>
        <InsightVisual tone={item.tone} icon={item.icon} />
      </div>
    </div>
  )
}

function highlightConversation(text: string, tone: InsightTone) {
  const tokens = toneTokens(tone)
  const emphasis = [
    'receita caiu 18%',
    'Nordeste',
    'R$ 490k (+32%)',
    'ticket medio caiu 9%',
    '15% dos clientes',
    '35% mais receita',
    'mobile caiu 12%',
  ]

  return text.split(new RegExp(`(${emphasis.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')).map((part, index) => {
    const normalized = part.trim().toLowerCase()
    const isHighlight = emphasis.some((item) => item.toLowerCase() === normalized)
    if (!isHighlight) return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    return (
      <span key={`${part}-${index}`} style={{ color: tokens.text, fontWeight: 700 }}>
        {part}
      </span>
    )
  })
}

function V5Card({ item, onAction }: { item: InsightItem; onAction?: (item: InsightItem) => void }) {
  const tokens = toneTokens(item.tone)
  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${tokens.border}`,
        background: tokens.cardBg,
        padding: '16px 18px 14px',
      }}
    >
      <div style={{ color: '#2B3550', fontSize: 14, lineHeight: 1.65 }}>
        {highlightConversation(item.title, item.tone)}
      </div>
      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={() => onAction?.(item)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: 'none',
            borderRadius: 999,
            background: '#FFFFFF',
            boxShadow: 'inset 0 0 0 1px rgba(109,93,246,0.12)',
            color: tokens.text,
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 700,
            cursor: onAction ? 'pointer' : 'default',
          }}
        >
          <span>{item.action}</span>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3.5 8h9" />
            <path d="m9 3.5 4.5 4.5L9 12.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function DashboardInsights({
  element,
  onAction,
}: {
  element?: AnyRecord
  onAction?: (action: AnyRecord) => void
}) {
  const props = (element?.props || {}) as AnyRecord
  const variant = String(props.variant || props.version || 'v1').toLowerCase() === 'v5' ? 'v5' : 'v1'
  const title = typeof props.title === 'string' && props.title.trim() ? props.title : variant === 'v5' ? 'Alfred encontrou alguns insights importantes' : 'Insights principais'
  const description =
    typeof props.description === 'string' && props.description.trim()
      ? props.description
      : variant === 'v5'
        ? 'Analise automatica dos seus dados mais recentes.'
        : 'Resumo inteligente do que mais importa no seu negocio.'
  const headerActionLabel =
    typeof props.headerActionLabel === 'string' && props.headerActionLabel.trim()
      ? props.headerActionLabel
      : variant === 'v5'
        ? 'Perguntar a IA'
        : 'Ver todos os insights'
  const items = variant === 'v5' ? V5_INSIGHTS : V1_INSIGHTS
  const containerStyle = (props.style || {}) as React.CSSProperties
  const subtitleStyle = (props.textStyle || {}) as React.CSSProperties

  return (
    <section
      style={{
        gridColumn: '1 / -1',
        width: '100%',
        borderRadius: 20,
        border: '1px solid #ECEAF6',
        background: '#FFFFFF',
        padding: '18px 20px 16px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        ...containerStyle,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ marginTop: 1, display: 'flex', height: 22, width: 22, alignItems: 'center', justifyContent: 'center' }}>
            <SparkHeaderIcon />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ margin: 0, color: '#1F2947', fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                {title}
              </h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 999,
                  background: '#F2EEFF',
                  color: '#6B5CFF',
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                }}
              >
                BETA
              </span>
            </div>
            <p
              style={{
                margin: '6px 0 0',
                color: '#737C93',
                fontSize: 14,
                lineHeight: 1.4,
                ...subtitleStyle,
              }}
            >
              {description}
            </p>
          </div>
        </div>

        <HeaderAction
          label={headerActionLabel}
          onClick={() => onAction?.({ type: 'insightsHeaderAction', variant })}
        />
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: variant === 'v5' ? 'repeat(4, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
          gap: 14,
        }}
      >
        {items.map((item) =>
          variant === 'v5' ? (
            <V5Card
              key={item.title}
              item={item}
              onAction={() => onAction?.({ type: 'insightAction', variant, action: item.action, title: item.title })}
            />
          ) : (
            <V1Card
              key={item.title}
              item={item}
              onAction={() => onAction?.({ type: 'insightAction', variant, action: item.action, title: item.title })}
            />
          ),
        )}
      </div>
    </section>
  )
}
