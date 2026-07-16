import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import {
  CHATGPT_MOBILE_FONT_STACK,
  ChatGptFlowAssistantText,
  ChatGptFlowUserBubble,
  ChatGptMobileShell,
  ChatGptToolCallCard,
  ChatGptToolResultCard,
  OttoAssistantHeader,
  chatGptSequenceStyle,
} from '@/assets/remotion/compositions/ChatGptMobileBase'
import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const OTTO_AI_EMPLOYEES_CHATGPT_CLAUDE_DURATION = 10680

const FONT = IOS_REMOTION_FONT_STACK

type ResultRow = {
  background?: string
  description: string
  initials: string
  name: string
  status: string
  tone: string
  value?: string
}

type ActionStep = {
  result: {
    kind?: 'list' | 'table' | 'dashboard' | 'insight' | 'employee'
    rows?: ResultRow[]
    subtitle: string
    title: string
  }
  summary?: string
  text?: string
  tool: string
}

type AgentScene = {
  actions: ActionStep[]
  intro: string
  prompt: string
}

function p(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function typed(text: string, amount: number) {
  return text.slice(0, Math.ceil(text.length * amount))
}

function fadeOnlyStyle(frame: number, start: number): CSSProperties {
  return {
    opacity: p(frame, start, start + 18),
    transform: 'translateY(0px)',
  }
}

function stagedScroll(frame: number, actionCount: number) {
  if (actionCount <= 1) {
    return interpolate(frame, [0, 330, 520, 700], [0, 0, -560, -1040], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  }

  if (actionCount === 2) {
    return interpolate(frame, [0, 340, 580, 820, 1040], [0, 0, -520, -1040, -1540], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  }

  return interpolate(frame, [0, 340, 600, 860, 1120, 1320], [0, 0, -520, -1040, -1560, -2060], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function sequence(frame: number, start: number, fromY = 20) {
  return chatGptSequenceStyle(frame, start, fromY)
}

function Spinner({ active }: { active: boolean }) {
  const frame = useCurrentFrame()
  if (!active) {
    return <span style={{ background: '#12b76a', borderRadius: 999, display: 'block', height: 11, width: 11 }} />
  }

  return (
    <span
      style={{
        border: '3px solid #d7d7d7',
        borderRadius: 999,
        borderRightColor: '#111111',
        display: 'block',
        height: 24,
        transform: `rotate(${frame * 20}deg)`,
        width: 24,
      }}
    />
  )
}

function PromptInputScene({ frame, prompt, start }: { frame: number; prompt: string; start: number }) {
  const local = frame - start
  const sceneIn = p(local, 0, 16)
  const sceneOut = p(local, 82, 108, [1, 0])
  const promptProgress = p(local, 12, 76)
  const inputHeight = interpolate(promptProgress, [0, 0.48, 1], [104, 104, 216], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const text = typed(prompt, promptProgress)

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#111111', fontFamily: CHATGPT_MOBILE_FONT_STACK, opacity: sceneIn * sceneOut, overflow: 'hidden', transform: `translateY(${(1 - sceneIn) * 20 - (1 - sceneOut) * 18}px)` }}>
      <div style={{ alignItems: 'center', display: 'flex', inset: 0, justifyContent: 'center', position: 'absolute' }}>
        <div style={{ alignItems: inputHeight > 124 ? 'flex-start' : 'center', background: '#f1f1f1', borderRadius: inputHeight > 124 ? 48 : 999, display: 'flex', height: inputHeight, minHeight: 104, padding: inputHeight > 124 ? '30px 13px 30px 33px' : '0 13px 0 33px', width: 944 }}>
          <span style={{ color: '#333333', fontSize: 54, fontWeight: 300, lineHeight: 1, marginRight: 34 }}>+</span>
          <span style={{ color: '#111111', flex: 1, fontSize: 34, fontWeight: 400, letterSpacing: 0, lineHeight: 1.2, maxHeight: 132, overflow: 'hidden', whiteSpace: 'normal', wordBreak: 'normal' }}>
            {text}
            {promptProgress > 0 && promptProgress < 1 ? <span style={{ background: '#111111', display: local % 18 < 9 ? 'inline-block' : 'none', height: 36, marginLeft: 4, transform: 'translateY(6px)', width: 3 }} /> : null}
          </span>
          <div style={{ alignItems: 'center', background: '#007aff', borderRadius: 999, display: 'flex', height: 78, justifyContent: 'center', marginLeft: 10, marginTop: inputHeight > 124 ? -4 : 0, width: 78 }}>
            <span style={{ color: '#ffffff', fontSize: 34, fontWeight: 760, transform: 'translateY(-2px)' }}>↑</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function CompatibilityOpening({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const local = frame - start
  const sceneIn = p(local, 0, 22)
  const sceneOut = p(local, 248, 288, [1, 0])
  const prompt = 'Otto, mostre meus funcionarios de IA trabalhando no sistema.'

  return (
    <div style={{ inset: 0, opacity: sceneIn * sceneOut, position: 'absolute' }}>
      <ChatGptMobileShell conversationY={0} promptInputBottom={36}>
        <div style={{ margin: '26px 36px 0', opacity: p(local, 12, 34), transform: `translateY(${(1 - p(local, 12, 34)) * 16}px)` }}>
          <div style={{ background: '#050505', borderRadius: 34, color: '#ffffff', display: 'grid', gap: 24, padding: 34 }}>
            <div style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
              <BrandPill label="ChatGPT" tone="#10a37f" />
              <span style={{ color: '#ffffff', fontSize: 34, fontWeight: 300 }}>+</span>
              <BrandPill label="Claude" tone="#d97757" />
            </div>
            <div style={{ fontSize: 42, fontWeight: 760, letterSpacing: -0.4, lineHeight: 1.08 }}>Otto opera o sistema pelo chat</div>
            <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 23, fontWeight: 440, lineHeight: 1.34 }}>Funcionarios de IA executam rotinas financeiras, operacionais e fiscais dentro do Otto.</div>
          </div>
        </div>
        <ChatGptFlowUserBubble style={fadeOnlyStyle(local, 74)}>{prompt}</ChatGptFlowUserBubble>
        <ChatGptFlowAssistantText style={sequence(local, 134)}>
          Vou acionar os funcionarios de IA para organizar dados, executar rotinas e mostrar o que precisa de atencao.
        </ChatGptFlowAssistantText>
      </ChatGptMobileShell>
    </div>
  )
}

function BrandPill({ label, tone }: { label: string; tone: string }) {
  return (
    <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, display: 'flex', gap: 11, padding: '11px 16px' }}>
      <span style={{ background: tone, borderRadius: 999, display: 'block', height: 18, width: 18 }} />
      <span style={{ color: '#ffffff', fontSize: 22, fontWeight: 680 }}>{label}</span>
    </div>
  )
}

function CascadeResultCard({ localFrame, result }: { localFrame: number; result: ActionStep['result'] }) {
  const show = p(localFrame, 0, 18)
  const rows = result.rows ?? []
  const rowHeight = rows.length > 6 ? 64 : 76
  const cardHeight = result.kind === 'dashboard' ? 552 : result.kind === 'employee' ? 500 : interpolate(p(localFrame, 34, 78), [0, 1], [116, 126 + rows.length * rowHeight], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const progress = Math.round(interpolate(p(localFrame, 18, 154), [0, 1], [18, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))

  return (
    <div style={{ opacity: show, transform: `translateY(${(1 - show) * 18}px) scale(${0.985 + show * 0.015})` }}>
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 30, boxShadow: '0 18px 46px rgba(15, 23, 42, 0.08)', height: cardHeight, overflow: 'hidden', padding: '16px 0' }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '0 28px 12px' }}>
          <div style={{ display: 'grid', gap: 5 }}>
            <strong style={{ color: '#111111', fontSize: 23, fontWeight: 650, letterSpacing: -0.12 }}>{result.title}</strong>
            <span style={{ color: '#8b8b8b', fontSize: 17, fontWeight: 420 }}>{result.subtitle}</span>
          </div>
          <span style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 999, color: '#0f8f51', fontSize: 18, fontWeight: 650, padding: '9px 14px' }}>{progress}%</span>
        </div>
        {result.kind === 'dashboard' ? <DashboardResult localFrame={localFrame - 20} /> : result.kind === 'employee' ? <EmployeeResult localFrame={localFrame - 20} /> : rows.map((row, index) => <ResultRowItem key={`${row.name}-${index}`} index={index} localFrame={localFrame} row={row} />)}
      </div>
    </div>
  )
}

function ResultRowItem({ index, localFrame, row }: { index: number; localFrame: number; row: ResultRow }) {
  const compact = Boolean(row.background)
  const rowIn = p(localFrame, 46 + index * 14, 68 + index * 14)
  const complete = localFrame >= 106 + index * 14
  const alert = row.status.includes('Revisar') || row.status.includes('Atraso') || row.status.includes('Risco') || row.status.includes('Pendente')
  const statusBackground = row.background ?? (alert ? '#fff7ed' : '#ecfdf3')
  const statusColor = row.background ? row.tone : alert ? '#c2410c' : '#166534'

  return (
    <div style={{ alignItems: 'center', display: 'grid', gap: 14, gridTemplateColumns: '46px 1fr auto 28px', height: compact ? 64 : 76, opacity: rowIn, padding: '0 22px', transform: `translateY(${(1 - rowIn) * 18}px)` }}>
      <div style={{ alignItems: 'center', background: row.tone, borderRadius: 16, color: '#ffffff', display: 'flex', fontSize: 16, fontWeight: 780, height: compact ? 42 : 46, justifyContent: 'center', width: compact ? 42 : 46 }}>{row.initials}</div>
      <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: compact ? 19 : 21, fontWeight: 630, letterSpacing: -0.1, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</strong>
        <span style={{ color: '#8a8a8a', fontSize: compact ? 14 : 15, fontWeight: 420, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description}</span>
      </div>
      <div style={{ alignItems: 'end', display: 'grid', gap: 7, justifyItems: 'start' }}>
        <span style={{ color: '#111111', fontSize: compact ? 16 : 18, fontWeight: 560, whiteSpace: 'nowrap' }}>{row.value}</span>
        <span style={{ background: statusBackground, borderRadius: 999, color: statusColor, fontSize: compact ? 13 : 15, fontWeight: 760, padding: compact ? '5px 8px' : '7px 10px', whiteSpace: 'nowrap' }}>{complete ? row.status : 'Sincronizando'}</span>
      </div>
      <Spinner active={!complete} />
    </div>
  )
}

function DashboardResult({ localFrame }: { localFrame: number }) {
  const kpis = [
    ['Caixa', 'R$ 418k', '#16a34a'],
    ['Margem', '31,2%', '#2563eb'],
    ['Lucro', '+R$ 74k', '#7c3aed'],
  ]
  return (
    <div style={{ display: 'grid', gap: 14, padding: '4px 22px 0' }}>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {kpis.map(([label, value, color], index) => {
          const itemIn = p(localFrame, index * 8, 18 + index * 8)
          return (
            <div key={label} style={{ background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 18, opacity: itemIn, padding: 16, transform: `translateY(${(1 - itemIn) * 12}px)` }}>
              <div style={{ color: '#667085', fontSize: 15, fontWeight: 650 }}>{label}</div>
              <div style={{ color, fontSize: 25, fontWeight: 840, marginTop: 6 }}>{value}</div>
            </div>
          )
        })}
      </div>
      <div style={{ alignItems: 'end', background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 22, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(7,1fr)', height: 170, padding: '26px 24px' }}>
        {[72, 108, 84, 142, 118, 166, 136].map((height, index) => {
          const bar = p(localFrame, 34 + index * 6, 54 + index * 6)
          return <span key={height} style={{ background: index > 4 ? '#16a34a' : '#dbe5ee', borderRadius: '10px 10px 4px 4px', display: 'block', height: height * bar, minHeight: 8 }} />
        })}
      </div>
      <InsightBlock localFrame={localFrame - 84} text="Decisao sugerida: reduzir CAC em Meta Ads e renegociar fornecedor Cloud para proteger margem e caixa." value="+R$ 38k impacto estimado" />
    </div>
  )
}

function EmployeeResult({ localFrame }: { localFrame: number }) {
  const items = ['Rotina semanal configurada', 'Permissoes com aprovacao humana', 'Sistemas conectados ao Otto', 'Funcionario de IA ativo']
  return (
    <div style={{ display: 'grid', gap: 12, padding: '4px 24px 0' }}>
      <div style={{ background: '#050505', borderRadius: 26, color: '#ffffff', padding: 26 }}>
        <div style={{ color: '#52d273', fontSize: 18, fontWeight: 760 }}>Novo funcionario</div>
        <div style={{ fontSize: 34, fontWeight: 840, letterSpacing: -0.3, marginTop: 8 }}>Analista de fornecedores</div>
        <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 18, lineHeight: 1.32, marginTop: 8 }}>Revisa contratos, compras e pendencias toda sexta-feira.</div>
      </div>
      {items.map((item, index) => {
        const itemIn = p(localFrame, 38 + index * 8, 56 + index * 8)
        return (
          <div key={item} style={{ alignItems: 'center', background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 16, display: 'grid', gap: 12, gridTemplateColumns: '30px 1fr auto', opacity: itemIn, padding: '12px 14px', transform: `translateY(${(1 - itemIn) * 10}px)` }}>
            <span style={{ alignItems: 'center', background: '#16a34a', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 16, fontWeight: 820, height: 30, justifyContent: 'center', width: 30 }}>✓</span>
            <span style={{ color: '#111111', fontSize: 18, fontWeight: 620 }}>{item}</span>
            <span style={{ color: '#166534', fontSize: 15, fontWeight: 720 }}>OK</span>
          </div>
        )
      })}
    </div>
  )
}

function InsightBlock({ localFrame, text, value }: { localFrame: number; text: string; value: string }) {
  const cardIn = p(localFrame, 0, 18)
  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 18, opacity: cardIn, padding: 18, transform: `translateY(${(1 - cardIn) * 12}px)` }}>
      <div style={{ color: '#166534', fontSize: 22, fontWeight: 840 }}>{value}</div>
      <div style={{ color: '#37664a', fontSize: 16, fontWeight: 520, lineHeight: 1.28, marginTop: 7 }}>{text}</div>
    </div>
  )
}

function AgentChatScene({ scene, start }: { scene: AgentScene; start: number }) {
  const frame = useCurrentFrame()
  const local = Math.max(0, frame - start)
  const duration = scene.actions.length === 1 ? 790 : scene.actions.length === 2 ? 930 : 1120
  const opacity = p(frame, start - 10, start + 14) * p(frame, start + duration - 28, start + duration, [1, 0])
  const conversationY = stagedScroll(local, scene.actions.length)
  let cursor = 150

  return (
    <div style={{ inset: 0, opacity, position: 'absolute' }}>
      <ChatGptMobileShell conversationY={conversationY} promptInputBottom={36}>
        <ChatGptFlowUserBubble style={fadeOnlyStyle(local, 8)}>{scene.prompt}</ChatGptFlowUserBubble>
        <ChatGptFlowAssistantText style={sequence(local, 62)}>{scene.intro}</ChatGptFlowAssistantText>
        {scene.actions.map((action, index) => {
          const toolStart = cursor
          const resultStart = toolStart + 58
          const summaryStart = resultStart + 166
          cursor = summaryStart + (action.summary ? 118 : 46)
          return (
            <FragmentBlock key={`${action.tool}-${index}`}>
              {action.text ? <ChatGptFlowAssistantText showHeader={false} style={sequence(local, toolStart - 36)}>{action.text}</ChatGptFlowAssistantText> : null}
              <ChatGptToolCallCard style={sequence(local, toolStart)} toolName={action.tool} />
              <ChatGptToolResultCard style={sequence(local, resultStart)}>
                <CascadeResultCard localFrame={local - resultStart} result={action.result} />
              </ChatGptToolResultCard>
              {action.summary ? <ChatGptFlowAssistantText showHeader={false} style={sequence(local, summaryStart)}>{action.summary}</ChatGptFlowAssistantText> : null}
            </FragmentBlock>
          )
        })}
      </ChatGptMobileShell>
    </div>
  )
}

function FragmentBlock({ children }: { children: ReactNode }) {
  return <>{children}</>
}

const scenes: AgentScene[] = [
  {
    actions: [
      {
        result: {
          rows: [
            row('Receita Shopify', 'Pedido importado e reconhecido', 'R$ 18.400', 'Receita', 'SH', '#95bf47', '#f4faee'),
            row('Cliente Norte', 'Servico aprovado no mes', 'R$ 42.100', 'Receita', 'CN', '#0ea5e9', '#eff8ff'),
            row('Google Ads', 'Campanha de aquisicao', 'R$ 4.720', 'Marketing', 'G', '#4285f4', '#eef6ff'),
            row('Meta Ads', 'Midia paga para remarketing', 'R$ 3.460', 'Marketing', 'M', '#1877f2', '#edf5ff'),
            row('AWS Brasil', 'Infraestrutura recorrente', 'R$ 3.980', 'Software', 'AW', '#111827', '#f4f4f5'),
            row('OpenAI API', 'Automacao e atendimento', 'R$ 1.280', 'Software', 'AI', '#10a37f', '#ecfdf3'),
            row('Impostos federais', 'Guia mensal vinculada', 'R$ 12.300', 'Impostos', 'TX', '#f97316', '#fff7ed'),
            row('Frete Sul', 'Envios e operacao logistica', 'R$ 2.450', 'Logistica', 'FS', '#dc2626', '#fff1f2'),
          ],
          subtitle: 'Receitas, despesas, categorias e centros de custo',
          title: 'Classificacao automatica',
        },
        summary: 'Receitas e despesas foram organizadas por categoria, com itens recorrentes prontos para regra automatica.',
        tool: 'classificar_receitas_despesas',
      },
    ],
    intro: 'Vou organizar receitas e despesas, sugerir categorias e separar o que precisar de revisao.',
    prompt: 'Organize e classifique receitas e despesas.',
  },
  {
    actions: [
      {
        result: {
          rows: [
            row('PIX Cliente Norte', 'NF-9031 encontrada no Otto', 'R$ 42.100', 'Conciliado', 'CN', '#0ea5e9', '#eff8ff'),
            row('Cartao Stone', 'Lote-552 validado', 'R$ 68.900', 'Conciliado', 'ST', '#111827', '#f4f4f5'),
            row('Boleto Rede Alpha', 'Recebimento do retainer', 'R$ 18.600', 'Conciliado', 'RA', '#1877f2', '#edf5ff'),
            row('Shopify Payout', 'Repasse de ecommerce', 'R$ 12.780', 'Conciliado', 'SH', '#95bf47', '#f4faee'),
            row('Tarifa bancaria', 'Sem lancamento no ERP', 'R$ 189', 'Revisar', 'BI', '#f97316', '#fff7ed'),
            row('Boleto Mercado Sul', 'Recebimento parcial', 'R$ 8.400', 'Divergencia', 'MS', '#dc2626', '#fff1f2'),
            row('Google Ads', 'Debito no cartao corporativo', 'R$ 4.720', 'Conciliado', 'G', '#4285f4', '#eef6ff'),
            row('Fornecedor Cloud', 'Pagamento sem pedido vinculado', 'R$ 18.400', 'Revisar', 'FC', '#7c3aed', '#f5f3ff'),
          ],
          subtitle: 'Banco, cartao e lancamentos no Otto',
          title: 'Matching financeiro',
        },
        summary: 'Conciliacao concluida com matches seguros, duas revisoes e uma divergencia para ajustar no Otto.',
        tool: 'conciliar_bancos_cartoes',
      },
    ],
    intro: 'Vou cruzar bancos, cartoes e movimentacoes financeiras com os lancamentos do Otto.',
    prompt: 'Concilie bancos, cartoes e movimentacoes financeiras.',
  },
  {
    actions: [
      {
        result: {
          kind: 'table',
          rows: [
            row('AWS Brasil', 'Vence em 3 dias', 'R$ 12.790', 'Prioridade', 'AW', '#111827'),
            row('Google Ads', 'Midia paga recorrente', 'R$ 8.420', 'A vencer', 'G', '#4285f4'),
            row('Impostos federais', 'Vencimento do mes', 'R$ 31.200', 'Prioridade', 'TX', '#f97316'),
            row('Frete Sul', 'Despesa acima do padrao', 'R$ 6.830', 'Revisar', 'FS', '#dc2626'),
          ],
          subtitle: 'Vencimentos, prioridades e risco',
          title: 'Contas a pagar',
        },
        summary: 'Encontrei R$ 59.240 em vencimentos proximos. Impostos e AWS exigem prioridade.',
        text: 'Vou levantar as contas a pagar primeiro.',
        tool: 'buscar_contas_a_pagar',
      },
      {
        result: {
          kind: 'table',
          rows: [
            row('Cliente Norte', 'NF-9031 vence em 5 dias', 'R$ 42.100', 'Previsto', 'CN', '#0ea5e9'),
            row('Rede Alpha', 'Retainer de performance', 'R$ 18.600', 'A vencer', 'RA', '#1877f2'),
            row('Mercado Sul', 'Pagamento em atraso', 'R$ 28.900', 'Atraso', 'MS', '#dc2626'),
            row('Norte Foods', 'Projeto fiscal aprovado', 'R$ 31.400', 'Confirmado', 'NF', '#f97316'),
          ],
          subtitle: 'Entradas previstas e atrasos',
          title: 'Contas a receber',
        },
        summary: 'As entradas cobrem os vencimentos, mas Mercado Sul pressiona o caixa se atrasar mais 7 dias.',
        tool: 'buscar_contas_a_receber',
      },
      {
        result: {
          rows: [
            row('Fluxo de caixa', 'Risco em 12 dias se atraso continuar', 'R$ 38k', 'Risco', 'CX', '#2563eb'),
            row('Frete Sul', 'Despesa 22% acima da media', 'R$ 6.8k', 'Economizar', 'FS', '#dc2626'),
            row('Meta Ads', 'CAC subiu com margem menor', 'R$ 14k', 'Revisar', 'M', '#1877f2'),
          ],
          subtitle: 'Alertas de caixa e economia',
          title: 'Analise de risco',
        },
        summary: 'Recomendo renegociar frete e pausar campanhas de baixo retorno para proteger caixa e margem.',
        tool: 'analisar_fluxo_caixa',
      },
    ],
    intro: 'Vou seguir em etapas: contas a pagar, depois contas a receber, e por fim fluxo de caixa e economia.',
    prompt: 'Acompanhe contas, fluxo de caixa e encontre gastos fora do padrao.',
  },
  {
    actions: [
      {
        result: {
          rows: [
            row('Fornecedor Cloud', 'Pedido de renovacao anual', 'R$ 18.400', 'Aprovar', 'FC', '#111827'),
            row('Grafica Delta', 'Pedido de materiais', 'R$ 3.200', 'Pendente', 'GD', '#7c3aed'),
            row('Transportadora Sul', 'Frete de ecommerce', 'R$ 6.830', 'Revisar', 'TS', '#dc2626'),
            row('Bling pedidos', 'Compras importadas', '12 pedidos', 'Sincronizado', 'BL', '#16a34a'),
          ],
          subtitle: 'Pedidos, fornecedores, valores e status',
          title: 'Compras e fornecedores',
        },
        summary: 'Pedidos e fornecedores foram organizados. Separei o frete para revisao por sair do padrao.',
        text: 'Vou buscar pedidos abertos e fornecedores vinculados.',
        tool: 'buscar_compras_pedidos',
      },
      {
        result: {
          rows: [
            row('NF Fornecedor Cloud', 'Nota e contrato vinculados', 'PDF/XML', 'Organizado', 'NF', '#f97316'),
            row('Pedido Grafica Delta', 'Cotacao e aprovacao anexadas', '2 docs', 'Organizado', 'GD', '#7c3aed'),
            row('Frete Sul', 'Comprovante sem centro de custo', '1 doc', 'Pendente', 'FS', '#dc2626'),
          ],
          subtitle: 'NF, pedido, contrato e comprovante',
          title: 'Documentos de compras',
        },
        summary: 'Documentos de compras foram vinculados aos pedidos. Uma pendencia ficou aberta para aprovacao.',
        tool: 'organizar_documentos_compras',
      },
    ],
    intro: 'Vou organizar compras em duas etapas: primeiro pedidos e fornecedores, depois documentos e pendencias.',
    prompt: 'Organize compras, fornecedores, pedidos e documentos relacionados.',
  },
  {
    actions: [
      {
        result: {
          rows: [
            row('Proposta Cliente Norte', 'Servico aprovado', 'R$ 12.400', 'Registrada', 'CN', '#0ea5e9'),
            row('Venda Mercado Sul', 'Pedido importado', 'R$ 28.900', 'Registrada', 'MS', '#dc2626'),
            row('Rede Alpha', 'Retainer renovado', 'R$ 18.600', 'Registrada', 'RA', '#1877f2'),
          ],
          subtitle: 'Propostas, vendas e clientes',
          title: 'Vendas registradas',
        },
        summary: 'Vendas e propostas foram registradas. Agora vou emitir as notas correspondentes.',
        tool: 'registrar_propostas_vendas',
      },
      {
        result: {
          rows: [
            row('NFS-e 2048', 'Cliente Norte Ltda', 'R$ 12.400', 'Emitida', 'NF', '#16a34a'),
            row('NFS-e 2049', 'Rede Alpha', 'R$ 18.600', 'Emitida', 'NF', '#16a34a'),
            row('Mercado Sul', 'Aguardando dados fiscais', 'R$ 28.900', 'Pendente', 'MS', '#dc2626'),
          ],
          subtitle: 'Notas fiscais correspondentes',
          title: 'Notas emitidas',
        },
        summary: 'Duas notas foram emitidas. Mercado Sul ficou pendente por dados fiscais incompletos.',
        text: 'Vou emitir as notas fiscais correspondentes.',
        tool: 'emitir_notas_fiscais',
      },
      {
        result: {
          rows: [
            row('Cliente Norte', 'Boleto e PIX enviados', 'R$ 12.400', 'Enviado', 'CN', '#0ea5e9'),
            row('Rede Alpha', 'Cobranca recorrente enviada', 'R$ 18.600', 'Enviado', 'RA', '#1877f2'),
            row('Mercado Sul', 'Aguardando nota fiscal', 'R$ 28.900', 'Pendente', 'MS', '#dc2626'),
          ],
          subtitle: 'Cobrancas para clientes',
          title: 'Cobrancas enviadas',
        },
        summary: 'Cobrancas enviadas e registradas no historico financeiro dos clientes.',
        text: 'Vou enviar as cobrancas aos clientes.',
        tool: 'enviar_cobrancas_clientes',
      },
    ],
    intro: 'Vou registrar propostas e vendas, emitir as notas e enviar as cobrancas na ordem correta.',
    prompt: 'Registre propostas e vendas, emita notas e envie cobrancas.',
  },
  {
    actions: [
      {
        result: {
          rows: [
            row('Contratos', 'Anexos assinados e vencimentos', '6 docs', 'Organizado', 'CT', '#2563eb'),
            row('Comprovantes', 'Pagamentos e recibos do mes', '9 docs', 'Organizado', 'CP', '#16a34a'),
            row('Notas fiscais', 'PDF, XML e tomador', '12 docs', 'Organizado', 'NF', '#f97316'),
            row('Juridico Delta', 'Contrato aguardando assinatura', '1 doc', 'Pendente', 'JD', '#7c3aed'),
          ],
          subtitle: 'Contratos, comprovantes, XMLs e notas',
          title: 'Documentos encontrados',
        },
        summary: 'Documentos organizados por tipo. Um contrato ainda precisa assinatura.',
        tool: 'buscar_documentos_comprovantes',
      },
      {
        result: {
          rows: [
            row('ISS', 'Vencimento acompanhado', '5 dias', 'Em dia', 'IS', '#16a34a'),
            row('DAS', 'Guia mensal separada', 'R$ 8.200', 'Pronto', 'DA', '#f97316'),
            row('DCTFWeb', 'Declaracao a revisar', '1 item', 'Pendente', 'DF', '#dc2626'),
          ],
          subtitle: 'Obrigacoes financeiras e fiscais',
          title: 'Obrigacoes acompanhadas',
        },
        summary: 'Obrigacoes foram acompanhadas. DCTFWeb ficou como pendencia para revisao.',
        text: 'Vou verificar as obrigacoes financeiras e fiscais.',
        tool: 'verificar_obrigacoes_fiscais',
      },
    ],
    intro: 'Vou primeiro organizar documentos, comprovantes e notas; depois verifico obrigacoes.',
    prompt: 'Organize documentos, comprovantes, notas fiscais e obrigacoes.',
  },
  {
    actions: [
      {
        result: {
          rows: [
            row('Mercado Sul', '28 dias em atraso', 'R$ 28.900', 'Prioridade', 'MS', '#dc2626'),
            row('Cliente Norte', '12 dias em atraso', 'R$ 42.100', 'Prioridade', 'CN', '#0ea5e9'),
            row('Loja Prime', 'Boleto venceu ontem', 'R$ 8.400', 'Acompanhar', 'LP', '#f97316'),
          ],
          subtitle: 'Clientes, valores e dias em atraso',
          title: 'Clientes em atraso',
        },
        summary: 'Mercado Sul e Cliente Norte exigem prioridade. Vou acompanhar cada cobranca.',
        tool: 'buscar_clientes_em_atraso',
      },
      {
        result: {
          rows: [
            row('Mercado Sul', 'Follow-up agendado', 'Amanha', 'Aguardando', 'MS', '#dc2626'),
            row('Cliente Norte', 'PIX recebido parcialmente', 'R$ 18.000', 'Recebido', 'CN', '#0ea5e9'),
            row('Loja Prime', 'Mensagem reenviada', 'WhatsApp', 'Enviado', 'LP', '#25d366'),
          ],
          subtitle: 'Follow-up, pagamento e proximo envio',
          title: 'Acompanhamento de cobranca',
        },
        summary: 'Cobrancas acompanhadas e historico atualizado no contas a receber.',
        text: 'Vou acompanhar status das cobrancas.',
        tool: 'acompanhar_cobrancas',
      },
    ],
    intro: 'Vou buscar clientes em atraso e depois acompanhar o processo de cobranca.',
    prompt: 'Monitore clientes em atraso e acompanhe as cobrancas.',
  },
  {
    actions: [
      {
        result: {
          kind: 'dashboard',
          subtitle: 'KPIs, graficos e analise em tempo real',
          title: 'Dashboard do negocio',
        },
        summary: 'Dashboard gerado com caixa, margem, lucro, inadimplencia e performance operacional.',
        tool: 'gerar_dashboard_tempo_real',
      },
      {
        result: {
          rows: [
            row('Margem', 'Renegociar fornecedor Cloud', '+R$ 18k', 'Decisao', 'MG', '#7c3aed'),
            row('Caixa', 'Antecipar Cliente Norte', '+R$ 24k', 'Decisao', 'CX', '#2563eb'),
            row('Lucro', 'Reduzir campanha de baixo ROI', '+R$ 14k', 'Decisao', 'LC', '#16a34a'),
          ],
          subtitle: 'Impacto em margem, caixa e lucro',
          title: 'Recomendacoes',
        },
        summary: 'As decisoes priorizadas podem aumentar margem, caixa e lucro nos proximos 30 dias.',
        text: 'Vou apontar decisoes para margem, caixa e lucro.',
        tool: 'gerar_recomendacoes_negocio',
      },
    ],
    intro: 'Vou transformar tudo em dashboard e depois gerar recomendacoes praticas para o negocio.',
    prompt: 'Transforme os dados em relatorios, dashboards e decisoes.',
  },
  {
    actions: [
      {
        result: {
          kind: 'employee',
          subtitle: 'Rotina, permissoes e aprovacao humana',
          title: 'Funcionario de IA criado',
        },
        summary: 'Funcionario criado e pronto para automatizar o processo com seguranca e aprovacao humana.',
        tool: 'criar_funcionario_ia',
      },
    ],
    intro: 'Vou criar um funcionario de IA com rotina, permissoes e limites de execucao dentro do Otto.',
    prompt: 'Crie um funcionario de IA para automatizar um processo da minha empresa.',
  },
]

function row(name: string, description: string, value: string, status: string, initials: string, tone: string, background?: string): ResultRow {
  return { background, description, initials, name, status, tone, value }
}

export function ChatGptClaudeOttoAiEmployeesVideo() {
  const frame = useCurrentFrame()
  const starts = [300, 1120, 1940, 3100, 4400, 5700, 7000, 8200, 9400]

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#111111', fontFamily: FONT, overflow: 'hidden' }}>
      <CompatibilityOpening start={0} />
      {scenes.map((scene, index) => {
        const start = starts[index] + 110
        return (
          <FragmentBlock key={scene.prompt}>
            <AgentChatScene scene={scene} start={start} />
            <PromptInputScene frame={frame} prompt={scene.prompt} start={starts[index]} />
          </FragmentBlock>
        )
      })}
    </AbsoluteFill>
  )
}
