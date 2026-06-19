import type { ComponentType } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import {
  ChatGptActionRow,
  ChatGptFlowAssistantText,
  ChatGptFlowUserBubble,
  ChatGptMobileShell,
  ChatGptToolCallCard,
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

export function ChatGptMobileAnimation() {
  return <ChatGptMobileMarketingAnimation />
}
