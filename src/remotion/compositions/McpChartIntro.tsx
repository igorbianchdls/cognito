import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import type { ChartResultStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { AnimatedMcpChartView } from '@/remotion/components/AnimatedMcpChartView'

const chartData = {
  ok: true,
  tool: 'chart',
  view: 'chart',
  title: 'Receita por canal',
  subtitle: 'Resposta rica renderizada como tool MCP',
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

function fadeSlide(frame: number, start: number, fromX = 0, fromY = 24) {
  const opacity = interpolate(frame, [start, start + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const x = interpolate(frame, [start, start + 28], [fromX, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const y = interpolate(frame, [start, start + 28], [fromY, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return {
    opacity,
    transform: `translate(${x}px, ${y}px)`,
  }
}

export function McpChartIntro() {
  const frame = useCurrentFrame()
  const headerStyle = fadeSlide(frame, 0, 0, 18)
  const userBubbleStyle = fadeSlide(frame, 22, 48, 0)
  const assistantBubbleStyle = fadeSlide(frame, 52, -48, 0)
  const chartStyle = fadeSlide(frame, 82, -34, 18)
  const footerStyle = fadeSlide(frame, 132, 0, 18)

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
          gap: 28,
          gridTemplateRows: 'auto auto auto 1fr auto',
          height: '100%',
        }}
      >
        <header
          style={{
            ...headerStyle,
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
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
          <span
            style={{
              color: '#64748b',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 0,
            }}
          >
            Assistente de dados
          </span>
        </header>

        <div
          style={{
            ...userBubbleStyle,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              borderRadius: 26,
              color: '#ffffff',
              fontSize: 34,
              fontWeight: 650,
              letterSpacing: 0,
              lineHeight: 1.25,
              maxWidth: 720,
              padding: '28px 32px',
            }}
          >
            Quais canais mais venderam este mes?
          </div>
        </div>

        <div
          style={{
            ...assistantBubbleStyle,
            alignItems: 'flex-start',
            display: 'flex',
            gap: 16,
          }}
        >
          <div
            style={{
              alignItems: 'center',
              background: '#225f42',
              borderRadius: 18,
              color: '#ffffff',
              display: 'flex',
              flex: '0 0 54px',
              fontSize: 22,
              fontWeight: 800,
              height: 54,
              justifyContent: 'center',
              width: 54,
            }}
          >
            C
          </div>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #dfe4df',
              borderRadius: 22,
              boxShadow: '0 14px 34px rgba(15, 23, 42, 0.08)',
              color: '#202622',
              fontSize: 30,
              fontWeight: 560,
              letterSpacing: 0,
              lineHeight: 1.34,
              maxWidth: 760,
              padding: '26px 30px',
            }}
          >
            Consolidei os pedidos conectados. Shopify lidera a receita, seguido por Mercado Livre.
          </div>
        </div>

        <div
          style={{
            ...chartStyle,
            background: '#ffffff',
            border: '1px solid #dfe4df',
            borderRadius: 18,
            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.10)',
            minHeight: 0,
            padding: 30,
          }}
        >
          <AnimatedMcpChartView data={chartData} startFrame={82} />
        </div>

        <footer
          style={{
            ...footerStyle,
            color: '#64748b',
            fontSize: 22,
            fontWeight: 650,
            letterSpacing: 0,
            textAlign: 'center',
          }}
        >
          Resposta rica de tool MCP simulada no chat.
        </footer>
      </div>
    </AbsoluteFill>
  )
}
