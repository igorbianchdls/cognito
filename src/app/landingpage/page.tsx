'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { MessageSquare } from 'lucide-react'

import { ensureSimpleIconsRegistered, renderIntegrationLogo } from '@/products/integracoes/shared/iconMaps'

const NODE_IDS = ['n-erp', 'n-google', 'n-meta', 'n-gads', 'n-tele', 'n-crm', 'n-comm', 'n-analytics']
const NODE_COLORS = ['#00d4ff', '#ea4335', '#1877f2', '#fbbc04', '#10b981', '#a855f7', '#6366f1', '#f59e0b']

type NodeDef = {
  id: string
  left: string
  top: string
  color: string
  title: string
  subtitle: string
  iconItems: ReactNode[]
}

function brandLogo(slug: string, name: string, key?: string) {
  return (
    <span key={key ?? slug} className="brand-icon" aria-label={name} title={name}>
      {renderIntegrationLogo(slug, name)}
    </span>
  )
}

function customSimpleIcon(iconKey: string, name: string) {
  ensureSimpleIconsRegistered()
  return (
    <span key={iconKey} className="brand-icon" aria-label={name} title={name}>
      <Icon icon={`simple-icons:${iconKey}`} width={20} height={20} />
    </span>
  )
}

function smsIcon() {
  return (
    <span key="sms" className="brand-icon brand-icon-sms" aria-label="SMS" title="SMS">
      <MessageSquare size={20} strokeWidth={2} />
    </span>
  )
}

const LANDING_NODES: NodeDef[] = [
  {
    id: 'n-erp',
    left: '50%',
    top: '10%',
    color: 'rgba(0,212,255,0.4)',
    title: 'Google Workspace',
    subtitle: 'Gmail · Drive · Sheets',
    iconItems: [
      brandLogo('GMAIL', 'Gmail'),
      brandLogo('GOOGLEDRIVE', 'Google Drive'),
      brandLogo('GOOGLESHEETS', 'Google Sheets'),
    ],
  },
  {
    id: 'n-google',
    left: '83%',
    top: '20%',
    color: 'rgba(234,67,53,0.4)',
    title: 'Comunicação',
    subtitle: 'WhatsApp · Slack · SMS',
    iconItems: [brandLogo('WHATSAPP', 'WhatsApp'), brandLogo('SLACK', 'Slack'), smsIcon()],
  },
  {
    id: 'n-meta',
    left: '93%',
    top: '52%',
    color: 'rgba(24,119,242,0.4)',
    title: 'Mídia Paga',
    subtitle: 'Google Ads · Meta Ads',
    iconItems: [brandLogo('GOOGLEADS', 'Google Ads'), brandLogo('METAADS', 'Meta Ads')],
  },
  {
    id: 'n-gads',
    left: '78%',
    top: '82%',
    color: 'rgba(251,188,4,0.4)',
    title: 'Growth Stack',
    subtitle: 'Analytics · HubSpot · Mailchimp',
    iconItems: [
      brandLogo('GOOGLE_ANALYTICS', 'Google Analytics'),
      brandLogo('HUBSPOT', 'HubSpot'),
      brandLogo('MAILCHIMP', 'Mailchimp'),
    ],
  },
  {
    id: 'n-tele',
    left: '37%',
    top: '90%',
    color: 'rgba(16,185,129,0.4)',
    title: 'Pagamentos',
    subtitle: 'Stripe · Mercado Pago',
    iconItems: [brandLogo('STRIPE', 'Stripe'), customSimpleIcon('mercadopago', 'Mercado Pago')],
  },
  {
    id: 'n-crm',
    left: '10%',
    top: '78%',
    color: 'rgba(168,85,247,0.4)',
    title: 'Marketplace',
    subtitle: 'Amazon',
    iconItems: [customSimpleIcon('amazon', 'Amazon')],
  },
  {
    id: 'n-comm',
    left: '6%',
    top: '46%',
    color: 'rgba(99,102,241,0.4)',
    title: 'Execução',
    subtitle: 'Rotinas · Alertas · Ações',
    iconItems: [brandLogo('WHATSAPP', 'WhatsApp', 'wpp-exec'), brandLogo('GMAIL', 'Gmail', 'gmail-exec')],
  },
  {
    id: 'n-analytics',
    left: '18%',
    top: '18%',
    color: 'rgba(245,158,11,0.4)',
    title: 'Ops Sheets',
    subtitle: 'Planilhas · Automações',
    iconItems: [brandLogo('GOOGLESHEETS', 'Google Sheets', 'sheets-ops')],
  },
]

const LANDING_FEATURE_CARDS = [
  {
    tag: 'Unificação',
    title: 'Conecta ferramentas e dados em uma camada única',
    description:
      'Centralize CRM, financeiro, marketing, atendimento e planilhas sem depender de consolidação manual todo dia.',
    points: ['Integrações com APIs e apps do stack', 'Dados operacionais no mesmo contexto', 'Base pronta para automações e IA'],
  },
  {
    tag: 'Automação',
    title: 'Orquestra processos recorrentes com regras claras',
    description:
      'Dispare fluxos, notificações e ações entre sistemas com lógica de negócio, filtros e gatilhos por evento.',
    points: ['Rotinas programadas e event-driven', 'Alertas por canal (WhatsApp, e-mail, Slack)', 'Redução de retrabalho operacional'],
  },
  {
    tag: 'Visibilidade',
    title: 'Dashboards vivos para operação e gestão',
    description:
      'Monte visões por área com métricas, filtros e drill-down para acompanhar desempenho em tempo real.',
    points: ['Painéis por time ou processo', 'Filtros compartilhados e visões acionáveis', 'Do insight para ação no mesmo fluxo'],
  },
  {
    tag: 'Execução',
    title: 'IA para interpretar, priorizar e agir',
    description:
      'Use a camada de IA para resumir sinais, sugerir próximos passos e automatizar ações a partir dos dados.',
    points: ['Resumos executivos automáticos', 'Detecção de desvios e padrões', 'Ações guiadas por contexto operacional'],
  },
  {
    tag: 'Governança',
    title: 'Padroniza o processo sem travar o time',
    description:
      'Defina regras, trilhas e acessos por domínio para escalar operação com consistência e segurança.',
    points: ['Permissões por fluxo e módulo', 'Estrutura reutilizável por área', 'Menos dependência de conhecimento tácito'],
  },
  {
    tag: 'Escala',
    title: 'Começa com um fluxo e expande por módulos',
    description:
      'Implemente rápido no problema mais crítico e evolua para uma operação integrada sem refazer a base.',
    points: ['Entrada por caso de uso prioritário', 'Arquitetura modular para crescimento', 'Aproveita integrações já conectadas'],
  },
] as const

const LANDING_STEPS = [
  {
    step: '01',
    title: 'Conecte o stack',
    text: 'Integre CRM, ERP, mídia, comunicação e planilhas. O NEXUS normaliza os dados e mantém tudo sincronizado.',
  },
  {
    step: '02',
    title: 'Modele a operação',
    text: 'Crie dashboards, filtros, regras e automações por time. Cada processo vira uma rotina observável e executável.',
  },
  {
    step: '03',
    title: 'Execute com IA',
    text: 'Receba alertas, resumos e próximos passos. A equipe age com contexto e reduz tempo entre diagnóstico e execução.',
  },
] as const

const LANDING_USE_CASES = [
  {
    team: 'Comercial',
    title: 'Pipeline, follow-up e performance em um só fluxo',
    items: ['Visibilidade de funil e metas', 'Alertas de lead parado e SLA', 'Ações de follow-up por gatilho'],
  },
  {
    team: 'Financeiro',
    title: 'Conciliação e gestão operacional com menos retrabalho',
    items: ['Visão de recebíveis e inadimplência', 'Consolidação automática de bases', 'Alertas de desvio e pendências críticas'],
  },
  {
    team: 'Marketing',
    title: 'Dados de campanha conectados à operação real',
    items: ['Mídia + CRM + vendas no mesmo painel', 'Leitura rápida de CAC/ROAS/qualidade', 'Rotinas de ajuste e reporte'],
  },
  {
    team: 'Operações',
    title: 'Execução diária monitorada e padronizada',
    items: ['Checklists e eventos automatizados', 'Alertas por exceção operacional', 'Mais previsibilidade de entrega'],
  },
] as const

const LANDING_DATA_INSIGHTS_CARDS = [
  {
    tag: 'Dados',
    title: 'Todos os dados do seu negócio em um só lugar',
    description: 'Conecte todas as suas fontes de dados em poucos cliques. Sem precisar de engenharia.',
  },
  {
    tag: 'Dashboards',
    title: 'Crie dashboards ao vivo em minutos',
    description: 'Curva de aprendizado zero. Descreva quais gráficos você precisa e veja tudo aparecer.',
  },
  {
    tag: 'Insights',
    title: 'Converse com seus dados para gerar insights',
    description: 'Faça perguntas em linguagem natural e receba análises detalhadas com gráficos relacionados.',
  },
] as const

const LANDING_DATA_STACK_ITEMS = [
  { name: 'Meta Ads', icon: brandLogo('METAADS', 'Meta Ads', 'stack-metaads') },
  { name: 'Google Ads', icon: brandLogo('GOOGLEADS', 'Google Ads', 'stack-googleads') },
  { name: 'Google Analytics', icon: brandLogo('GOOGLE_ANALYTICS', 'Google Analytics', 'stack-ga') },
  { name: 'HubSpot', icon: brandLogo('HUBSPOT', 'HubSpot', 'stack-hubspot') },
  { name: 'Mailchimp', icon: brandLogo('MAILCHIMP', 'Mailchimp', 'stack-mailchimp') },
  { name: 'Gmail', icon: brandLogo('GMAIL', 'Gmail', 'stack-gmail') },
  { name: 'Google Drive', icon: brandLogo('GOOGLEDRIVE', 'Google Drive', 'stack-drive') },
  { name: 'Google Sheets', icon: brandLogo('GOOGLESHEETS', 'Google Sheets', 'stack-sheets') },
  { name: 'WhatsApp', icon: brandLogo('WHATSAPP', 'WhatsApp', 'stack-whatsapp') },
  { name: 'Slack', icon: brandLogo('SLACK', 'Slack', 'stack-slack') },
  { name: 'Stripe', icon: brandLogo('STRIPE', 'Stripe', 'stack-stripe') },
  { name: 'Mercado Pago', icon: customSimpleIcon('mercadopago', 'Mercado Pago') },
] as const

function nodeCardStyle(color: string): CSSProperties {
  return { ['--node-color' as string]: color } as CSSProperties
}

export default function LandingPage() {
  const diagramRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const svg = svgRef.current
    const diagram = diagramRef.current
    if (!svg || !diagram) return

    const getCenter = (el: Element) => {
      const pr = diagram.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      return {
        x: ((r.left + r.width / 2 - pr.left) / pr.width) * 900,
        y: ((r.top + r.height / 2 - pr.top) / pr.height) * 580,
      }
    }

    const drawConnections = () => {
      const svgEl = svgRef.current
      const diagramEl = diagramRef.current
      if (!svgEl || !diagramEl) return

      svgEl.innerHTML = ''
      const coreEl = diagramEl.querySelector('.core')
      if (!coreEl) return
      const core = getCenter(coreEl)

      NODE_IDS.forEach((id, i) => {
        const el = document.getElementById(id)
        if (!el) return
        const p = getCenter(el)
        const color = NODE_COLORS[i]

        const dx = p.x - core.x
        const dy = p.y - core.y
        const mx = core.x + dx * 0.5
        const my = core.y + dy * 0.5

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        const pathId = `landing-conn-${i}`
        const d = `M ${core.x} ${core.y} Q ${mx + dy * 0.15} ${my - dx * 0.15} ${p.x} ${p.y}`
        path.setAttribute('id', pathId)
        path.setAttribute('d', d)
        path.setAttribute('stroke', color)
        path.setAttribute('stroke-width', '1.2')
        path.setAttribute('stroke-opacity', '0.35')
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke-dasharray', '4 6')
        svgEl.appendChild(path)

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle.setAttribute('r', '3')
        circle.setAttribute('fill', color)
        circle.setAttribute('filter', `drop-shadow(0 0 4px ${color})`)
        svgEl.appendChild(circle)

        const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion')
        anim.setAttribute('dur', `${2.5 + i * 0.4}s`)
        anim.setAttribute('repeatCount', 'indefinite')
        anim.setAttribute('begin', `${i * 0.3}s`)
        const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath')
        mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${pathId}`)
        anim.appendChild(mpath)
        circle.appendChild(anim)

        const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle2.setAttribute('r', '2')
        circle2.setAttribute('fill', color)
        circle2.setAttribute('opacity', '0.5')
        svgEl.appendChild(circle2)

        const anim2 = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion')
        anim2.setAttribute('dur', `${3 + i * 0.35}s`)
        anim2.setAttribute('repeatCount', 'indefinite')
        anim2.setAttribute('begin', `${1.2 + i * 0.25}s`)
        anim2.setAttribute('keyPoints', '1;0')
        anim2.setAttribute('keyTimes', '0;1')
        anim2.setAttribute('calcMode', 'linear')
        const mpath2 = document.createElementNS('http://www.w3.org/2000/svg', 'mpath')
        mpath2.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${pathId}`)
        anim2.appendChild(mpath2)
        circle2.appendChild(anim2)
      })
    }

    const t1 = window.setTimeout(drawConnections, 100)
    const onResize = () => window.setTimeout(drawConnections, 50)
    window.addEventListener('resize', onResize)
    return () => {
      window.clearTimeout(t1)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <>
      <div className="landingpage-root">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="header">
          <div className="logo-badge">AI-Powered · Enterprise OS</div>
          <h1>NEXUS OS</h1>
          <p className="subtitle">// tudo conectado. um único sistema operacional de negócios</p>
        </div>

        <div className="diagram" id="diagram" ref={diagramRef}>
          <svg className="connections" id="svg-connections" ref={svgRef} viewBox="0 0 900 580" />

          <div className="core" style={{ left: '50%', top: '50%' }}>
            <div className="core-ring">
              <div className="core-dot" />
            </div>
            <div className="core-ring" />
            <div className="core-ring" />
            <div className="core-inner">
              <div className="core-ai">AI</div>
              <div className="core-label">
                NEXUS
                <br />
                ENGINE
              </div>
            </div>
          </div>

          {LANDING_NODES.map((node) => (
            <div className="node" id={node.id} key={node.id} style={{ left: node.left, top: node.top }}>
              <div className="node-card" style={nodeCardStyle(node.color)}>
                <span className="node-icon">{node.iconItems}</span>
                <div className="node-name">{node.title}</div>
                <div className="node-sub">{node.subtitle}</div>
                <div className="node-status">LIVE</div>
              </div>
            </div>
          ))}
        </div>

        <div className="stats-bar">
          <div className="stat">
            <div className="stat-value">14+</div>
            <div className="stat-label">Plataformas Conectadas</div>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <div className="stat-value">∞</div>
            <div className="stat-label">Fluxos de Dados</div>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <div className="stat-value">1</div>
            <div className="stat-label">Lugar só</div>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <div className="stat-value">AI</div>
            <div className="stat-label">Inteligência Central</div>
          </div>
        </div>

        <section className="lp-copy-section lp-copy-section--features">
          <div className="lp-copy-head">
            <div className="lp-copy-kicker">O que faz</div>
            <h2>Uma camada operacional que conecta dados, automações e execução</h2>
            <p>
              O NEXUS OS funciona como um sistema operacional para o negócio: integra seu stack, organiza os fluxos e
              entrega contexto para decisões e ações em tempo real.
            </p>
          </div>

          <div className="lp-feature-grid">
            {LANDING_FEATURE_CARDS.map((card) => (
              <article key={card.title} className="lp-saas-card lp-saas-card--feature">
                <div className="lp-saas-card__tag">{card.tag}</div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <ul className="lp-saas-list">
                  {card.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-copy-section lp-copy-section--steps">
          <div className="lp-copy-head">
            <div className="lp-copy-kicker">Como funciona</div>
            <h2>Do stack fragmentado para uma operação orquestrada</h2>
            <p>
              Implementação em fases, começando pelo processo mais crítico. Você ganha resultado rápido sem perder base
              de escala.
            </p>
          </div>

          <div className="lp-steps-grid">
            {LANDING_STEPS.map((item) => (
              <article key={item.step} className="lp-saas-card lp-saas-card--step">
                <div className="lp-step-badge">{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-copy-section lp-copy-section--usecases">
          <div className="lp-copy-head">
            <div className="lp-copy-kicker">Casos de uso</div>
            <h2>Aplicação prática por time, sem virar ferramenta genérica</h2>
            <p>
              Cada área opera com a sua visão, mas dentro da mesma arquitetura. Isso reduz silos e acelera a execução
              ponta a ponta.
            </p>
          </div>

          <div className="lp-usecase-grid">
            {LANDING_USE_CASES.map((useCase) => (
              <article key={useCase.team} className="lp-saas-card lp-saas-card--usecase">
                <div className="lp-usecase-pill">{useCase.team}</div>
                <h3>{useCase.title}</h3>
                <ul className="lp-saas-list">
                  {useCase.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-copy-section lp-copy-section--data-insights">
          <div className="lp-copy-head">
            <div className="lp-copy-kicker">Dados e insights</div>
            <h2>Conecte todos os seus dados e gere insights</h2>
            <p>
              Entenda seu negócio com mais profundidade fazendo perguntas e recebendo respostas com gráficos e contexto.
            </p>
          </div>

          <div className="lp-data-insights-grid">
            {LANDING_DATA_INSIGHTS_CARDS.map((card) => (
              <article key={card.title} className="lp-saas-card lp-saas-card--feature lp-saas-card--data">
                <div className="lp-saas-card__tag">{card.tag}</div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-copy-section lp-copy-section--stack">
          <div className="lp-copy-head">
            <div className="lp-copy-kicker">Integrações</div>
            <h2>Conecte toda a sua stack de dados</h2>
            <p>
              Reúna suas fontes de dados em um único lugar. Sem ficar pulando entre plataformas para entender sua
              performance.
            </p>
          </div>

          <div className="lp-stack-grid">
            {LANDING_DATA_STACK_ITEMS.map((item) => (
              <div key={item.name} className="lp-stack-item">
                <div className="lp-stack-item__icon">{item.icon}</div>
                <div className="lp-stack-item__name">{item.name}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-final-cta" aria-label="Call to action">
          <div className="lp-final-cta__content">
            <div className="lp-copy-kicker">Próximo passo</div>
            <h2>Veja seu stack funcionando como um sistema só</h2>
            <p>
              Comece com um fluxo prioritário e evolua para uma operação conectada com dashboards, automações e IA no
              mesmo ambiente.
            </p>
          </div>
          <div className="lp-final-cta__actions">
            <a className="lp-cta-btn lp-cta-btn--primary" href="/apps">
              Ver demos
            </a>
            <a className="lp-cta-btn lp-cta-btn--secondary" href="/apps/vendas">
              Abrir dashboard de exemplo
            </a>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

        .landingpage-root {
          --bg: #030508;
          --surface: #0a0e18;
          --border: rgba(100, 180, 255, 0.12);
          --glow: #00d4ff;
          --glow2: #7c3aed;
          --glow3: #10b981;
          --text: #e2eeff;
          --muted: #4a6080;
          --accent: #00d4ff;

          background: var(--bg);
          font-family: 'Syne', sans-serif;
          color: var(--text);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          overflow: hidden;
          position: relative;
          isolation: isolate;
        }

        .landingpage-root * {
          box-sizing: border-box;
        }

        .landingpage-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        .landingpage-root .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          opacity: 0.18;
          z-index: 0;
        }
        .landingpage-root .blob-1 {
          width: 600px;
          height: 600px;
          background: var(--glow2);
          top: -200px;
          left: -200px;
        }
        .landingpage-root .blob-2 {
          width: 500px;
          height: 500px;
          background: var(--glow);
          bottom: -150px;
          right: -100px;
        }
        .landingpage-root .blob-3 {
          width: 400px;
          height: 400px;
          background: var(--glow3);
          bottom: 100px;
          left: 30%;
          opacity: 0.1;
        }

        .landingpage-root .header {
          text-align: center;
          margin-bottom: 60px;
          position: relative;
          z-index: 10;
        }

        .landingpage-root .logo-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 212, 255, 0.08);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 100px;
          padding: 6px 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--glow);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        .landingpage-root .logo-badge::before {
          content: '';
          width: 6px;
          height: 6px;
          background: var(--glow);
          border-radius: 50%;
          animation: landing-pulse 2s infinite;
        }

        .landingpage-root h1 {
          font-size: clamp(42px, 7vw, 80px);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 0.95;
          color: #ffffff;
          margin: 0 0 16px;
        }

        .landingpage-root .subtitle {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: var(--muted);
          letter-spacing: 0.08em;
          margin: 0;
        }

        .landingpage-root .diagram {
          position: relative;
          width: min(900px, 100%);
          aspect-ratio: 900 / 580;
          z-index: 5;
        }

        .landingpage-root svg.connections {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
          z-index: 1;
        }

        .landingpage-root .core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 5;
          width: 160px;
          height: 160px;
        }

        .landingpage-root .core-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(0, 212, 255, 0.3);
          animation: landing-spin 20s linear infinite;
        }
        .landingpage-root .core-ring:nth-child(2) {
          inset: 12px;
          border-color: rgba(124, 58, 237, 0.4);
          animation-duration: 15s;
          animation-direction: reverse;
        }
        .landingpage-root .core-ring:nth-child(3) {
          inset: 24px;
          border-color: rgba(16, 185, 129, 0.3);
          animation-duration: 10s;
        }

        .landingpage-root .core-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          background: var(--glow);
          border-radius: 50%;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          box-shadow: 0 0 12px var(--glow);
        }

        .landingpage-root .core-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 96px;
          height: 96px;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, rgba(10, 14, 24, 0.9) 70%);
          border-radius: 50%;
          border: 1px solid rgba(0, 212, 255, 0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 40px rgba(0, 212, 255, 0.2), inset 0 0 30px rgba(0, 212, 255, 0.05);
        }

        .landingpage-root .core-label {
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          color: var(--glow);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-align: center;
          line-height: 1.4;
        }

        .landingpage-root .core-ai {
          font-size: 20px;
          font-weight: 800;
          background: linear-gradient(135deg, #00d4ff, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 4px;
        }

        .landingpage-root .node {
          position: absolute;
          z-index: 4;
          transform: translate(-50%, -50%);
        }

        .landingpage-root .node-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px 16px;
          min-width: 120px;
          text-align: center;
          cursor: default;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .landingpage-root .node-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--node-color, rgba(0, 212, 255, 0.05)), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .landingpage-root .node-card:hover {
          border-color: var(--node-color, var(--glow));
          transform: scale(1.05);
          box-shadow: 0 0 24px var(--node-color, rgba(0, 212, 255, 0.3));
        }

        .landingpage-root .node-card:hover::before {
          opacity: 1;
        }

        .landingpage-root .node-icon {
          font-size: 22px;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 24px;
          line-height: 1;
        }

        .landingpage-root .brand-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          flex: 0 0 auto;
        }

        .landingpage-root .brand-icon svg {
          width: 20px;
          height: 20px;
          display: block;
        }

        .landingpage-root .brand-icon-sms {
          color: var(--text);
          opacity: 0.95;
        }

        .landingpage-root .node-name {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text);
        }

        .landingpage-root .node-sub {
          font-size: 9px;
          font-family: 'JetBrains Mono', monospace;
          color: var(--muted);
          margin-top: 2px;
        }

        .landingpage-root .node-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          color: var(--glow3);
        }

        .landingpage-root .node-status::before {
          content: '';
          width: 4px;
          height: 4px;
          background: var(--glow3);
          border-radius: 50%;
          animation: landing-pulse 2s infinite;
        }

        .landingpage-root .particle {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          z-index: 3;
          pointer-events: none;
        }

        .landingpage-root .stats-bar {
          display: flex;
          gap: 32px;
          margin-top: 48px;
          position: relative;
          z-index: 10;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }

        .landingpage-root .stat {
          text-align: center;
        }

        .landingpage-root .stat-value {
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #00d4ff, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .landingpage-root .stat-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: var(--muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 4px;
        }

        .landingpage-root .stat-divider {
          width: 1px;
          background: var(--border);
          align-self: stretch;
          min-height: 36px;
        }

        .landingpage-root .lp-copy-section {
          width: min(1120px, 100%);
          margin-top: 54px;
          position: relative;
          z-index: 10;
        }

        .landingpage-root .lp-copy-head {
          margin: 0 auto 18px;
          width: min(860px, 100%);
          text-align: center;
        }

        .landingpage-root .lp-copy-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 5px 12px;
          border: 1px solid rgba(0, 212, 255, 0.16);
          background: rgba(0, 212, 255, 0.06);
          color: var(--glow);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .landingpage-root .lp-copy-kicker::before {
          content: '';
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--glow);
          box-shadow: 0 0 12px rgba(0, 212, 255, 0.5);
        }

        .landingpage-root .lp-copy-head h2 {
          margin: 0 0 10px;
          font-size: clamp(24px, 4vw, 38px);
          line-height: 1.06;
          letter-spacing: -0.03em;
          color: #edf4ff;
        }

        .landingpage-root .lp-copy-head p {
          margin: 0;
          color: #9fb2ce;
          font-size: 14px;
          line-height: 1.6;
          font-family: 'JetBrains Mono', monospace;
        }

        .landingpage-root .lp-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .landingpage-root .lp-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .landingpage-root .lp-usecase-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .landingpage-root .lp-data-insights-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .landingpage-root .lp-stack-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .landingpage-root .lp-saas-card {
          position: relative;
          border-radius: 16px;
          border: 1px solid rgba(116, 163, 255, 0.14);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.015)),
            rgba(10, 14, 24, 0.78);
          box-shadow:
            0 14px 38px rgba(2, 6, 23, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          overflow: hidden;
        }

        .landingpage-root .lp-saas-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, rgba(0, 212, 255, 0.06), transparent 38%),
            linear-gradient(315deg, rgba(124, 58, 237, 0.04), transparent 42%);
          pointer-events: none;
        }

        .landingpage-root .lp-saas-card h3 {
          position: relative;
          z-index: 1;
          margin: 0 0 8px;
          color: #edf4ff;
          font-size: 16px;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .landingpage-root .lp-saas-card p {
          position: relative;
          z-index: 1;
          margin: 0;
          color: #adc0da;
          font-size: 12px;
          line-height: 1.55;
          font-family: 'JetBrains Mono', monospace;
        }

        .landingpage-root .lp-saas-card--feature {
          padding: 14px 14px 12px;
          min-height: 214px;
          display: flex;
          flex-direction: column;
        }

        .landingpage-root .lp-saas-card__tag {
          position: relative;
          z-index: 1;
          align-self: flex-start;
          margin-bottom: 10px;
          border-radius: 999px;
          border: 1px solid rgba(0, 212, 255, 0.16);
          background: rgba(0, 212, 255, 0.06);
          color: #7dd3fc;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 4px 8px;
        }

        .landingpage-root .lp-saas-list {
          position: relative;
          z-index: 1;
          list-style: none;
          padding: 0;
          margin: 10px 0 0;
          display: grid;
          gap: 7px;
        }

        .landingpage-root .lp-saas-list li {
          position: relative;
          padding-left: 13px;
          color: #cfe0f7;
          font-size: 11px;
          line-height: 1.35;
          font-family: 'JetBrains Mono', monospace;
        }

        .landingpage-root .lp-saas-list li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 6px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(0, 212, 255, 0.85);
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.35);
        }

        .landingpage-root .lp-saas-card--step {
          padding: 14px;
          min-height: 170px;
          display: flex;
          flex-direction: column;
        }

        .landingpage-root .lp-step-badge {
          position: relative;
          z-index: 1;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          margin-bottom: 10px;
          color: #e2eeff;
          font-size: 12px;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
          border: 1px solid rgba(124, 58, 237, 0.26);
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(0, 212, 255, 0.08));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .landingpage-root .lp-saas-card--usecase {
          padding: 14px;
          min-height: 184px;
          display: flex;
          flex-direction: column;
        }

        .landingpage-root .lp-saas-card--data {
          min-height: 188px;
        }

        .landingpage-root .lp-stack-item {
          border-radius: 14px;
          border: 1px solid rgba(116, 163, 255, 0.14);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01)),
            rgba(10, 14, 24, 0.76);
          box-shadow:
            0 12px 28px rgba(2, 6, 23, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          min-height: 74px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .landingpage-root .lp-stack-item:hover {
          transform: translateY(-1px);
          border-color: rgba(0, 212, 255, 0.22);
          box-shadow:
            0 14px 30px rgba(2, 6, 23, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .landingpage-root .lp-stack-item__icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }

        .landingpage-root .lp-stack-item__name {
          color: #e7f0ff;
          font-size: 12px;
          line-height: 1.2;
          letter-spacing: -0.01em;
          font-weight: 700;
        }

        .landingpage-root .lp-usecase-pill {
          position: relative;
          z-index: 1;
          align-self: flex-start;
          margin-bottom: 10px;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid rgba(16, 185, 129, 0.22);
          background: rgba(16, 185, 129, 0.07);
          color: #6ee7b7;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .landingpage-root .lp-final-cta {
          width: min(1120px, 100%);
          margin-top: 56px;
          margin-bottom: 8px;
          position: relative;
          z-index: 10;
          border-radius: 20px;
          border: 1px solid rgba(116, 163, 255, 0.16);
          background:
            radial-gradient(circle at 15% 10%, rgba(0, 212, 255, 0.08), transparent 40%),
            radial-gradient(circle at 88% 18%, rgba(124, 58, 237, 0.08), transparent 44%),
            rgba(8, 12, 20, 0.84);
          box-shadow:
            0 20px 60px rgba(2, 6, 23, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 18px;
          display: grid;
          grid-template-columns: 1.4fr auto;
          gap: 18px;
          align-items: center;
        }

        .landingpage-root .lp-final-cta__content h2 {
          margin: 0 0 8px;
          font-size: clamp(22px, 3vw, 34px);
          line-height: 1.06;
          letter-spacing: -0.03em;
          color: #edf4ff;
        }

        .landingpage-root .lp-final-cta__content p {
          margin: 0;
          color: #aebfda;
          font-size: 13px;
          line-height: 1.6;
          font-family: 'JetBrains Mono', monospace;
          max-width: 66ch;
        }

        .landingpage-root .lp-final-cta__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }

        .landingpage-root .lp-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 42px;
          padding: 0 14px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: -0.01em;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
          white-space: nowrap;
        }

        .landingpage-root .lp-cta-btn:hover {
          transform: translateY(-1px);
        }

        .landingpage-root .lp-cta-btn--primary {
          color: #031019;
          background: linear-gradient(135deg, #00d4ff, #67e8f9);
          border: 1px solid rgba(103, 232, 249, 0.6);
          box-shadow: 0 8px 24px rgba(0, 212, 255, 0.2);
        }

        .landingpage-root .lp-cta-btn--secondary {
          color: #dbeafe;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(148, 163, 184, 0.22);
        }

        .landingpage-root .lp-cta-btn--secondary:hover {
          border-color: rgba(125, 211, 252, 0.4);
          background: rgba(125, 211, 252, 0.04);
        }

        .landingpage-root .chip {
          position: absolute;
          background: rgba(0, 212, 255, 0.06);
          border: 1px solid rgba(0, 212, 255, 0.15);
          border-radius: 100px;
          padding: 3px 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          color: var(--glow);
          letter-spacing: 0.08em;
          z-index: 6;
          animation: landing-float 3s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes landing-pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.4);
          }
        }

        @keyframes landing-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes landing-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @media (max-width: 900px) {
          .landingpage-root {
            justify-content: flex-start;
            padding: 28px 14px 32px;
          }

          .landingpage-root .header {
            margin-bottom: 24px;
          }

          .landingpage-root .subtitle {
            font-size: 11px;
            letter-spacing: 0.04em;
          }

          .landingpage-root .diagram {
            width: min(900px, 100vw - 16px);
          }

          .landingpage-root .node-card {
            min-width: 94px;
            padding: 8px 10px;
            border-radius: 12px;
          }

          .landingpage-root .node-icon {
            font-size: 18px;
            margin-bottom: 4px;
            gap: 6px;
            min-height: 20px;
          }

          .landingpage-root .brand-icon {
            width: 16px;
            height: 16px;
          }

          .landingpage-root .brand-icon svg {
            width: 16px;
            height: 16px;
          }

          .landingpage-root .node-name {
            font-size: 9px;
          }

          .landingpage-root .node-sub {
            display: none;
          }

          .landingpage-root .node-status {
            font-size: 7px;
            margin-top: 4px;
          }

          .landingpage-root .core {
            width: 120px;
            height: 120px;
          }

          .landingpage-root .core-inner {
            width: 72px;
            height: 72px;
          }

          .landingpage-root .core-ai {
            font-size: 16px;
          }

          .landingpage-root .core-label {
            font-size: 8px;
          }

          .landingpage-root .stats-bar {
            gap: 12px;
            margin-top: 20px;
          }

          .landingpage-root .lp-copy-section {
            margin-top: 26px;
          }

          .landingpage-root .lp-copy-head {
            margin-bottom: 12px;
          }

          .landingpage-root .lp-copy-head h2 {
            font-size: 22px;
          }

          .landingpage-root .lp-copy-head p {
            font-size: 11px;
            line-height: 1.5;
            letter-spacing: 0;
          }

          .landingpage-root .lp-feature-grid,
          .landingpage-root .lp-steps-grid,
          .landingpage-root .lp-usecase-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .landingpage-root .lp-data-insights-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .landingpage-root .lp-stack-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .landingpage-root .lp-saas-card--feature,
          .landingpage-root .lp-saas-card--step,
          .landingpage-root .lp-saas-card--usecase {
            min-height: 0;
          }

          .landingpage-root .lp-final-cta {
            margin-top: 28px;
            padding: 14px;
            grid-template-columns: 1fr;
            gap: 12px;
            border-radius: 16px;
          }

          .landingpage-root .lp-final-cta__content p {
            font-size: 11px;
            line-height: 1.5;
          }

          .landingpage-root .lp-final-cta__actions {
            justify-content: flex-start;
          }

          .landingpage-root .lp-cta-btn {
            width: 100%;
            height: 40px;
            font-size: 12px;
          }

          .landingpage-root .stat-value {
            font-size: 18px;
          }

          .landingpage-root .stat-label {
            font-size: 7px;
          }

          .landingpage-root .stat-divider {
            display: none;
          }
        }
      `}</style>
    </>
  )
}
