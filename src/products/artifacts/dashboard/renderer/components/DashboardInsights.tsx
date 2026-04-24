'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

type AnyRecord = Record<string, any>

type InsightTone = 'danger' | 'success' | 'warning' | 'accent' | 'info'

type InsightItem = {
  title: string
  body: string
  action: string
  tone: InsightTone
  metric?: string
  icon?: 'trendDown' | 'bars' | 'alert' | 'people' | 'mobile'
  fullTitle?: string
  summary?: string
  diagnosis?: string
  impact?: string
  evidence?: string[]
  nextSteps?: string[]
}

const HEADER_ICON = '#6D5DF6'

const V1_INSIGHTS: InsightItem[] = [
  {
    title: 'Queda de receita',
    body: 'A receita diminuiu 18% no Nordeste nos ultimos 7 dias.',
    action: 'Entender motivo',
    tone: 'danger',
    icon: 'trendDown',
    fullTitle: 'Queda de receita no Nordeste',
    summary: 'A receita da regiao Nordeste caiu 18% nos ultimos 7 dias, puxada por menor volume de pedidos e ticket medio menor.',
    diagnosis: 'A queda esta concentrada em clientes recorrentes e em canais com menor investimento recente. O padrao indica uma combinacao de reducao de demanda e menor eficiencia comercial.',
    impact: 'Se o ritmo continuar, a projecao semanal pode ficar abaixo da meta em aproximadamente 12% a 15%.',
    evidence: ['Receita 18% menor vs. periodo anterior.', 'Nordeste concentrou a maior variacao negativa.', 'Ticket medio e volume cairam ao mesmo tempo.'],
    nextSteps: ['Comparar canais de aquisicao na regiao.', 'Revisar campanhas pausadas ou com baixa entrega.', 'Segmentar clientes recorrentes com queda de recompra.'],
  },
  {
    title: 'Melhor desempenho',
    body: 'Google Ads gerou R$ 490k, crescimento de 32%.',
    action: 'Ver detalhe',
    tone: 'success',
    icon: 'bars',
    fullTitle: 'Google Ads com melhor desempenho',
    summary: 'Google Ads gerou R$ 490k no periodo e cresceu 32% em relacao ao periodo anterior.',
    diagnosis: 'O desempenho positivo esta associado a melhor conversao em campanhas de fundo de funil e maior participacao de termos com alta intencao.',
    impact: 'Existe oportunidade de realocar verba para as campanhas com maior ROAS e acelerar a captura de demanda.',
    evidence: ['Receita de R$ 490k atribuida ao canal.', 'Crescimento de 32% vs. periodo anterior.', 'Campanhas principais mantiveram volume sem degradar conversao.'],
    nextSteps: ['Abrir detalhe por campanha.', 'Comparar ROAS por conjunto.', 'Simular aumento gradual de orcamento nos melhores grupos.'],
  },
  {
    title: 'Atencao no ticket medio',
    body: 'Ticket medio caiu 9% entre clientes recorrentes.',
    action: 'Analisar causas',
    tone: 'warning',
    icon: 'alert',
    fullTitle: 'Ticket medio caiu entre clientes recorrentes',
    summary: 'O ticket medio caiu 9% entre clientes recorrentes, mesmo com manutencao parcial do volume de compras.',
    diagnosis: 'A queda sugere mudanca no mix de produtos, maior uso de desconto ou menor compra de itens complementares.',
    impact: 'A margem pode ser pressionada mesmo que o numero de pedidos permaneca estavel.',
    evidence: ['Ticket medio 9% menor.', 'Variacao concentrada em clientes recorrentes.', 'Pedidos continuam ocorrendo, mas com carrinhos menores.'],
    nextSteps: ['Analisar produtos com maior perda de participacao.', 'Revisar descontos aplicados no periodo.', 'Criar oferta de bundle para elevar ticket.'],
  },
  {
    title: 'Oportunidade',
    body: '15% dos clientes podem gerar 35% mais receita.',
    action: 'Ver clientes',
    tone: 'accent',
    icon: 'people',
    fullTitle: 'Clientes com potencial de receita adicional',
    summary: '15% dos clientes apresentam comportamento que pode gerar ate 35% mais receita com a abordagem correta.',
    diagnosis: 'Esses clientes possuem historico de compra consistente, mas ainda nao compram categorias adjacentes ou planos de maior valor.',
    impact: 'A oportunidade estimada e relevante para crescimento sem depender exclusivamente de novos clientes.',
    evidence: ['15% da base concentra potencial de expansao.', 'Possibilidade de ate 35% mais receita.', 'Padroes indicam aderencia a ofertas complementares.'],
    nextSteps: ['Listar clientes por potencial.', 'Criar campanha de cross-sell.', 'Priorizar contas com maior frequencia recente.'],
  },
]

const V5_INSIGHTS: InsightItem[] = [
  {
    title: 'Percebi que sua receita caiu 18% no Nordeste nos ultimos 7 dias. Quer que eu investigue o motivo?',
    body: '',
    action: 'Sim, investigar',
    tone: 'danger',
    fullTitle: 'Investigacao sugerida para queda no Nordeste',
    summary: 'A IA identificou uma queda relevante de receita no Nordeste e sugere investigar canais, produtos e recompra.',
    diagnosis: 'O comportamento aponta para um problema localizado, nao uma queda generalizada do negocio.',
    impact: 'Agir rapidamente pode recuperar parte da receita ainda dentro do periodo atual.',
    evidence: ['Queda de 18% em 7 dias.', 'Regiao Nordeste como principal outlier.', 'Possivel relacao com recompra e ticket medio.'],
    nextSteps: ['Abrir analise por canal.', 'Comparar produtos mais vendidos por regiao.', 'Ver clientes com queda de recompra.'],
  },
  {
    title: 'Otimo! O Google Ads esta performando muito bem, gerando R$ 490k (+32%). Quer ver o detalhamento por campanha?',
    body: '',
    action: 'Ver campanhas',
    tone: 'success',
    fullTitle: 'Campanhas do Google Ads em destaque',
    summary: 'A IA encontrou um padrao positivo em Google Ads, com R$ 490k gerados e crescimento de 32%.',
    diagnosis: 'O canal esta performando acima da media e pode estar capturando melhor a demanda de alta intencao.',
    impact: 'Oportunidade de escalar campanhas vencedoras com menor risco operacional.',
    evidence: ['R$ 490k de receita atribuida.', 'Crescimento de 32%.', 'Melhor desempenho frente aos demais canais.'],
    nextSteps: ['Ver campanhas por ROAS.', 'Comparar criativos ativos.', 'Avaliar aumento controlado de budget.'],
  },
  {
    title: 'Notei que o ticket medio caiu 9% entre clientes recorrentes. Quer que eu analise os produtos que mais impactaram?',
    body: '',
    action: 'Analisar produtos',
    tone: 'warning',
    fullTitle: 'Analise recomendada do ticket medio',
    summary: 'A IA detectou queda de 9% no ticket medio entre clientes recorrentes e recomenda analisar o mix de produtos.',
    diagnosis: 'Clientes continuam comprando, mas com menor valor por pedido. Isso pode indicar mix menos premium ou perda de itens complementares.',
    impact: 'A receita pode cair mesmo sem perda forte de volume, reduzindo eficiencia comercial.',
    evidence: ['Ticket medio 9% menor.', 'Clientes recorrentes afetados.', 'Possivel mudanca de mix.'],
    nextSteps: ['Abrir ranking de produtos por variacao.', 'Analisar desconto medio.', 'Criar recomendacao de upsell.'],
  },
  {
    title: 'Identifiquei 15% dos clientes com potencial para gerar 35% mais receita. Quer ver quem sao eles?',
    body: '',
    action: 'Ver clientes',
    tone: 'accent',
    fullTitle: 'Clientes com maior potencial de expansao',
    summary: 'A IA identificou um grupo de clientes que pode gerar 35% mais receita com a oferta certa.',
    diagnosis: 'Esse grupo demonstra engajamento e historico de compra suficiente para campanhas de expansao.',
    impact: 'Pode ser uma alavanca rapida de crescimento com custo menor do que aquisicao.',
    evidence: ['15% dos clientes com alto potencial.', 'Estimativa de 35% mais receita.', 'Base ja possui relacionamento ativo.'],
    nextSteps: ['Ver lista priorizada.', 'Criar campanha de expansao.', 'Acionar clientes com maior propensao.'],
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

function InsightDetailModal({
  item,
  variant,
  onClose,
  onContinue,
}: {
  item: InsightItem
  variant: 'v1' | 'v5'
  onClose: () => void
  onContinue?: () => void
}) {
  const tokens = toneTokens(item.tone)
  const title = item.fullTitle || item.title
  const summary = item.summary || item.body || item.title
  const diagnosis = item.diagnosis || 'Este insight foi identificado a partir dos dados recentes do dashboard.'
  const impact = item.impact || 'Acompanhe este indicador para entender o impacto nos proximos periodos.'
  const evidence = item.evidence?.length ? item.evidence : ['Mudanca detectada nos dados recentes.', 'Insight priorizado pela relevancia para o negocio.']
  const nextSteps = item.nextSteps?.length ? item.nextSteps : ['Abrir analise detalhada.', 'Comparar com periodo anterior.', 'Definir proxima acao.']
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!isMounted) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(15, 23, 42, 0.34)',
        backdropFilter: 'blur(5px)',
      }}
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          width: 'min(760px, 100%)',
          maxHeight: 'min(82vh, 720px)',
          overflow: 'auto',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.72)',
          background: '#FFFFFF',
          boxShadow: '0 24px 80px rgba(15, 23, 42, 0.24)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 18,
            padding: '24px 26px 18px',
            borderBottom: '1px solid #EEF0F6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                height: 42,
                width: 42,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 14,
                background: tokens.iconBg,
                color: tokens.text,
              }}
            >
              <SparkHeaderIcon />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, color: '#111827', fontSize: 22, lineHeight: 1.2, fontWeight: 750 }}>
                  {title}
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 999,
                    background: tokens.chipBg,
                    color: tokens.text,
                    padding: '4px 9px',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {variant === 'v5' ? 'IA' : 'Insight'}
                </span>
              </div>
              <p style={{ margin: '8px 0 0', color: '#667085', fontSize: 14, lineHeight: 1.5 }}>
                {summary}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            style={{
              display: 'flex',
              height: 34,
              width: 34,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid #E5E7EB',
              borderRadius: 999,
              background: '#FFFFFF',
              color: '#667085',
              cursor: 'pointer',
            }}
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M4 4l8 8" />
              <path d="M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18, padding: 26 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <section>
              <h3 style={{ margin: 0, color: '#1F2937', fontSize: 14, fontWeight: 800 }}>Diagnostico</h3>
              <p style={{ margin: '8px 0 0', color: '#475467', fontSize: 14, lineHeight: 1.7 }}>{diagnosis}</p>
            </section>
            <section>
              <h3 style={{ margin: 0, color: '#1F2937', fontSize: 14, fontWeight: 800 }}>Impacto esperado</h3>
              <p style={{ margin: '8px 0 0', color: '#475467', fontSize: 14, lineHeight: 1.7 }}>{impact}</p>
            </section>
            <section
              style={{
                borderRadius: 18,
                border: `1px solid ${tokens.border}`,
                background: tokens.cardBg,
                padding: 16,
              }}
            >
              <h3 style={{ margin: 0, color: tokens.text, fontSize: 14, fontWeight: 800 }}>Proximos passos</h3>
              <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {nextSteps.map((step) => (
                  <li key={step} style={{ display: 'flex', gap: 9, color: '#344054', fontSize: 14, lineHeight: 1.45 }}>
                    <span style={{ marginTop: 7, height: 6, width: 6, flexShrink: 0, borderRadius: 999, background: tokens.text }} />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside
            style={{
              borderRadius: 18,
              border: '1px solid #ECEFF5',
              background: '#F8FAFC',
              padding: 16,
            }}
          >
            <h3 style={{ margin: 0, color: '#1F2937', fontSize: 14, fontWeight: 800 }}>Evidencias</h3>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {evidence.map((entry) => (
                <div
                  key={entry}
                  style={{
                    borderRadius: 14,
                    border: '1px solid #E5EAF3',
                    background: '#FFFFFF',
                    padding: '11px 12px',
                    color: '#475467',
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  {entry}
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '0 26px 24px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: 999,
              background: '#FFFFFF',
              color: '#344054',
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={onContinue}
            style={{
              border: 'none',
              borderRadius: 999,
              background: tokens.text,
              color: '#FFFFFF',
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 800,
              cursor: onContinue ? 'pointer' : 'default',
            }}
          >
            Continuar analise
          </button>
        </div>
      </div>
    </div>,
    document.body,
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
  const contentStyle = (props.style || {}) as React.CSSProperties
  const subtitleStyle = (props.textStyle || {}) as React.CSSProperties
  const [selectedInsight, setSelectedInsight] = React.useState<InsightItem | null>(null)

  function openInsightDetail(item: InsightItem) {
    setSelectedInsight(item)
    onAction?.({ type: 'insightDetailOpen', variant, action: item.action, title: item.title })
  }

  return (
    <>
      <div
        style={{
          width: '100%',
          ...contentStyle,
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
                onAction={openInsightDetail}
              />
            ) : (
              <V1Card
                key={item.title}
                item={item}
                onAction={openInsightDetail}
              />
            ),
          )}
        </div>
      </div>

      {selectedInsight ? (
        <InsightDetailModal
          item={selectedInsight}
          variant={variant}
          onClose={() => setSelectedInsight(null)}
          onContinue={() => {
            onAction?.({ type: 'insightContinueAnalysis', variant, action: selectedInsight.action, title: selectedInsight.title })
            setSelectedInsight(null)
          }}
        />
      ) : null}
    </>
  )
}
