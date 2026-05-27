import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import type { CSSProperties, ReactNode } from 'react'
import {
  ChevronRight,
  Copy,
  Menu,
  Mic,
  MoreHorizontal,
  Plus,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  Upload,
  Volume2,
} from 'lucide-react'

import type { ChartResultStructuredContent, DataResultStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { AnimatedMcpChartView } from '@/remotion/components/AnimatedMcpChartView'
import { AnimatedMcpLineChartView } from '@/remotion/components/AnimatedMcpLineChartView'
import { AnimatedMcpPieChartView } from '@/remotion/components/AnimatedMcpPieChartView'
import { AnimatedMcpTableView } from '@/remotion/components/AnimatedMcpTableView'

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

const pieData = {
  ok: true,
  tool: 'chart',
  view: 'chart',
  title: 'Participação por canal',
  subtitle: 'Distribuição da receita conectada',
  chart: {
    type: 'pie',
    labelField: 'canal',
    valueField: 'receita',
    format: 'currency',
  },
  rows: chartData.rows,
} satisfies ChartResultStructuredContent

const lineData = {
  ok: true,
  tool: 'chart',
  view: 'chart',
  title: 'Evolução da receita',
  subtitle: 'Últimos 7 dias conectados',
  chart: {
    type: 'line',
    labelField: 'dia',
    valueField: 'receita',
    format: 'currency',
  },
  rows: [
    { dia: 'D1', receita: 42000 },
    { dia: 'D2', receita: 51500 },
    { dia: 'D3', receita: 48200 },
    { dia: 'D4', receita: 69000 },
    { dia: 'D5', receita: 74400 },
    { dia: 'D6', receita: 91600 },
    { dia: 'D7', receita: 103500 },
  ],
} satisfies ChartResultStructuredContent

const tableData = {
  ok: true,
  tool: 'erp',
  view: 'table',
  title: 'Contas a pagar',
  count: 5,
  columns: ['fornecedor', 'numero_documento', 'data_vencimento', 'status', 'valor_liquido'],
  rows: [
    { fornecedor: 'Conta Azul', numero_documento: 'BOL-1042', data_vencimento: '2026-05-28', status: 'Aberto', valor_liquido: 18400 },
    { fornecedor: 'Omie ERP', numero_documento: 'BOL-1043', data_vencimento: '2026-05-29', status: 'Pago', valor_liquido: 27500 },
    { fornecedor: 'Bling', numero_documento: 'BOL-1044', data_vencimento: '2026-05-31', status: 'Aberto', valor_liquido: 16320 },
    { fornecedor: 'Supabase', numero_documento: 'BOL-1045', data_vencimento: '2026-06-02', status: 'Vencido', valor_liquido: 9800 },
    { fornecedor: 'Google Cloud', numero_documento: 'BOL-1046', data_vencimento: '2026-06-05', status: 'Aberto', valor_liquido: 36740 },
  ],
} satisfies DataResultStructuredContent

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

function StatusBar() {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        height: 78,
        justifyContent: 'space-between',
        padding: '24px 77px 0',
      }}
    >
      <div style={{ color: '#000000', fontSize: 40, fontWeight: 700, letterSpacing: 0 }}>18:07</div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 17 }}>
        <div style={{ alignItems: 'flex-end', display: 'flex', gap: 4, height: 23 }}>
          {[11, 15, 20, 26].map((height, index) => (
            <span
              key={height}
              style={{
                background: index === 3 ? '#c7c7c7' : '#000000',
                borderRadius: 3,
                display: 'block',
                height,
                width: 7,
              }}
            />
          ))}
        </div>
        <div style={{ height: 29, position: 'relative', width: 40 }}>
          <div
            style={{
              border: '5px solid #000000',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
              borderRadius: '50%',
              height: 34,
              left: 0,
              position: 'absolute',
              top: 2,
              transform: 'rotate(-45deg)',
              width: 40,
            }}
          />
          <div
            style={{
              background: '#000000',
              borderRadius: 999,
              bottom: 0,
              height: 7,
              left: 16,
              position: 'absolute',
              width: 7,
            }}
          />
        </div>
        <div
          style={{
            alignItems: 'center',
            background: '#ededed',
            borderRadius: 8,
            color: '#000000',
            display: 'flex',
            fontSize: 25,
            fontWeight: 800,
            height: 33,
            justifyContent: 'center',
            lineHeight: 1,
            position: 'relative',
            width: 61,
          }}
        >
          <span
            style={{
              background: '#f5c400',
              borderBottomLeftRadius: 8,
              borderTopLeftRadius: 8,
              height: '100%',
              left: 0,
              position: 'absolute',
              top: 0,
              width: 24,
            }}
          />
          <span style={{ position: 'relative' }}>24</span>
        </div>
      </div>
    </div>
  )
}

function TopBar() {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'grid',
        gridTemplateColumns: '120px 1fr 138px',
        height: 118,
        padding: '0 41px',
      }}
    >
      <Menu color="#000000" size={50} strokeWidth={2.6} />
      <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
        <span style={{ color: '#111111', fontSize: 45, fontWeight: 500, letterSpacing: 0 }}>ChatGPT</span>
        <ChevronRight color="#9b9b9b" size={33} strokeWidth={2.5} />
      </div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 43, justifyContent: 'flex-end' }}>
        <SquarePen color="#000000" size={47} strokeWidth={2.7} />
        <MoreHorizontal color="#000000" size={49} strokeWidth={3} />
      </div>
    </div>
  )
}

function AssistantActions() {
  const iconStyle = { color: '#666666', size: 37, strokeWidth: 2.4 }

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 28, paddingTop: 24 }}>
      <Copy {...iconStyle} />
      <Volume2 {...iconStyle} />
      <ThumbsUp {...iconStyle} />
      <ThumbsDown {...iconStyle} />
      <Upload {...iconStyle} />
      <MoreHorizontal color="#666666" size={39} strokeWidth={2.9} />
    </div>
  )
}

function VoiceButton() {
  return (
    <div
      style={{
        alignItems: 'center',
        background: '#000000',
        borderRadius: 999,
        display: 'flex',
        height: 82,
        justifyContent: 'center',
        width: 82,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 7, height: 42 }}>
        {[14, 31, 44, 30, 15].map((height, index) => (
          <span key={`${height}-${index}`} style={{ background: '#ffffff', borderRadius: 999, height, width: 7 }} />
        ))}
      </div>
    </div>
  )
}

function BottomComposer() {
  return (
    <div
      style={{
        background: '#ffffff',
        bottom: 0,
        height: 178,
        left: 0,
        padding: '0 30px',
        position: 'absolute',
        right: 0,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 20 }}>
        <div
          style={{
            alignItems: 'center',
            background: '#f1f1f1',
            borderRadius: 999,
            display: 'flex',
            flex: '0 0 112px',
            height: 112,
            justifyContent: 'center',
          }}
        >
          <Plus color="#646464" size={52} strokeWidth={2.2} />
        </div>
        <div
          style={{
            alignItems: 'center',
            background: '#f1f1f1',
            borderRadius: 999,
            display: 'flex',
            flex: 1,
            height: 112,
            minWidth: 0,
            padding: '0 13px 0 42px',
          }}
        >
          <span style={{ color: '#8a8a8a', flex: 1, fontSize: 43, fontWeight: 400, letterSpacing: 0 }}>
            Pergunte ao ChatGPT
          </span>
          <Mic color="#8a8a8a" size={48} strokeWidth={2.6} />
          <div style={{ marginLeft: 28 }}>
            <VoiceButton />
          </div>
        </div>
      </div>
      <div
        style={{
          background: '#000000',
          borderRadius: 999,
          bottom: 12,
          height: 12,
          left: '50%',
          position: 'absolute',
          transform: 'translateX(-50%)',
          width: 380,
        }}
      />
    </div>
  )
}

function UserBubble({ children, style }: { children: string; style: CSSProperties }) {
  return (
    <div style={{ ...style, display: 'flex', justifyContent: 'flex-end', paddingRight: 36 }}>
      <div
        style={{
          background: '#f1f1f1',
          borderRadius: 56,
          color: '#171717',
          fontSize: 42,
          fontWeight: 400,
          letterSpacing: 0,
          lineHeight: 1.2,
          maxWidth: 615,
          padding: '30px 42px',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function AssistantText({ style }: { style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        color: '#111111',
        fontSize: 43,
        fontWeight: 400,
        letterSpacing: 0,
        lineHeight: 1.49,
        padding: '0 42px',
      }}
    >
      <p style={{ margin: '0 0 68px' }}>Você quer ver as contas a pagar de onde?</p>
      <p style={{ margin: '0 0 36px' }}>Por exemplo:</p>
      <ul style={{ display: 'grid', gap: 17, margin: 0, paddingLeft: 75 }}>
        <li style={{ paddingLeft: 8 }}>do seu ERP (Conta Azul, Omiê, Bling etc.)</li>
        <li style={{ paddingLeft: 8 }}>de uma planilha</li>
        <li style={{ paddingLeft: 8 }}>de um banco de dados/Supabase</li>
        <li style={{ paddingLeft: 8 }}>
          ou você quer saber conceitualmente o que entra em “contas a pagar” no financeiro?
        </li>
      </ul>
      <AssistantActions />
    </div>
  )
}

function AssistantBubble({ children, style }: { children: string; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        color: '#111111',
        fontSize: 40,
        fontWeight: 400,
        letterSpacing: 0,
        lineHeight: 1.38,
        padding: '0 42px',
      }}
    >
      {children}
    </div>
  )
}

function RichCard({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        background: '#ffffff',
        border: '1px solid #e5e5e5',
        borderRadius: 28,
        boxShadow: '0 18px 42px rgba(0, 0, 0, 0.08)',
        margin: '0 42px',
        overflow: 'hidden',
        padding: 18,
      }}
    >
      {children}
    </div>
  )
}

export function McpChartIntro() {
  const frame = useCurrentFrame()
  const firstUserStyle = fadeSlide(frame, 16, 40, 0)
  const firstAssistantStyle = fadeSlide(frame, 50, 0, 20)
  const secondUserStyle = fadeSlide(frame, 176, 40, 0)
  const tableTextStyle = fadeSlide(frame, 212, 0, 20)
  const tableStyle = fadeSlide(frame, 246, 0, 24)
  const chartTextStyle = fadeSlide(frame, 354, 0, 20)
  const chartStyle = fadeSlide(frame, 388, 0, 24)
  const pieStyle = fadeSlide(frame, 494, 0, 24)
  const lineStyle = fadeSlide(frame, 600, 0, 24)
  const conversationY = interpolate(frame, [0, 170, 285, 420, 540, 650], [0, 0, -360, -760, -1110, -1450], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        background: '#ffffff',
        color: '#111111',
        fontFamily: 'Arial, "Segoe UI", -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      }}
    >
      <StatusBar />
      <TopBar />

      <div
        style={{
          bottom: 178,
          left: 0,
          overflow: 'hidden',
          position: 'absolute',
          right: 0,
          top: 196,
        }}
      >
        <div style={{ display: 'grid', gap: 57, paddingTop: 28, transform: `translateY(${conversationY}px)` }}>
          <UserBubble style={firstUserStyle}>Me diga as contas a pagar</UserBubble>
          <AssistantText style={firstAssistantStyle} />

          <UserBubble style={secondUserStyle}>Do meu ERP</UserBubble>
          <AssistantBubble style={tableTextStyle}>
            Encontrei estas contas a pagar conectadas ao ERP.
          </AssistantBubble>
          <RichCard style={tableStyle}>
            <AnimatedMcpTableView data={tableData} startFrame={246} />
          </RichCard>

          <AssistantBubble style={chartTextStyle}>
            Também posso transformar a mesma consulta em visualizações.
          </AssistantBubble>
          <RichCard style={chartStyle}>
            <AnimatedMcpChartView data={chartData} startFrame={388} />
          </RichCard>
          <RichCard style={pieStyle}>
            <AnimatedMcpPieChartView data={pieData} startFrame={494} />
          </RichCard>
          <RichCard style={lineStyle}>
            <AnimatedMcpLineChartView data={lineData} startFrame={600} />
          </RichCard>
        </div>
      </div>

      <BottomComposer />
    </AbsoluteFill>
  )
}
