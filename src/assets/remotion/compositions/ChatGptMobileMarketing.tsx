import type { ComponentType } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import {
  ChatGptActionRow,
  ChatGptFlowAssistantText,
  ChatGptFlowUserBubble,
  ChatGptMobileShell,
  ChatGptToolCallCard,
  ChatGptToolResultCard,
  chatGptSequenceStyle,
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

export const CHATGPT_FINANCIAL_AGENTS_VIDEO_DURATION = 1230

type FinancialAgentStep = {
  insight: string
  result: 'cash' | 'collections' | 'docs' | 'expenses' | 'margin' | 'reconcile' | 'timeline'
  text: string
  toolName: string
}

const financialAgentSteps: FinancialAgentStep[] = [
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
    [0, 210, 360, 510, 660, 810, 960, 1110],
    [0, 0, -360, -740, -1120, -1500, -1880, -2260],
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

      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 74, 22)}>
        Claro. Vou acionar seus agentes financeiros e trazer prioridades, riscos e oportunidades.
      </ChatGptFlowAssistantText>

      {financialAgentSteps.map((step, index) => {
        const start = 150 + index * 140
        return (
          <div key={step.toolName} style={{ display: 'contents' }}>
            <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, start, 22)}>
              {step.text}
            </ChatGptFlowAssistantText>
            <ChatGptToolCallCard
              style={chatGptSequenceStyle(frame, start + 52, 16)}
              toolName={step.toolName}
            />
            <ChatGptToolResultCard style={chatGptSequenceStyle(frame, start + 100, 18)}>
              <FinancialResultCard kind={step.result} startFrame={start + 100} />
            </ChatGptToolResultCard>
            <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, start + 174, 22)}>
              {step.insight}
            </ChatGptFlowAssistantText>
          </div>
        )
      })}

      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 1148, 18)}>
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

      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 1200, 18)}>
        Seu financeiro operando direto pelo ChatGPT ou Claude.
      </ChatGptFlowAssistantText>
    </ChatGptMobileShell>
  )
}

export function ChatGptMobileAnimation() {
  return <ChatGptMobileMarketingAnimation />
}
