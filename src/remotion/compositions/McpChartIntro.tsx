import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { AnalysisView } from '@/products/mcp-apps/web/src/views/AnalysisView'
import type {
  AnalysisStructuredContent,
  ChartResultStructuredContent,
} from '@/products/mcp-apps/web/src/types/toolResult'
import { AnimatedMcpChartView } from '@/remotion/components/AnimatedMcpChartView'

const analysisData = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  title: 'Resumo operacional',
  subtitle: 'Dados normalizados para decisao',
  summary: 'Receita, pedidos e canais consolidados em uma visao unica.',
  metrics: [
    { label: 'Receita', value: 482900, format: 'currency' },
    { label: 'Pedidos', value: 1840, format: 'number' },
    { label: 'ROAS', value: 4.8, format: 'number' },
  ],
  sections: [
    {
      kind: 'insight',
      severity: 'low',
      title: 'Crescimento consistente',
      evidence: 'Os principais canais cresceram no periodo analisado.',
      recommendation: 'Priorizar campanhas com maior margem.',
    },
  ],
} satisfies AnalysisStructuredContent

const chartData = {
  ok: true,
  tool: 'chart',
  view: 'chart',
  title: 'Receita por canal',
  subtitle: 'Exemplo renderizado com componente MCP Apps',
  chart: {
    type: 'bar',
    labelField: 'canal',
    valueField: 'receita',
    format: 'currency',
  },
  rows: [
    { canal: 'Shopify', receita: 168000 },
    { canal: 'Mercado Livre', receita: 142500 },
    { canal: 'Shopee', receita: 96700 },
    { canal: 'Amazon', receita: 75700 },
  ],
} satisfies ChartResultStructuredContent

function animatedStyle(frame: number, start: number) {
  const opacity = interpolate(frame, [start, start + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const y = interpolate(frame, [start, start + 28], [34, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return {
    opacity,
    transform: `translateY(${y}px)`,
  }
}

export function McpChartIntro() {
  const frame = useCurrentFrame()
  const titleStyle = animatedStyle(frame, 0)
  const analysisStyle = animatedStyle(frame, 28)
  const chartStyle = animatedStyle(frame, 58)
  const footerStyle = animatedStyle(frame, 118)

  return (
    <AbsoluteFill
      style={{
        background: '#eef2f7',
        color: '#0f172a',
        fontFamily: 'Inter, Arial, sans-serif',
        padding: 56,
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: 34,
          height: '100%',
          gridTemplateRows: 'auto auto 1fr auto',
        }}
      >
        <header style={titleStyle}>
          <p
            style={{
              color: '#225f42',
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 0,
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            Creatto
          </p>
          <h1
            style={{
              color: '#0f172a',
              fontSize: 58,
              fontWeight: 850,
              letterSpacing: 0,
              lineHeight: 1.02,
              margin: '12px 0 0',
            }}
          >
            Componentes MCP em video vertical
          </h1>
        </header>

        <div
          style={{
            alignItems: 'stretch',
            display: 'grid',
            gap: 26,
            gridTemplateRows: 'auto 1fr',
            minHeight: 0,
          }}
        >
          <div
            style={{
              ...analysisStyle,
              background: '#ffffff',
              border: '1px solid #dfe4df',
              borderRadius: 8,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.10)',
              minHeight: 0,
              padding: 22,
            }}
          >
            <AnalysisView data={analysisData} />
          </div>

          <div
            style={{
              ...chartStyle,
              background: '#ffffff',
              border: '1px solid #dfe4df',
              borderRadius: 8,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.10)',
              minHeight: 0,
              padding: 28,
            }}
          >
            <AnimatedMcpChartView data={chartData} startFrame={58} />
          </div>
        </div>

        <footer
          style={{
            ...footerStyle,
            alignItems: 'center',
            color: '#475569',
            display: 'flex',
            flexDirection: 'column',
            fontSize: 24,
            fontWeight: 650,
            gap: 8,
            justifyContent: 'center',
            letterSpacing: 0,
            textAlign: 'center',
          }}
        >
          <span>Mesma UI das tools. Agora animada com Remotion.</span>
          <span>6s · 30fps · 1080x1920</span>
        </footer>
      </div>
    </AbsoluteFill>
  )
}
