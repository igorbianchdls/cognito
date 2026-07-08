import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import {
  ChatGptActionRow,
  ChatGptFlowAssistantText,
  ChatGptFlowUserBubble,
  ChatGptMobileShell,
  ChatGptToolCallCard,
  ChatGptToolResultCard,
  CHATGPT_MOBILE_FONT_STACK,
  OttoAssistantHeader,
  chatGptSequenceStyle,
  fastCharacterTyping,
} from '@/assets/remotion/compositions/ChatGptMobileBase'
import BlingIcon from '@/components/icons/BlingIcon'
import ContaAzulIcon from '@/components/icons/ContaAzulIcon'
import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon'
import MercadoLivreIcon from '@/components/icons/MercadoLivreIcon'
import MetaIcon from '@/components/icons/MetaIcon'
import ShopifyIcon from '@/components/icons/ShopifyIcon'

type OrbitIntegration = {
  accent: string
  icon: ComponentType<{ className?: string }>
  label: string
}

const orbitIntegrations: OrbitIntegration[] = [
  { accent: '#1877f2', icon: MetaIcon, label: 'Meta' },
  { accent: '#4285f4', icon: GoogleAdsIcon, label: 'Google Ads' },
  { accent: '#1474c4', icon: ContaAzulIcon, label: 'Conta Azul' },
  { accent: '#95bf47', icon: ShopifyIcon, label: 'Shopify' },
  { accent: '#ffe000', icon: MercadoLivreIcon, label: 'Mercado Livre' },
  { accent: '#16a34a', icon: BlingIcon, label: 'Bling' },
]

export const CHATGPT_FINANCIAL_AGENTS_VIDEO_DURATION = 1820

type FinancialAgentStep = {
  insight: string
  result: 'cash' | 'collections' | 'docs' | 'expenses' | 'margin' | 'reconcile' | 'timeline'
  text: string
  toolName: string
}

export const financialAgentSteps: FinancialAgentStep[] = [
  {
    insight: 'Organizei despesas por categoria e destaquei lancamentos fora do padrao.',
    result: 'expenses',
    text: 'Primeiro vou acionar o agente de despesas para classificar gastos e excecoes.',
    toolName: 'classificar_despesas',
  },
  {
    insight: 'Conciliei bancos, cartoes e movimentacoes. Separei 3 itens para revisao.',
    result: 'reconcile',
    text: 'Agora vou acionar o agente de conciliacao para cruzar banco, cartoes e ERP.',
    toolName: 'conciliar_bancos_cartoes',
  },
  {
    insight: 'Montei uma visao de caixa com saldo, vencimentos e tendencia dos proximos dias.',
    result: 'cash',
    text: 'Vou transformar os dados em dashboard, relatorios e analise do caixa.',
    toolName: 'gerar_dashboard_caixa',
  },
  {
    insight: 'Identifiquei pagamentos concentrados e recebiveis que merecem acompanhamento.',
    result: 'timeline',
    text: 'Tambem vou monitorar contas a pagar, contas a receber e fluxo de caixa.',
    toolName: 'monitorar_fluxo_caixa',
  },
  {
    insight: 'Organizei notas, documentos e obrigacoes financeiras por prioridade.',
    result: 'docs',
    text: 'Agora vou revisar documentos, notas fiscais e obrigacoes financeiras.',
    toolName: 'organizar_documentos_fiscais',
  },
  {
    insight: 'Priorizei clientes em atraso e preparei sugestoes de cobranca.',
    result: 'collections',
    text: 'Vou acompanhar clientes em atraso e sugerir as cobrancas mais importantes.',
    toolName: 'priorizar_cobrancas',
  },
  {
    insight: 'Encontrei onde sua empresa pode economizar, reduzir perdas e aumentar margem.',
    result: 'margin',
    text: 'Por fim, vou procurar perdas, economias e decisoes que aumentam margem.',
    toolName: 'identificar_oportunidades_margem',
  },
]

function ChatGptFinancialAssistantText({ children, showHeader = true, style }: { children: ReactNode; showHeader?: boolean; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        color: '#111111',
        fontFamily: CHATGPT_MOBILE_FONT_STACK,
        fontSize: 38,
        fontWeight: 400,
        letterSpacing: 0,
        lineHeight: 1.34,
        padding: '0 36px',
      }}
    >
      {showHeader ? <OttoAssistantHeader /> : null}
      {fastCharacterTyping(children, style)}
    </div>
  )
}

function FinancialResultCard({ kind, startFrame }: { kind: FinancialAgentStep['result']; startFrame: number }) {
  const frame = useCurrentFrame()
  const local = Math.max(0, frame - startFrame)
  const grow = (delay: number) => interpolate(local, [delay, delay + 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  if (kind === 'expenses') {
    const rows = [
      ['Google Ads', 'Marketing', 'R$ 18.400'],
      ['AWS Brasil', 'Software', 'R$ 12.790'],
      ['Frete Sul', 'Logistica', 'R$ 8.420'],
    ]
    return (
      <div style={{ display: 'grid', gap: 10, padding: 18 }}>
        {rows.map(([vendor, category, amount], index) => (
          <div key={vendor} style={{ alignItems: 'center', background: '#f8fafc', border: '1px solid #edf1f5', borderRadius: 14, display: 'grid', gridTemplateColumns: '1fr auto', opacity: grow(index * 8), padding: '12px 14px' }}>
            <div style={{ display: 'grid', gap: 4 }}>
              <strong style={{ color: '#111111', fontSize: 22, letterSpacing: 0 }}>{vendor}</strong>
              <span style={{ color: '#667085', fontSize: 17, fontWeight: 650 }}>{category}</span>
            </div>
            <strong style={{ color: '#225f42', fontSize: 21, letterSpacing: 0 }}>{amount}</strong>
          </div>
        ))}
      </div>
    )
  }

  if (kind === 'reconcile') {
    return (
      <div style={{ display: 'grid', gap: 12, padding: 18 }}>
        {['PIX Cliente Norte', 'Cartao Stone', 'Tarifa bancaria'].map((item, index) => (
          <div key={item} style={{ alignItems: 'center', display: 'grid', gap: 10, gridTemplateColumns: '1fr 34px 1fr', opacity: grow(index * 9) }}>
            <span style={{ background: '#f8fafc', border: '1px solid #e8edf3', borderRadius: 12, color: '#111111', fontSize: 18, fontWeight: 720, padding: '11px 12px' }}>{item}</span>
            <span style={{ alignItems: 'center', background: index === 2 ? '#fef3c7' : '#dcfce7', borderRadius: 999, color: index === 2 ? '#a16207' : '#166534', display: 'flex', fontSize: 18, fontWeight: 900, height: 34, justifyContent: 'center', width: 34 }}>{index === 2 ? '!' : '✓'}</span>
            <span style={{ background: '#f8fafc', border: '1px solid #e8edf3', borderRadius: 12, color: '#111111', fontSize: 18, fontWeight: 720, padding: '11px 12px' }}>ERP #{index + 9031}</span>
          </div>
        ))}
      </div>
    )
  }

  if (kind === 'cash') {
    const values = [62, 82, 70, 104, 92, 128]
    return (
      <div style={{ display: 'grid', gap: 15, padding: 18 }}>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {['Saldo R$ 418k', 'Receber R$ 96k', 'Pagar R$ 72k'].map((item, index) => (
            <div key={item} style={{ background: '#f8fafc', border: '1px solid #e8edf3', borderRadius: 13, color: index === 0 ? '#225f42' : '#111111', fontSize: 17, fontWeight: 820, opacity: grow(index * 6), padding: 12 }}>{item}</div>
          ))}
        </div>
        <div style={{ alignItems: 'end', borderBottom: '1px solid #dfe7e1', display: 'flex', gap: 10, height: 132, paddingTop: 4 }}>
          {values.map((height, index) => <span key={height} style={{ background: index > 3 ? '#225f42' : '#dce3df', borderRadius: 9, flex: 1, height: height * grow(14 + index * 4) }} />)}
        </div>
      </div>
    )
  }

  if (kind === 'timeline') {
    return (
      <div style={{ display: 'grid', gap: 11, padding: 18 }}>
        {['Hoje: fornecedores R$ 31k', '7 dias: impostos R$ 42k', '12 dias: receber R$ 96k'].map((item, index) => (
          <div key={item} style={{ alignItems: 'center', display: 'grid', gap: 12, gridTemplateColumns: '20px 1fr auto', opacity: grow(index * 9) }}>
            <span style={{ background: index === 1 ? '#f59e0b' : '#225f42', borderRadius: 999, height: 20, width: 20 }} />
            <span style={{ color: '#111111', fontSize: 21, fontWeight: 720 }}>{item}</span>
            <span style={{ background: '#f1f5f9', borderRadius: 999, color: '#475569', fontSize: 16, fontWeight: 780, padding: '7px 10px' }}>{index === 1 ? 'alerta' : 'ok'}</span>
          </div>
        ))}
      </div>
    )
  }

  if (kind === 'docs') {
    return (
      <div style={{ display: 'grid', gap: 10, padding: 18 }}>
        {['NF 4821.pdf', 'boleto_fornecedor.xml', 'contrato_frete.pdf'].map((item, index) => (
          <div key={item} style={{ alignItems: 'center', background: '#f8fafc', border: '1px solid #e8edf3', borderRadius: 13, display: 'flex', justifyContent: 'space-between', opacity: grow(index * 8), padding: '12px 14px' }}>
            <span style={{ color: '#111111', fontSize: 20, fontWeight: 740 }}>{item}</span>
            <span style={{ color: index === 1 ? '#a16207' : '#166534', fontSize: 17, fontWeight: 820 }}>{index === 1 ? 'pendente' : 'validado'}</span>
          </div>
        ))}
      </div>
    )
  }

  if (kind === 'collections') {
    return (
      <div style={{ display: 'grid', gap: 10, padding: 18 }}>
        {['Cliente Norte · 18 dias · R$ 42k', 'Rede Alpha · 9 dias · R$ 18k', 'Loja Prime · 6 dias · R$ 11k'].map((item, index) => (
          <div key={item} style={{ alignItems: 'center', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 13, display: 'flex', justifyContent: 'space-between', opacity: grow(index * 8), padding: '12px 14px' }}>
            <span style={{ color: '#111111', fontSize: 19, fontWeight: 740 }}>{item}</span>
            <span style={{ color: '#c2410c', fontSize: 17, fontWeight: 840 }}>cobrar</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr', padding: 18 }}>
      {['Economia R$ 18.4k', 'Margem +4.2 p.p.', 'ROAS baixo', 'Frete acima'].map((item, index) => (
        <div key={item} style={{ background: index < 2 ? '#ecfdf3' : '#fff7ed', border: `1px solid ${index < 2 ? '#bbf7d0' : '#fed7aa'}`, borderRadius: 14, color: index < 2 ? '#166534' : '#c2410c', fontSize: 20, fontWeight: 840, opacity: grow(index * 7), padding: 14 }}>
          {item}
        </div>
      ))}
    </div>
  )
}

function ResultBadge({ children, tone = 'neutral' }: { children: string; tone?: 'blue' | 'green' | 'neutral' | 'orange' | 'red' }) {
  const styles = {
    blue: { background: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
    green: { background: '#ecfdf3', border: '#bbf7d0', color: '#166534' },
    neutral: { background: '#f8fafc', border: '#e2e8f0', color: '#475569' },
    orange: { background: '#fff7ed', border: '#fed7aa', color: '#c2410c' },
    red: { background: '#fef2f2', border: '#fecaca', color: '#b91c1c' },
  }[tone]

  return (
    <span style={{ background: styles.background, border: `1px solid ${styles.border}`, borderRadius: 999, color: styles.color, display: 'inline-flex', fontSize: 14, fontWeight: 820, justifyContent: 'center', lineHeight: 1, padding: '7px 9px', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function ResultShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 16, boxShadow: '0 12px 34px rgba(15, 23, 42, 0.06)', overflow: 'hidden' }}>
      <div style={{ alignItems: 'center', background: '#fbfcfd', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', padding: '12px 14px' }}>
        <strong style={{ color: '#111827', fontSize: 19, fontWeight: 850, letterSpacing: 0 }}>{title}</strong>
        <ResultBadge tone="green">Atualizado</ResultBadge>
      </div>
      {children}
    </div>
  )
}

function ResultTable({
  columns,
  grow,
  rows,
  template,
}: {
  columns: string[]
  grow: (delay: number) => number
  rows: Array<Array<ReactNode>>
  template: string
}) {
  return (
    <div style={{ display: 'grid' }}>
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #edf2f7', color: '#64748b', display: 'grid', fontSize: 13, fontWeight: 820, gap: 10, gridTemplateColumns: template, letterSpacing: 0, padding: '9px 14px', textTransform: 'uppercase' }}>
        {columns.map((column) => <span key={column}>{column}</span>)}
      </div>
      {rows.map((row, index) => (
        <div key={index} style={{ alignItems: 'center', borderBottom: index === rows.length - 1 ? 'none' : '1px solid #f1f5f9', color: '#111827', display: 'grid', fontSize: 17, fontWeight: 720, gap: 10, gridTemplateColumns: template, opacity: grow(index * 7), padding: '11px 14px' }}>
          {row.map((cell, cellIndex) => <span key={cellIndex} style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell}</span>)}
        </div>
      ))}
    </div>
  )
}

function KpiStrip({ grow, items }: { grow: (delay: number) => number; items: Array<{ label: string; value: string; tone?: 'green' | 'neutral' | 'orange' }> }) {
  return (
    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: `repeat(${items.length}, 1fr)`, padding: '12px 14px 4px' }}>
      {items.map((item, index) => (
        <div key={item.label} style={{ background: item.tone === 'green' ? '#ecfdf3' : item.tone === 'orange' ? '#fff7ed' : '#f8fafc', border: `1px solid ${item.tone === 'green' ? '#bbf7d0' : item.tone === 'orange' ? '#fed7aa' : '#e2e8f0'}`, borderRadius: 12, opacity: grow(index * 5), padding: '9px 10px' }}>
          <div style={{ color: '#64748b', fontSize: 12, fontWeight: 760, marginBottom: 3 }}>{item.label}</div>
          <div style={{ color: item.tone === 'green' ? '#166534' : item.tone === 'orange' ? '#c2410c' : '#111827', fontSize: 16, fontWeight: 880, letterSpacing: 0 }}>{item.value}</div>
        </div>
      ))}
    </div>
  )
}

export function ImprovedFinancialResultCard({ kind, startFrame }: { kind: FinancialAgentStep['result']; startFrame: number }) {
  const frame = useCurrentFrame()
  const local = Math.max(0, frame - startFrame)
  const grow = (delay: number) => interpolate(local, [delay, delay + 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  if (kind === 'expenses') {
    return (
      <div style={{ padding: 14 }}>
        <ResultShell title="Despesas classificadas">
          <ResultTable
            columns={['Fornecedor', 'Categoria', 'Valor', 'Status']}
            grow={grow}
            rows={[
              ['Google Ads', <ResultBadge tone="blue">Marketing</ResultBadge>, 'R$ 18.400', <ResultBadge tone="green">Classificado</ResultBadge>],
              ['AWS Brasil', <ResultBadge>Software</ResultBadge>, 'R$ 12.790', <ResultBadge tone="green">Classificado</ResultBadge>],
              ['Frete Sul', <ResultBadge tone="orange">Logistica</ResultBadge>, 'R$ 8.420', <ResultBadge tone="orange">Revisar</ResultBadge>],
            ]}
            template="1.25fr 0.92fr 0.78fr 0.95fr"
          />
        </ResultShell>
      </div>
    )
  }

  if (kind === 'reconcile') {
    return (
      <div style={{ padding: 14 }}>
        <ResultShell title="Conciliação banco x ERP">
          <ResultTable
            columns={['Banco', 'ERP', 'Valor', 'Match']}
            grow={grow}
            rows={[
              ['PIX Cliente Norte', 'NF-9031', 'R$ 42.100', <ResultBadge tone="green">OK</ResultBadge>],
              ['Cartao Stone', 'Lote-552', 'R$ 68.900', <ResultBadge tone="green">OK</ResultBadge>],
              ['Tarifa bancaria', 'Sem lancamento', 'R$ 189', <ResultBadge tone="orange">Revisar</ResultBadge>],
            ]}
            template="1.25fr 1fr 0.78fr 0.78fr"
          />
        </ResultShell>
      </div>
    )
  }

  if (kind === 'cash') {
    const chartProgress = grow(18)
    const points = [
      { label: 'Hoje', value: 418, x: 26, y: 66 },
      { label: '7d', value: 346, x: 126, y: 102 },
      { label: '12d', value: 387, x: 226, y: 82 },
      { label: '20d', value: 432, x: 326, y: 58 },
      { label: '30d', value: 465, x: 426, y: 42 },
    ]
    const visiblePoints = points.map((point, index) => {
      if (chartProgress >= 1) return point
      const previous = points[Math.max(0, index - 1)]
      const segment = Math.max(0, Math.min(1, chartProgress * (points.length - 1) - index + 1))
      return {
        ...point,
        x: previous.x + (point.x - previous.x) * segment,
        y: previous.y + (point.y - previous.y) * segment,
      }
    })
    const linePath = visiblePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
    const areaPath = `${linePath} L ${visiblePoints[visiblePoints.length - 1].x} 128 L ${visiblePoints[0].x} 128 Z`

    return (
      <div style={{ padding: 14 }}>
        <ResultShell title="Projecao de caixa">
          <div style={{ display: 'grid', gap: 12, padding: 14 }}>
            <div style={{ display: 'grid', gap: 9, gridTemplateColumns: '1fr 1fr 1fr' }}>
              {[
                { label: 'Saldo atual', tone: 'green', value: 'R$ 418k' },
                { label: 'Saldo 30d', tone: 'green', value: 'R$ 465k' },
                { label: 'Menor saldo', tone: 'orange', value: 'R$ 346k' },
              ].map((item, index) => (
                <div key={item.label} style={{ background: item.tone === 'green' ? '#ecfdf3' : '#fff7ed', border: `1px solid ${item.tone === 'green' ? '#bbf7d0' : '#fed7aa'}`, borderRadius: 12, opacity: grow(index * 5), padding: '11px 12px' }}>
                  <div style={{ color: '#64748b', fontSize: 12, fontWeight: 760, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ color: item.tone === 'green' ? '#166534' : '#c2410c', fontSize: 18, fontWeight: 900, letterSpacing: 0 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 3 }}>
              <strong style={{ color: '#111827', fontSize: 19, fontWeight: 880, letterSpacing: 0 }}>Saldo projetado</strong>
              <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 680 }}>Entradas e saidas previstas para os proximos 30 dias</span>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e8edf3', borderRadius: 14, height: 172, overflow: 'hidden', position: 'relative' }}>
              <svg height="172" style={{ display: 'block', opacity: grow(10) }} viewBox="0 0 452 172" width="100%">
                <defs>
                  <linearGradient id="cashAreaGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#225f42" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#225f42" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {[34, 66, 98, 130].map((y) => <line key={y} stroke="#eef2f6" strokeWidth="1" x1="18" x2="434" y1={y} y2={y} />)}
                <line stroke="#f59e0b" strokeDasharray="8 8" strokeWidth="2" x1="18" x2="434" y1="102" y2="102" />
                <path d={areaPath} fill="url(#cashAreaGradient)" />
                <path d={linePath} fill="none" stroke="#225f42" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
                {points.map((point, index) => (
                  <g key={point.label} opacity={grow(22 + index * 4)}>
                    <circle cx={point.x} cy={point.y} fill="#ffffff" r="8" stroke={index === 1 ? '#f59e0b' : '#225f42'} strokeWidth="4" />
                    <text fill="#64748b" fontSize="13" fontWeight="760" textAnchor="middle" x={point.x} y="156">{point.label}</text>
                  </g>
                ))}
              </svg>
            </div>

            <div style={{ alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, color: '#475569', display: 'flex', fontSize: 15, fontWeight: 760, justifyContent: 'space-between', opacity: grow(38), padding: '10px 12px' }}>
              <span>Risco baixo: caixa nao fica negativo</span>
              <strong style={{ color: '#225f42', fontSize: 16, fontWeight: 900 }}>+R$ 47k em 30d</strong>
            </div>
          </div>
        </ResultShell>
      </div>
    )
  }

  if (kind === 'timeline') {
    const timelineRows = [
      { day: 'Hoje', entrada: 'R$ 18k', saida: 'R$ 31k', saldo: 'R$ 405k', tone: 'green' as const, width: 74 },
      { day: '7 dias', entrada: 'R$ 24k', saida: 'R$ 42k', saldo: 'R$ 387k', tone: 'orange' as const, width: 52 },
      { day: '12 dias', entrada: 'R$ 96k', saida: 'R$ 18k', saldo: 'R$ 465k', tone: 'green' as const, width: 92 },
    ]

    return (
      <div style={{ padding: 14 }}>
        <ResultShell title="Fluxo de caixa projetado">
          <div style={{ display: 'grid', gap: 12, padding: 14 }}>
            <div style={{ display: 'grid', gap: 9, gridTemplateColumns: '1fr 1fr 1fr' }}>
              {[
                { label: 'Saldo hoje', tone: 'green', value: 'R$ 418k' },
                { label: 'Menor saldo', tone: 'orange', value: 'R$ 346k' },
                { label: 'Janela critica', tone: 'orange', value: '7 dias' },
              ].map((item, index) => (
                <div key={item.label} style={{ background: item.tone === 'green' ? '#ecfdf3' : '#fff7ed', border: `1px solid ${item.tone === 'green' ? '#bbf7d0' : '#fed7aa'}`, borderRadius: 12, opacity: grow(index * 5), padding: '10px 12px' }}>
                  <div style={{ color: '#64748b', fontSize: 12, fontWeight: 760, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ color: item.tone === 'green' ? '#166534' : '#c2410c', fontSize: 18, fontWeight: 900, letterSpacing: 0 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e8edf3', borderRadius: 14, display: 'grid', gap: 10, padding: 12 }}>
              {timelineRows.map((row, index) => (
                <div key={row.day} style={{ alignItems: 'center', display: 'grid', gap: 11, gridTemplateColumns: '58px 1fr 76px', opacity: grow(12 + index * 7) }}>
                  <strong style={{ color: '#111827', fontSize: 15, fontWeight: 860, letterSpacing: 0 }}>{row.day}</strong>
                  <div style={{ display: 'grid', gap: 5 }}>
                    <div style={{ alignItems: 'center', display: 'grid', gap: 8, gridTemplateColumns: '1fr auto' }}>
                      <span style={{ background: '#f1f5f9', borderRadius: 999, height: 11, overflow: 'hidden' }}>
                        <span style={{ background: row.tone === 'green' ? '#225f42' : '#f59e0b', borderRadius: 999, display: 'block', height: '100%', width: `${row.width * grow(16 + index * 6)}%` }} />
                      </span>
                      <span style={{ color: row.tone === 'green' ? '#166534' : '#c2410c', fontSize: 13, fontWeight: 860 }}>{row.saldo}</span>
                    </div>
                    <span style={{ color: '#64748b', fontSize: 12, fontWeight: 720 }}>Entrada {row.entrada} · Saida {row.saida}</span>
                  </div>
                  <ResultBadge tone={row.tone}>{index === 1 ? 'Atencao' : 'OK'}</ResultBadge>
                </div>
              ))}
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, color: '#475569', fontSize: 15, fontWeight: 760, opacity: grow(38), padding: '10px 12px' }}>
              Maior pressao em 7 dias: segurar pagamentos nao urgentes.
            </div>
          </div>
        </ResultShell>
      </div>
    )
  }

  if (kind === 'docs') {
    return (
      <div style={{ padding: 14 }}>
        <ResultShell title="Documentos financeiros">
          <ResultTable
            columns={['Documento', 'Tipo', 'Status', 'Acao']}
            grow={grow}
            rows={[
              ['NF 4821.pdf', 'Nota fiscal', <ResultBadge tone="green">Validado</ResultBadge>, 'Arquivar'],
              ['boleto_fornecedor.xml', 'Boleto', <ResultBadge tone="orange">Pendente</ResultBadge>, 'Revisar'],
              ['contrato_frete.pdf', 'Contrato', <ResultBadge tone="green">Validado</ResultBadge>, 'Arquivar'],
            ]}
            template="1.35fr 0.88fr 0.78fr 0.7fr"
          />
        </ResultShell>
      </div>
    )
  }

  if (kind === 'collections') {
    return (
      <div style={{ padding: 14 }}>
        <ResultShell title="Cobranças priorizadas">
          <ResultTable
            columns={['Cliente', 'Atraso', 'Valor', 'Proxima acao']}
            grow={grow}
            rows={[
              ['Cliente Norte', '18 dias', 'R$ 42k', <ResultBadge tone="red">Alta</ResultBadge>],
              ['Rede Alpha', '9 dias', 'R$ 18k', <ResultBadge tone="orange">Media</ResultBadge>],
              ['Loja Prime', '6 dias', 'R$ 11k', <ResultBadge tone="green">Baixa</ResultBadge>],
            ]}
            template="1.15fr 0.75fr 0.75fr 0.95fr"
          />
        </ResultShell>
      </div>
    )
  }

  const marginRows = [
    { action: 'Cortar campanha', area: 'Midia paga', impact: 'R$ 18.4k', tone: '#225f42', width: 100 },
    { action: 'Renegociar SLA', area: 'Frete', impact: 'R$ 8.2k', tone: '#2f7d56', width: 58 },
    { action: 'Revisar plano', area: 'Software', impact: 'R$ 4.7k', tone: '#94a3b8', width: 34 },
  ]

  return (
    <div style={{ padding: 14 }}>
      <ResultShell title="Oportunidades de margem">
        <div style={{ display: 'grid', gap: 12, padding: 14 }}>
          <div style={{ display: 'grid', gap: 9, gridTemplateColumns: '1fr 1fr' }}>
            {[
              { label: 'Economia potencial', value: 'R$ 31k' },
              { label: 'Margem estimada', value: '+4.2 p.p.' },
            ].map((item, index) => (
              <div key={item.label} style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 12, opacity: grow(index * 6), padding: '11px 12px' }}>
                <div style={{ color: '#64748b', fontSize: 12, fontWeight: 760, marginBottom: 4 }}>{item.label}</div>
                <div style={{ color: '#166534', fontSize: 20, fontWeight: 900, letterSpacing: 0 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e8edf3', borderRadius: 14, display: 'grid', gap: 11, padding: 12 }}>
            {marginRows.map((row, index) => (
              <div key={row.area} style={{ display: 'grid', gap: 6, opacity: grow(12 + index * 8) }}>
                <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'grid', gap: 2 }}>
                    <strong style={{ color: '#111827', fontSize: 16, fontWeight: 860, letterSpacing: 0 }}>{row.area}</strong>
                    <span style={{ color: '#64748b', fontSize: 12, fontWeight: 720 }}>{row.action}</span>
                  </div>
                  <strong style={{ color: row.tone, fontSize: 17, fontWeight: 900, letterSpacing: 0 }}>{row.impact}</strong>
                </div>
                <span style={{ background: '#f1f5f9', borderRadius: 999, height: 11, overflow: 'hidden' }}>
                  <span style={{ background: row.tone, borderRadius: 999, display: 'block', height: '100%', width: `${row.width * grow(18 + index * 6)}%` }} />
                </span>
              </div>
            ))}
          </div>

          <div style={{ alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, color: '#475569', display: 'flex', fontSize: 15, fontWeight: 760, justifyContent: 'space-between', opacity: grow(38), padding: '10px 12px' }}>
            <span>Prioridade: revisar midia paga primeiro</span>
            <ResultBadge tone="green">Alto impacto</ResultBadge>
          </div>
        </div>
      </ResultShell>
    </div>
  )
}

function IntegrationOrbitLogo({ active = false, integration }: { active?: boolean; integration: OrbitIntegration }) {
  const Icon = integration.icon

  return (
    <div
      style={{
        alignItems: 'center',
        background: '#ffffff',
        border: `1px solid ${active ? integration.accent : '#e3e8ef'}`,
        borderRadius: 30,
        boxShadow: active ? '0 26px 70px rgba(15, 23, 42, 0.18)' : '0 18px 46px rgba(15, 23, 42, 0.10)',
        display: 'flex',
        height: 152,
        justifyContent: 'center',
        padding: 18,
        width: 152,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', height: 70, justifyContent: 'center', overflow: 'hidden', width: 70 }}>
        <Icon className="h-full w-full" />
      </div>
    </div>
  )
}

export function IntegrationHubOrbitOnlyAnimation() {
  const frame = useCurrentFrame()
  const sceneIn = interpolate(frame, [0, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const pulse = interpolate(frame % 80, [0, 40, 80], [0.96, 1.04, 0.96])
  const activeIndex = Math.floor(frame / 42) % orbitIntegrations.length
  const centerX = 540
  const centerY = 930

  return (
    <AbsoluteFill style={{ background: '#f7f9fc', color: '#101828', fontFamily: 'Inter, Arial, sans-serif', overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34, 95, 66, 0.16), rgba(247, 249, 252, 0) 58%)', bottom: -180, left: -180, position: 'absolute', right: -180, top: -180 }} />

      <svg height="100%" style={{ left: 0, opacity: sceneIn, position: 'absolute', top: 0 }} viewBox="0 0 1080 1920" width="100%">
        {[235, 360, 485].map((radius) => (
          <circle cx={centerX} cy={centerY} fill="none" key={radius} r={radius} stroke="rgba(34, 95, 66, 0.13)" strokeDasharray={radius === 360 ? '18 18' : undefined} strokeWidth="3" />
        ))}
        {orbitIntegrations.map((integration, index) => {
          const angle = frame / 74 + index * ((Math.PI * 2) / orbitIntegrations.length)
          const radius = index % 2 === 0 ? 430 : 315
          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius
          return <path d={`M ${centerX} ${centerY} L ${x} ${y}`} fill="none" key={integration.label} opacity="0.22" stroke={integration.accent} strokeDasharray="14 16" strokeWidth="4" />
        })}
      </svg>

      <div style={{ opacity: sceneIn, position: 'absolute' }}>
        {orbitIntegrations.map((integration, index) => {
          const angle = frame / 74 + index * ((Math.PI * 2) / orbitIntegrations.length)
          const radius = index % 2 === 0 ? 430 : 315
          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius
          const depth = (Math.sin(angle) + 1) / 2
          const active = index === activeIndex
          const scale = 0.82 + depth * 0.14 + (active ? 0.12 : 0)

          return (
            <div
              key={integration.label}
              style={{
                left: x,
                opacity: 0.68 + depth * 0.32,
                position: 'absolute',
                top: y,
                transform: `translate(-50%, -50%) scale(${scale})`,
                zIndex: Math.round(depth * 20) + (active ? 30 : 8),
              }}
            >
              <IntegrationOrbitLogo active={active} integration={integration} />
            </div>
          )
        })}
      </div>

      <div
        style={{
          alignItems: 'center',
          background: '#102019',
          border: '1px solid #102019',
          borderRadius: 999,
          boxShadow: '0 42px 110px rgba(16, 32, 25, 0.24)',
          display: 'grid',
          height: 300,
          justifyItems: 'center',
          left: '50%',
          opacity: sceneIn,
          padding: 34,
          position: 'absolute',
          top: centerY,
          transform: `translate(-50%, -50%) scale(${pulse})`,
          width: 300,
          zIndex: 50,
        }}
      >
        <strong style={{ color: '#ffffff', fontSize: 76, fontWeight: 780, letterSpacing: 0, lineHeight: 1 }}>
          Otto
        </strong>
      </div>
    </AbsoluteFill>
  )
}

export function ChatGptMobileMarketingAnimation() {
  const frame = useCurrentFrame()

  return (
    <ChatGptMobileShell>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 12, 18)}>
        Crie uma legenda para o lancamento
      </ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 54, 22)}>
        Claro. Vou deixar o texto curto, direto e pronto para postar.
      </ChatGptFlowAssistantText>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 112, 22)}>
        Novo recurso no ar: conecte seus dados, acompanhe indicadores e transforme analises em acoes sem sair do chat.
      </ChatGptFlowAssistantText>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 210, 18)}>
        Faca uma versao mais executiva
      </ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 252, 22)}>
        Seus dados operacionais agora viram decisoes em minutos. Financeiro, vendas e marketing no mesmo fluxo de trabalho.
      </ChatGptFlowAssistantText>
      <div style={chatGptSequenceStyle(frame, 340, 14)}>
        <div style={{ padding: '10px 0 0 45px' }}>
          <ChatGptActionRow />
        </div>
      </div>
    </ChatGptMobileShell>
  )
}

export function ChatGptToolCallDemoAnimation() {
  const frame = useCurrentFrame()
  const conversationY = interpolate(frame, [0, 240, 420, 620], [0, 0, -220, -430], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <ChatGptMobileShell conversationY={conversationY}>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 12, 18)}>
        Analise minhas campanhas de hoje
      </ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 54, 22)}>
        Vou chamar get_data para buscar as campanhas ativas.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        style={chatGptSequenceStyle(frame, 126, 18)}
        toolName="get_data"
      />
      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 190, 22)}>
        Agora vou chamar normalize_metrics para padronizar receita, gasto e ROAS.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        style={chatGptSequenceStyle(frame, 272, 18)}
        toolName="normalize_metrics"
      />
      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 336, 22)}>
        Vou chamar detect_anomalies para encontrar campanhas fora do padrao.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        style={chatGptSequenceStyle(frame, 418, 18)}
        toolName="detect_anomalies"
      />
      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 482, 22)}>
        Por fim vou chamar summarize_actions para montar as proximas acoes.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        style={chatGptSequenceStyle(frame, 564, 18)}
        toolName="summarize_actions"
      />
      <div style={chatGptSequenceStyle(frame, 642, 14)}>
        <div style={{ padding: '10px 0 0 45px' }}>
          <ChatGptActionRow />
        </div>
      </div>
    </ChatGptMobileShell>
  )
}

export function ChatGptAccountingToolActionsAnimation() {
  const frame = useCurrentFrame()
  const conversationY = interpolate(frame, [0, 360, 560, 740, 900], [0, 0, -90, -180, -260], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <ChatGptMobileShell conversationY={conversationY} promptInputBottom={44}>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 12, 18)}>
        Classifique as despesas, concilie o banco e lance no ERP.
      </ChatGptFlowUserBubble>

      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 62, 22)}>
        Entendi. Vou executar em tres etapas e te devolver o resumo de cada uma.
      </ChatGptFlowAssistantText>

      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 144, 22)}>
        Primeiro vou classificar as despesas sem categoria usando regras do financeiro.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        style={chatGptSequenceStyle(frame, 232, 18)}
        toolName="classificar_despesa"
      />
      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 306, 22)}>
        Classifiquei 4 despesas: 3 aplicadas com alta confianca e 1 mantida para revisao.
      </ChatGptFlowAssistantText>

      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 406, 22)}>
        Agora vou conciliar o extrato bancario com os lancamentos do ERP.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        style={chatGptSequenceStyle(frame, 486, 18)}
        toolName="conciliar_banco"
      />
      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 560, 22)}>
        Conciliei 14 movimentos automaticamente e deixei 3 divergencias pendentes.
      </ChatGptFlowAssistantText>

      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 660, 22)}>
        Por fim, vou criar o lancamento no ERP para a despesa validada.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        style={chatGptSequenceStyle(frame, 738, 18)}
        toolName="criar_lancamento"
      />
      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 812, 22)}>
        Lancamento criado no ERP, vinculado ao extrato e marcado como aberto.
      </ChatGptFlowAssistantText>

      <div style={chatGptSequenceStyle(frame, 902, 14)}>
        <div style={{ padding: '10px 0 0 45px' }}>
          <ChatGptActionRow />
        </div>
      </div>
    </ChatGptMobileShell>
  )
}

export function ChatGptFinancialAgentsVideo() {
  const frame = useCurrentFrame()
  const conversationY = interpolate(
    frame,
    [0, 240, 460, 680, 900, 1120, 1340, 1560, 1740],
    [0, 0, -330, -710, -1090, -1470, -1850, -2230, -2610],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  )

  return (
    <ChatGptMobileShell conversationY={conversationY} promptInputBottom={36}>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 12, 18)}>
        Otto, me ajuda a revisar o financeiro da empresa e priorizar o que eu preciso resolver hoje?
      </ChatGptFlowUserBubble>

      <ChatGptFinancialAssistantText style={chatGptSequenceStyle(frame, 74, 22)}>
        Claro. Vou acionar seus agentes financeiros e trazer prioridades, riscos e oportunidades.
      </ChatGptFinancialAssistantText>

      {financialAgentSteps.map((step, index) => {
        const start = 150 + index * 210
        return (
          <div key={step.toolName} style={{ display: 'contents' }}>
            <ChatGptFinancialAssistantText showHeader={false} style={chatGptSequenceStyle(frame, start, 22)}>
              {step.text}
            </ChatGptFinancialAssistantText>
            <ChatGptToolCallCard
              style={chatGptSequenceStyle(frame, start + 52, 16)}
              toolName={step.toolName}
            />
            <ChatGptToolResultCard style={chatGptSequenceStyle(frame, start + 100, 18)}>
              <ImprovedFinancialResultCard kind={step.result} startFrame={start + 100} />
            </ChatGptToolResultCard>
            <ChatGptFinancialAssistantText showHeader={false} style={chatGptSequenceStyle(frame, start + 174, 22)}>
              {step.insight}
            </ChatGptFinancialAssistantText>
          </div>
        )
      })}

      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 1660, 18)}>
        <div style={{ display: 'grid', gap: 16, padding: 20 }}>
          <div style={{ color: '#111111', fontSize: 30, fontWeight: 840, letterSpacing: 0 }}>7 agentes financeiros ativos</div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
            {['Despesas organizadas', 'Bancos conciliados', 'Caixa monitorado', 'Documentos em ordem', 'Cobrancas priorizadas', 'Margem analisada'].map((item) => (
              <div key={item} style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 13, color: '#166534', fontSize: 17, fontWeight: 820, padding: 12 }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </ChatGptToolResultCard>

      <ChatGptFinancialAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 1740, 18)}>
        Seu financeiro operando direto pelo ChatGPT ou Claude.
      </ChatGptFinancialAssistantText>
    </ChatGptMobileShell>
  )
}

export function ChatGptMobileAnimation() {
  return <ChatGptMobileMarketingAnimation />
}
