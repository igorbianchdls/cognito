import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import type { CSSProperties, ReactNode } from 'react'
import {
  ChevronRight,
  Copy,
  Menu,
  Mic,
  MoreHorizontal,
  Play,
  Plus,
  RotateCcw,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  Upload,
  Volume2,
} from 'lucide-react'

import type {
  ChartResultStructuredContent,
  ConnectorsStructuredContent,
  DataResultStructuredContent,
} from '@/products/mcp-apps/web/src/types/toolResult'
import { AnimatedMcpChartView } from '@/remotion/components/AnimatedMcpChartView'
import { AnimatedMcpConnectorsView } from '@/remotion/components/AnimatedMcpConnectorsView'
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

const connectorsData = {
  ok: true,
  tool: 'connectors',
  view: 'connectors',
  title: 'Conectores sincronizados',
  subtitle: 'Fontes disponíveis para consulta',
  rows: [
    { connector_id: 'erp-conta-azul', domain: 'erp', plataforma: 'conta_azul', name: 'Conta Azul', health: 'connected', last_sync_at: '2026-05-28T17:10:00.000Z', accounts_count: 1 },
    { connector_id: 'erp-omie', domain: 'erp', plataforma: 'omie', name: 'Omie ERP', health: 'connected', last_sync_at: '2026-05-28T16:40:00.000Z', accounts_count: 2 },
    { connector_id: 'erp-bling', domain: 'erp', plataforma: 'bling', name: 'Bling', health: 'connected', last_sync_at: '2026-05-28T15:55:00.000Z', accounts_count: 1 },
    { connector_id: 'infra-gcp', domain: 'infra', plataforma: 'google_ads', name: 'Google Cloud', health: 'connected', last_sync_at: '2026-05-28T15:20:00.000Z', accounts_count: 1 },
  ],
} satisfies ConnectorsStructuredContent

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
        margin: '0 42px',
        overflow: 'hidden',
        padding: 18,
      }}
    >
      {children}
    </div>
  )
}

export type McpTemplate = 'chatgpt' | 'claude'

function ChatGptMobileTemplate() {
  const frame = useCurrentFrame()
  const firstUserStyle = fadeSlide(frame, 16, 40, 0)
  const firstAssistantStyle = fadeSlide(frame, 50, 0, 20)
  const secondUserStyle = fadeSlide(frame, 176, 40, 0)
  const connectorsTextStyle = fadeSlide(frame, 212, 0, 20)
  const connectorsStyle = fadeSlide(frame, 246, 0, 24)
  const tableTextStyle = fadeSlide(frame, 354, 0, 20)
  const tableStyle = fadeSlide(frame, 388, 0, 24)
  const chartTextStyle = fadeSlide(frame, 496, 0, 20)
  const chartStyle = fadeSlide(frame, 530, 0, 24)
  const pieStyle = fadeSlide(frame, 636, 0, 24)
  const lineStyle = fadeSlide(frame, 742, 0, 24)
  const conversationY = interpolate(frame, [0, 170, 285, 420, 540, 650, 760], [0, 0, -360, -760, -1110, -1450, -1800], {
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
          <AssistantBubble style={connectorsTextStyle}>
            Primeiro, estes conectores estão sincronizados.
          </AssistantBubble>
          <RichCard style={connectorsStyle}>
            <AnimatedMcpConnectorsView data={connectorsData} startFrame={246} />
          </RichCard>

          <AssistantBubble style={tableTextStyle}>
            Encontrei estas contas a pagar conectadas ao ERP.
          </AssistantBubble>
          <RichCard style={tableStyle}>
            <AnimatedMcpTableView data={tableData} startFrame={388} />
          </RichCard>

          <AssistantBubble style={chartTextStyle}>
            Também posso transformar a mesma consulta em visualizações.
          </AssistantBubble>
          <RichCard style={chartStyle}>
            <AnimatedMcpChartView data={chartData} startFrame={530} />
          </RichCard>
          <RichCard style={pieStyle}>
            <AnimatedMcpPieChartView data={pieData} startFrame={636} />
          </RichCard>
          <RichCard style={lineStyle}>
            <AnimatedMcpLineChartView data={lineData} startFrame={742} />
          </RichCard>
        </div>
      </div>

      <BottomComposer />
    </AbsoluteFill>
  )
}

function ClaudeStatusBar() {
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
      <div style={{ color: '#000000', fontSize: 40, fontWeight: 700, letterSpacing: 0 }}>19:04</div>
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
            border: '1px solid #cfcfcf',
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
          5
        </div>
      </div>
    </div>
  )
}

function ClaudeTopBar() {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        height: 119,
        justifyContent: 'space-between',
        padding: '0 55px',
      }}
    >
      <Menu color="#3f3f3a" size={44} strokeWidth={2.2} />
      <div style={{ alignItems: 'center', display: 'flex', gap: 66 }}>
        <div
          style={{
            alignItems: 'center',
            background: '#3a3a36',
            borderRadius: 999,
            display: 'flex',
            height: 52,
            justifyContent: 'center',
            width: 52,
          }}
        >
          <Plus color="#ffffff" size={39} strokeWidth={3.1} />
        </div>
        <MoreHorizontal color="#3f3f3a" size={49} strokeWidth={3} />
      </div>
    </div>
  )
}

function ClaudeUserBubble({ children, style }: { children: string; style: CSSProperties }) {
  return (
    <div style={{ ...style, display: 'flex', justifyContent: 'flex-end', paddingRight: 34 }}>
      <div
        style={{
          background: '#f4f3f1',
          border: '1px solid #e4e2df',
          borderRadius: 58,
          color: '#111111',
          fontFamily: 'Arial, "Segoe UI", sans-serif',
          fontSize: 42,
          fontWeight: 400,
          letterSpacing: 0,
          lineHeight: 1.16,
          maxWidth: 640,
          padding: '31px 37px',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ClaudeActions({ includeShare = false }: { includeShare?: boolean }) {
  const iconStyle = { color: '#7b7a74', size: 39, strokeWidth: 2.4 }

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 36, paddingTop: 46 }}>
      <Copy {...iconStyle} />
      {includeShare ? <Upload {...iconStyle} /> : null}
      <Play {...iconStyle} />
      <ThumbsUp {...iconStyle} />
      <ThumbsDown {...iconStyle} />
      <RotateCcw {...iconStyle} />
    </div>
  )
}

function ClaudeAssistantText({ children, style, includeShare = false }: { children: ReactNode; style: CSSProperties; includeShare?: boolean }) {
  return (
    <div
      style={{
        ...style,
        color: '#111111',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 47,
        fontWeight: 500,
        letterSpacing: -0.7,
        lineHeight: 1.52,
        padding: '0 42px',
      }}
    >
      <div>{children}</div>
      <ClaudeActions includeShare={includeShare} />
    </div>
  )
}

function ClaudeMark() {
  return (
    <div style={{ height: 78, position: 'relative', width: 78 }}>
      {Array.from({ length: 12 }).map((_, index) => (
        <span
          key={index}
          style={{
            background: '#e17b5c',
            borderRadius: 999,
            height: 9,
            left: 9,
            position: 'absolute',
            top: 34,
            transform: `rotate(${index * 30}deg) translateX(26px)`,
            transformOrigin: '30px 5px',
            width: 43,
          }}
        />
      ))}
    </div>
  )
}

function ClaudeNotice({ style }: { style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        alignItems: 'center',
        display: 'grid',
        gap: 25,
        gridTemplateColumns: '95px 1fr',
        padding: '0 42px',
      }}
    >
      <ClaudeMark />
      <div
        style={{
          color: '#3e3d39',
          fontFamily: 'Arial, "Segoe UI", sans-serif',
          fontSize: 35,
          fontWeight: 400,
          letterSpacing: 0,
          lineHeight: 1.35,
          textAlign: 'center',
        }}
      >
        Claude é uma IA e pode cometer erros.
        <br />
        Por favor, verifique as respostas.
      </div>
    </div>
  )
}

function ClaudeComposer() {
  return (
    <div
      style={{
        background: '#ffffff',
        bottom: 0,
        height: 247,
        left: 0,
        padding: '0 40px',
        position: 'absolute',
        right: 0,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #c8c6c1',
          borderRadius: 63,
          boxShadow: '0 16px 30px rgba(0, 0, 0, 0.12)',
          height: 205,
          padding: '32px 20px 18px 31px',
        }}
      >
        <div
          style={{
            color: '#7f7e78',
            fontFamily: 'Arial, "Segoe UI", sans-serif',
            fontSize: 42,
            fontWeight: 400,
            letterSpacing: 0,
            lineHeight: 1,
            marginBottom: 50,
          }}
        >
          Responder a Claude
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 20 }}>
          <div
            style={{
              alignItems: 'center',
              background: '#f0efec',
              borderRadius: 999,
              display: 'flex',
              height: 92,
              justifyContent: 'center',
              width: 92,
            }}
          >
            <Plus color="#000000" size={42} strokeWidth={2.3} />
          </div>
          <div
            style={{
              alignItems: 'center',
              background: '#f0efec',
              borderRadius: 999,
              color: '#111111',
              display: 'flex',
              fontFamily: 'Arial, "Segoe UI", sans-serif',
              fontSize: 31,
              fontWeight: 400,
              height: 92,
              justifyContent: 'center',
              letterSpacing: 0,
              padding: '0 42px',
            }}
          >
            Sonnet 4.6
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              alignItems: 'center',
              background: '#f0efec',
              borderRadius: 999,
              display: 'flex',
              height: 92,
              justifyContent: 'center',
              width: 92,
            }}
          >
            <Mic color="#3f3f3a" size={47} strokeWidth={2.6} />
          </div>
          <VoiceButton />
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

function ClaudeRichCard({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        background: '#ffffff',
        border: '1px solid #e8e5df',
        borderRadius: 34,
        margin: '0 42px',
        overflow: 'hidden',
        padding: 18,
      }}
    >
      {children}
    </div>
  )
}

function ClaudeMobileTemplate() {
  const frame = useCurrentFrame()
  const firstUserStyle = fadeSlide(frame, 12, 38, 0)
  const firstAssistantStyle = fadeSlide(frame, 42, 0, 18)
  const secondUserStyle = fadeSlide(frame, 128, 38, 0)
  const secondAssistantStyle = fadeSlide(frame, 164, 0, 18)
  const noticeStyle = fadeSlide(frame, 224, 0, 16)
  const erpUserStyle = fadeSlide(frame, 298, 38, 0)
  const connectorsTextStyle = fadeSlide(frame, 334, 0, 18)
  const connectorsStyle = fadeSlide(frame, 368, 0, 24)
  const tableTextStyle = fadeSlide(frame, 476, 0, 18)
  const tableStyle = fadeSlide(frame, 510, 0, 24)
  const chartTextStyle = fadeSlide(frame, 618, 0, 18)
  const chartStyle = fadeSlide(frame, 652, 0, 24)
  const pieStyle = fadeSlide(frame, 742, 0, 24)
  const lineStyle = fadeSlide(frame, 812, 0, 24)
  const conversationY = interpolate(frame, [0, 250, 370, 500, 620, 740, 830], [0, 0, -390, -770, -1130, -1470, -1810], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        background: '#ffffff',
        color: '#111111',
        fontFamily: 'Arial, "Segoe UI", sans-serif',
      }}
    >
      <ClaudeStatusBar />
      <ClaudeTopBar />

      <div
        style={{
          bottom: 247,
          left: 0,
          overflow: 'hidden',
          position: 'absolute',
          right: 0,
          top: 188,
        }}
      >
        <div style={{ display: 'grid', gap: 58, paddingTop: 28, transform: `translateY(${conversationY}px)` }}>
          <ClaudeUserBubble style={firstUserStyle}>Olá</ClaudeUserBubble>
          <ClaudeAssistantText style={firstAssistantStyle}>Olá, Igor! Como posso ajudar?</ClaudeAssistantText>
          <ClaudeUserBubble style={secondUserStyle}>Tudo bem com você?</ClaudeUserBubble>
          <ClaudeAssistantText includeShare style={secondAssistantStyle}>
            Tudo bem, obrigado! E com você? Alguma coisa no radar hoje — produto, tech, ou só curiosidade do dia?
          </ClaudeAssistantText>
          <ClaudeNotice style={noticeStyle} />

          <ClaudeUserBubble style={erpUserStyle}>Me diga as contas a pagar</ClaudeUserBubble>
          <ClaudeAssistantText style={connectorsTextStyle}>
            Primeiro, estes conectores estão sincronizados.
          </ClaudeAssistantText>
          <ClaudeRichCard style={connectorsStyle}>
            <AnimatedMcpConnectorsView data={connectorsData} startFrame={368} />
          </ClaudeRichCard>

          <ClaudeAssistantText style={tableTextStyle}>
            Encontrei estas contas a pagar conectadas ao ERP.
          </ClaudeAssistantText>
          <ClaudeRichCard style={tableStyle}>
            <AnimatedMcpTableView data={tableData} startFrame={510} />
          </ClaudeRichCard>

          <ClaudeAssistantText style={chartTextStyle}>
            Também posso transformar a mesma consulta em visualizações.
          </ClaudeAssistantText>
          <ClaudeRichCard style={chartStyle}>
            <AnimatedMcpChartView data={chartData} startFrame={652} />
          </ClaudeRichCard>
          <ClaudeRichCard style={pieStyle}>
            <AnimatedMcpPieChartView data={pieData} startFrame={742} />
          </ClaudeRichCard>
          <ClaudeRichCard style={lineStyle}>
            <AnimatedMcpLineChartView data={lineData} startFrame={812} />
          </ClaudeRichCard>
        </div>
      </div>

      <ClaudeComposer />
    </AbsoluteFill>
  )
}

export function McpChartIntro({ template = 'chatgpt' }: { template?: McpTemplate }) {
  return template === 'claude' ? <ClaudeMobileTemplate /> : <ChatGptMobileTemplate />
}
