'use client'

import { useEffect, useRef, useState } from 'react'
import type { ComponentType, CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Landmark,
  LockKeyhole,
  MessageCircle,
  Mic,
  Plus,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { sfPro, sfProLandingStyle } from '@/assets/landingpages/otto/fonts'
import BlingIcon from '@/components/icons/BlingIcon'
import ContaAzulIcon from '@/components/icons/ContaAzulIcon'
import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon'
import MetaIcon from '@/components/icons/MetaIcon'
import OmieIcon from '@/components/icons/OmieIcon'
import ShopifyIcon from '@/components/icons/ShopifyIcon'

type IconComponent = ComponentType<{ className?: string }>

type SyncRow = {
  description: string
  icon?: IconComponent
  initials?: string
  name: string
  tone: string
}

type ChatStep = {
  description: string
  icon: ReactNode
  name: string
  status: string
  tone: 'green' | 'blue' | 'amber' | 'red' | 'slate'
}

type ResultRow = {
  amount?: string
  color?: string
  description: string
  erp?: string
  icon?: IconComponent
  initials: string
  name: string
  result: string
  tone: ChatStep['tone']
  value?: string
}

type ExpenseResult = ResultRow & {
  amount: string
  color: string
}

type ReconciliationResult = ResultRow & {
  color: string
  erp: string
  value: string
}

const integrationRows: SyncRow[] = [
  { description: 'ERP financeiro - notas, clientes e contas', icon: ContaAzulIcon, name: 'Conta Azul', tone: '#1d7cff' },
  { description: 'ERP e gestao - financeiro e fiscal', icon: OmieIcon, name: 'Omie', tone: '#0f9f70' },
  { description: 'Pedidos, estoque e notas fiscais', icon: BlingIcon, name: 'Bling', tone: '#16a34a' },
  { description: 'Campanhas, custos e conversoes', icon: GoogleAdsIcon, name: 'Google Ads', tone: '#4285f4' },
  { description: 'Midia paga e aquisicao', icon: MetaIcon, name: 'Meta Ads', tone: '#1877f2' },
  { description: 'Pedidos, receita e clientes', icon: ShopifyIcon, name: 'Shopify', tone: '#95bf47' },
  { description: 'Extratos, PIX, boletos e cartoes', initials: 'BK', name: 'Banco', tone: '#111827' },
  { description: 'Cobrancas e conversas com clientes', initials: 'WA', name: 'WhatsApp', tone: '#25d366' },
]

const financeSteps: ChatStep[] = [
  { description: 'OpenAI API - Software - R$ 1.280', icon: <ReceiptText size={18} />, name: 'Classificar despesas', status: '6 regras aplicadas', tone: 'green' },
  { description: 'PIX Cliente Norte x NF-9031', icon: <Landmark size={18} />, name: 'Conciliar bancos', status: '5 matches seguros', tone: 'blue' },
  { description: 'Tarifa bancaria sem lancamento', icon: <FileCheck2 size={18} />, name: 'Separar revisoes', status: '1 item', tone: 'amber' },
]

const cashSteps: ChatStep[] = [
  { description: 'Vencimentos dos proximos 15 dias', icon: <CircleDollarSign size={18} />, name: 'Contas a pagar', status: 'R$ 127.300', tone: 'red' },
  { description: 'Entradas previstas e atrasos leves', icon: <CircleDollarSign size={18} />, name: 'Contas a receber', status: 'R$ 202.200', tone: 'green' },
  { description: 'Relatorio, dashboard e tendencia', icon: <BarChart3 size={18} />, name: 'Fluxo de caixa', status: 'Atualizado', tone: 'blue' },
  { description: 'Frete, midia paga e inadimplencia', icon: <Sparkles size={18} />, name: 'Insights de margem', status: '4 achados', tone: 'amber' },
]

const approvalSteps: ChatStep[] = [
  { description: 'Google Ads, AWS, Meta Ads e impostos', icon: <LockKeyhole size={18} />, name: 'Pagamentos acima de R$ 1.000', status: '6 itens', tone: 'amber' },
  { description: '3 seguros, 2 agendados e 1 retido', icon: <ShieldCheck size={18} />, name: 'Aprovacao humana', status: 'Aguardando', tone: 'blue' },
  { description: 'Historico com autor, regra e horario', icon: <FileCheck2 size={18} />, name: 'Trilha de auditoria', status: 'Salva', tone: 'green' },
]

const fiscalSteps: ChatStep[] = [
  { description: 'PDF, XML, OS e dados do tomador', icon: <FileText size={18} />, name: 'Documentos fiscais', status: 'Validado', tone: 'green' },
  { description: 'ISS, DAS, DCTFWeb e certidoes', icon: <ReceiptText size={18} />, name: 'Obrigacoes fiscais', status: 'Em dia', tone: 'blue' },
  { description: 'Nota fiscal do ultimo servico aprovado', icon: <FileCheck2 size={18} />, name: 'Emitir NFS-e', status: 'Emitida', tone: 'green' },
]

const collectionSteps: ChatStep[] = [
  { description: 'Cliente Norte, Rede Alpha e Mercado Sul', icon: <CircleDollarSign size={18} />, name: 'Inadimplentes', status: 'R$ 71.000', tone: 'red' },
  { description: 'Tom, PIX, boleto e follow-up', icon: <MessageCircle size={18} />, name: 'Preparar cobrancas', status: 'Pronto', tone: 'blue' },
  { description: 'Mensagens enviadas e historico salvo', icon: <MessageCircle size={18} />, name: 'WhatsApp', status: 'Enviado', tone: 'green' },
]

const financeBentos = [
  { alt: 'Visão de contas a pagar do Otto', description: 'Fornecedores, vencimentos e aprovações em uma fila clara.', src: '/BentoContasAPagar.webp', title: 'Contas a pagar' },
  { alt: 'Visão de contas a receber do Otto', description: 'Recebíveis, atrasos e cobranças conectados ao caixa.', src: '/BentoContasAReceber.webp', title: 'Contas a receber' },
  { alt: 'Visão de DRE do Otto', description: 'Resultado, despesas e margem explicados com contexto.', src: '/BentoDRE.webp', title: 'DRE' },
]

const managementBentos = [
  { alt: 'Visão de forecasting do Otto', description: 'Projeções de receita e caixa para antecipar decisões.', src: '/BentoForcasting.webp', title: 'Forecasting' },
  { alt: 'Visão de dashboard do Otto', description: 'Indicadores essenciais reunidos em uma visão executiva.', src: '/BentoDashboard.webp', title: 'Dashboard' },
  { alt: 'Visão de receita do Otto', description: 'Receita por canal, cliente e período sem planilhas soltas.', src: '/BentoRevenue.webp', title: 'Receita' },
]

const aiFeatureItems = [
  { description: 'Pergunte sobre caixa, margem e resultado e veja gráficos surgirem no fluxo.', kind: 'analysis', prompt: 'Analise margem por canal', title: 'Análise de dados' },
  { description: 'Transforme dados financeiros em dashboards visuais para acompanhar a operação.', kind: 'dashboard', prompt: 'Crie um dashboard financeiro', title: 'Criar dashboard' },
  { description: 'Acione funcionários de IA para investigar, explicar e executar rotinas financeiras.', kind: 'agents', prompt: 'Acione meus agentes de IA', title: 'Agentes de IA' },
]

const CLAUDE_ICON_PATH = 'm4.714 15.956l4.718-2.648l.079-.23l-.08-.128h-.23l-.79-.048l-2.695-.073l-2.337-.097l-2.265-.122l-.57-.121l-.535-.704l.055-.353l.48-.321l.685.06l1.518.104l2.277.157l1.651.098l2.447.255h.389l.054-.158l-.133-.097l-.103-.098l-2.356-1.596l-2.55-1.688l-1.336-.972l-.722-.491L2 6.223l-.158-1.008l.656-.722l.88.06l.224.061l.893.686l1.906 1.476l2.49 1.833l.364.304l.146-.104l.018-.072l-.164-.274l-1.354-2.446l-1.445-2.49l-.644-1.032l-.17-.619a3 3 0 0 1-.103-.729L6.287.133L6.7 0l.995.134l.42.364l.619 1.415L9.735 4.14l1.555 3.03l.455.898l.243.832l.09.255h.159V9.01l.127-1.706l.237-2.095l.23-2.695l.08-.76l.376-.91l.747-.492l.583.28l.48.685l-.067.444l-.286 1.851l-.558 2.903l-.365 1.942h.213l.243-.242l.983-1.306l1.652-2.064l.728-.82l.85-.904l.547-.431h1.032l.759 1.129l-.34 1.166l-1.063 1.347l-.88 1.142l-1.263 1.7l-.79 1.36l.074.11l.188-.02l2.853-.606l1.542-.28l1.84-.315l.832.388l.09.395l-.327.807l-1.967.486l-2.307.462l-3.436.813l-.043.03l.049.061l1.548.146l.662.036h1.62l3.018.225l.79.522l.473.638l-.08.485l-1.213.62l-1.64-.389l-3.825-.91l-1.31-.329h-.183v.11l1.093 1.068l2.003 1.81l2.508 2.33l.127.578l-.321.455l-.34-.049l-2.204-1.657l-.85-.747l-1.925-1.62h-.127v.17l.443.649l2.343 3.521l.122 1.08l-.17.353l-.607.213l-.668-.122l-1.372-1.924l-1.415-2.168l-1.141-1.943l-.14.08l-.674 7.254l-.316.37l-.728.28l-.607-.461l-.322-.747l.322-1.476l.388-1.924l.316-1.53l.285-1.9l.17-.632l-.012-.042l-.14.018l-1.432 1.967l-2.18 2.945l-1.724 1.845l-.413.164l-.716-.37l.066-.662l.401-.589l2.386-3.036l1.439-1.882l.929-1.086l-.006-.158h-.055L4.138 18.56l-1.13.146l-.485-.456l.06-.746l.231-.243l1.907-1.312Z'

const OPENAI_ICON_PATH = 'M22.282 9.821a6 6 0 0 0-.516-4.91a6.05 6.05 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a6 6 0 0 0-3.998 2.9a6.05 6.05 0 0 0 .743 7.097a5.98 5.98 0 0 0 .51 4.911a6.05 6.05 0 0 0 6.515 2.9A6 6 0 0 0 13.26 24a6.06 6.06 0 0 0 5.772-4.206a6 6 0 0 0 3.997-2.9a6.06 6.06 0 0 0-.747-7.073M13.26 22.43a4.48 4.48 0 0 1-2.876-1.04l.141-.081l4.779-2.758a.8.8 0 0 0 .392-.681v-6.737l2.02 1.168a.07.07 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494M3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085l4.783 2.759a.77.77 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646M2.34 7.896a4.5 4.5 0 0 1 2.366-1.973V11.6a.77.77 0 0 0 .388.677l5.815 3.354l-2.02 1.168a.08.08 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.08.08 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667m2.01-3.023l-.141-.085l-4.774-2.782a.78.78 0 0 0-.785 0L9.409 9.23V6.897a.07.07 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.8.8 0 0 0-.393.681zm1.097-2.365l2.602-1.5l2.607 1.5v2.999l-2.597 1.5l-2.607-1.5Z'

function ClaudeWordmark() {
  return (
    <img alt="Claude" className="mx-1 inline-block h-[0.82em] w-auto translate-y-[0.07em]" src="/claudeLogo.svg" />
  )
}

function ChatGptWordmark() {
  return (
    <img alt="ChatGPT" className="mx-1 inline-block h-[1.2em] w-auto translate-y-[0.12em]" src="/gptLogo.svg" />
  )
}

function WordmarkPlus() {
  return (
    <svg aria-hidden="true" className="mx-1 inline-block h-[0.56em] w-[0.56em] translate-y-[0.03em]" viewBox="0 0 24 24">
      <path d="M12 5V19M5 12H19" fill="none" stroke="#f8f8f8" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function Section({
  children,
  id,
  layout = 'split',
  subtitle,
  theme = 'light',
  title,
}: {
  children: ReactNode
  eyebrow: string
  id: string
  layout?: 'split' | 'stacked'
  subtitle: string
  theme?: 'light' | 'dark' | 'warm' | 'green'
  title: string
}) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [hasEntered, setHasEntered] = useState(false)
  const isDark = theme === 'dark' || theme === 'green'
  const background = theme === 'dark' ? 'bg-[#050505]' : theme === 'green' ? 'bg-[#06130d]' : theme === 'warm' ? 'bg-[#f5f1eb]' : 'bg-[#f7f8fa]'
  const border = isDark ? 'border-white/10' : 'border-black/10'
  const text = isDark ? 'text-[#f8fafc]' : 'text-[#111111]'
  const muted = isDark ? 'text-white/70' : 'text-[#111111]'
  const sectionPadding = isDark ? 'py-8 sm:py-28 md:py-32' : 'py-8 sm:py-20'
  const sectionGap = isDark ? 'gap-14 lg:gap-16' : 'gap-10'
  useEffect(() => {
    const element = sectionRef.current
    if (!element || hasEntered) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasEntered(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -18% 0px', threshold: 0.22 },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [hasEntered])

  return (
    <section ref={sectionRef} id={id} className={`landing-animate-scope border-b ${border} ${background} px-0 ${sectionPadding} sm:px-8 ${hasEntered ? 'landing-in-view' : ''}`}>
      <div className={`mx-auto grid max-w-[1180px] ${sectionGap} ${layout === 'stacked' ? '' : 'lg:grid-cols-[0.9fr_1.1fr] lg:items-center'}`}>
        <div className={`px-6 text-center sm:px-0 ${layout === 'stacked' ? 'mx-auto max-w-[820px]' : ''}`}>
          <h2
            className="mx-auto max-w-[900px] !text-[30px] md:!text-[45px]"
            style={{ color: isDark ? '#f8f8f8' : '#111111', fontFamily: 'Inter, var(--font-sf-pro), -apple-system, BlinkMacSystemFont, system-ui, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}
          >
            {title}
          </h2>
          <p
            className="mx-auto mt-7 max-w-[760px] text-[22px] md:text-lg"
            style={{ color: isDark ? '#f8f8f8' : '#111111', fontFamily: 'Inter, var(--font-sf-pro), -apple-system, BlinkMacSystemFont, system-ui, sans-serif', fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.6 }}
          >
            {subtitle}
          </p>
        </div>
        <div className={`px-1 sm:px-0 ${layout === 'stacked' ? 'min-w-0' : ''}`}>{children}</div>
      </div>
    </section>
  )
}

function IntegrationIcon({ row }: { row: SyncRow }) {
  const Icon = row.icon

  return (
    <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-black/10 bg-white" style={{ color: row.tone }}>
      {Icon ? <Icon className="h-8 w-8" /> : <span className="grid size-8 place-items-center rounded-xl text-[13px] font-bold text-white" style={{ background: row.tone }}>{row.initials}</span>}
    </div>
  )
}

function BentoGallery({ items }: { items: Array<{ alt: string; description: string; src: string; title: string }> }) {
  return (
    <div className="px-1 pb-2 md:px-0">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {items.map((item) => (
          <figure key={item.src} className="overflow-hidden rounded-[28px] border border-black/10 bg-white p-2">
            <figcaption className="px-4 pb-4 pt-4">
              <h3 className="text-[17px] font-semibold leading-tight tracking-[-0.02em] text-[#111111]">{item.title}</h3>
              <p className="mt-2 text-sm font-normal leading-5 tracking-[-0.01em] text-[#9ca3af]">{item.description}</p>
            </figcaption>
            <img
              src={item.src}
              alt={item.alt}
              className="block h-auto w-full rounded-[22px]"
            />
          </figure>
        ))}
      </div>
    </div>
  )
}

function CodexChartsFeatureCard({ description, kind, prompt, title }: { description: string; kind: string; prompt: string; title: string }) {
  const bars = [56, 76, 48, 88, 64, 96]
  const dashboardCards = [
    ['Caixa', 'R$ 418k', '+12%'],
    ['Receber', 'R$ 202k', '8 dias'],
    ['Pagar', 'R$ 127k', '15 dias'],
    ['Margem', '31,2%', '+2,3 p.p.'],
  ]
  const agentRows = [
    ['Classificador', 'Despesas organizadas', 'Feito'],
    ['Conciliador', 'Bancos conferidos', 'Feito'],
    ['Analista', 'Insights de margem', 'Ativo'],
    ['Cobranca', 'Clientes priorizados', 'Pronto'],
  ]

  return (
    <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white p-2">
      <div className="px-4 pb-4 pt-4">
        <h3 className="text-[17px] font-semibold leading-tight tracking-[-0.02em] text-[#111111]">{title}</h3>
        <p className="mt-2 text-sm font-normal leading-5 tracking-[-0.01em] text-[#9ca3af]">{description}</p>
      </div>
      <div
        className="landing-codex-chart overflow-hidden rounded-[24px] bg-[#f7f8fa]"
        style={{ aspectRatio: '16 / 9', minHeight: 168 }}
      >
        <div className="landing-codex-prompt">
          <span>+</span>
          <p>
            <span className="landing-codex-typed">{prompt}</span>
            <i />
          </p>
          <strong>↑</strong>
        </div>
        <div className={`landing-codex-card landing-codex-card-${kind}`}>
          <div className="landing-codex-card-header">
            <div>
              <strong>{title}</strong>
              <span>Atualizado agora</span>
            </div>
            <em>Otto</em>
          </div>
          {kind === 'dashboard' ? (
            <>
              <div className="landing-codex-dashboard-grid">
                {dashboardCards.map(([label, value, meta], index) => (
                  <span key={label} style={{ animationDelay: `${0.22 + index * 0.12}s` }}>
                    <small>{label}</small>
                    <strong>{value}</strong>
                    <em>{meta}</em>
                  </span>
                ))}
              </div>
              <div className="landing-codex-dashboard-chart">
                {bars.slice(0, 5).map((height, index) => (
                  <i key={`${height}-${index}`} style={{ '--bar-height': `${height}%`, animationDelay: `${index * 0.12 + 0.35}s` } as CSSProperties} />
                ))}
              </div>
            </>
          ) : kind === 'agents' ? (
            <div className="landing-codex-agents">
              {agentRows.map(([name, task, status], index) => (
                <div key={name} style={{ animationDelay: `${0.2 + index * 0.16}s` }}>
                  <span><Sparkles size={12} /></span>
                  <p><strong>{name}</strong><small>{task}</small></p>
                  <em>{status}</em>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="landing-codex-kpis">
                <span>Margem <strong>31,2%</strong></span>
                <span>Caixa <strong>R$ 418k</strong></span>
                <span>Receita <strong>+18%</strong></span>
              </div>
              <div className="landing-codex-bars">
                {bars.map((height, index) => (
                  <i key={`${height}-${index}`} style={{ '--bar-height': `${height}%`, animationDelay: `${index * 0.12 + 0.35}s` } as CSSProperties} />
                ))}
              </div>
              <div className="landing-codex-insight">
                <Sparkles size={13} />
                <span>Insight: Google Ads cresce com margem acima do plano.</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CodexChartsFeatureGallery() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {aiFeatureItems.map((item) => (
        <CodexChartsFeatureCard key={item.title} description={item.description} kind={item.kind} prompt={item.prompt} title={item.title} />
      ))}
    </div>
  )
}

function SyncStatus({ index }: { index: number }) {
  const delay = `${0.42 + index * 0.62}s`

  return (
    <div className="landing-sync-status flex min-w-[132px] justify-end" style={{ animationDelay: delay }}>
      <span className="landing-sync-loading inline-flex items-center gap-2 rounded-full bg-[#f1f5f9] px-3 py-2 text-sm font-semibold text-[#475569]">
        <span className="size-3 rounded-full border-2 border-[#94a3b8] border-r-[#111827]" />
        Sincronizando
      </span>
      <span className="landing-sync-done hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
        <Check size={15} strokeWidth={2} />
        Sincronizado
      </span>
    </div>
  )
}

function DataConnectionSync() {
  return (
    <div className="rounded-[30px] border border-black/10 bg-white p-4 md:p-6">
      <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-5">
        <div>
          <p className="text-[24px] font-semibold tracking-[-0.02em] text-[#111827]">Conectando fontes de dados</p>
          <p className="mt-1 text-sm font-medium text-[#667085]">ERPs, bancos, anuncios, e-commerce e canais financeiros</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">8 fontes</span>
      </div>
      <div className="mt-2 grid">
        {integrationRows.map((row, index) => (
          <div
            key={row.name}
            className="landing-sync-row grid min-h-[76px] grid-cols-[48px_1fr_auto] items-center gap-4 border-b border-black/[0.06] py-3 last:border-b-0"
            style={{ animationDelay: `${index * 0.62}s` }}
          >
            <IntegrationIcon row={row} />
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold text-[#111827]">{row.name}</p>
              <p className="mt-1 truncate text-sm font-medium text-[#7a8290]">{row.description}</p>
            </div>
            <SyncStatus index={index} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatAutomationPanel({ dark = false, steps, title }: { dark?: boolean; steps: ChatStep[]; title: string }) {
  const stepGap = 2.75
  const finalDelay = 4.9 + steps.length * stepGap
  const scrollDistance = 260 + steps.reduce((total, step) => total + (step.name === 'Classificar despesas' || step.name === 'Conciliar bancos' ? 430 : 320), 0)

  return (
    <div className={`overflow-hidden rounded-[26px] border bg-white text-[#111111] ${dark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="flex h-14 items-center justify-between bg-white px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-[#111111] text-xs font-bold text-white">O</span>
            <span className="text-[15px] font-semibold text-[#111111]">ChatGPT</span>
          </div>
          <span className="rounded-full bg-[#f7f7f7] px-3 py-1.5 text-xs font-medium text-[#6b6b6b]">Otto ativo</span>
        </div>
        <div className="relative min-h-[560px] bg-white p-3 sm:p-5">
          <div className="landing-prompt-input absolute bottom-3 left-3 right-3 z-20 flex h-[58px] items-center gap-2 overflow-hidden rounded-[28px] bg-[#f1f1f1] px-3 py-2 sm:bottom-5 sm:left-5 sm:right-5 sm:gap-3 sm:rounded-full sm:px-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full text-[#333333]">
              <Plus size={22} strokeWidth={1.8} />
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="landing-typed-prompt text-[14px] font-normal leading-5 text-[#111111] sm:text-[15px]">{title}</span>
              <span className="landing-caret ml-0.5 inline-block h-5 w-[2px] translate-y-1 bg-[#111827]" />
              <span className="landing-input-placeholder absolute left-0 top-1/2 -translate-y-1/2 text-[15px] font-normal text-[#777777]">Mensagem para Otto</span>
            </span>
            <span className="ml-auto grid size-9 shrink-0 place-items-center rounded-full bg-[#111111] text-white">
              <Mic size={17} strokeWidth={2} />
            </span>
          </div>
          <div className="landing-chat-scroll absolute bottom-[112px] left-3 right-3 top-3 overflow-x-hidden overflow-y-auto sm:bottom-[92px] sm:left-5 sm:right-5 sm:top-5">
            <div className="landing-chat-scroll-content pb-4" style={{ ['--landing-scroll-y' as string]: `${scrollDistance}px` }}>
              <div className="landing-user-question ml-auto max-w-[88%] rounded-[24px] bg-[#f1f1f1] px-4 py-3 text-[#111111] sm:max-w-[82%] sm:rounded-[28px] sm:px-5 sm:py-4">
                <p className="break-words text-[15px] font-normal leading-6 sm:text-[16px]">{title}</p>
              </div>
              <div className="landing-sequence-item mt-5" style={{ animationDelay: '2.95s' }}>
                <div className="max-w-[92%]">
                  <p className="text-[16px] font-normal leading-7 text-[#111111]">
                    Claro. Vou consultar as fontes conectadas, executar as ferramentas certas e retornar os resultados com pontos de revisao.
                  </p>
                </div>
              </div>
              {steps.map((step, index) => {
                const baseDelay = 4 + index * stepGap
                return (
                  <div key={step.name} className="grid gap-3">
                    <AssistantText delay={baseDelay} text={`Vou chamar ${step.name.toLowerCase()} para cruzar os dados e montar o resultado.`} />
                    <div className="landing-sequence-item grid w-full gap-2" style={{ animationDelay: `${baseDelay + 0.48}s` }}>
                      <ToolCallCard name={step.name.toLowerCase().replaceAll(' ', '_')} />
                      <ToolResultTable delay={baseDelay + 0.68} step={step} />
                    </div>
                    <AssistantText delay={baseDelay + 2.18} text={`${step.name} concluido: ${step.status}. ${step.description}.`} />
                  </div>
                )
              })}
              <div className="landing-sequence-item mt-5 grid w-full gap-3" style={{ animationDelay: `${finalDelay}s` }}>
                <OutlineArtifact steps={steps} />
              </div>
              <div className="landing-sequence-item mt-5" style={{ animationDelay: `${finalDelay + 0.82}s` }}>
                <div className="max-w-[92%]">
                  <p className="text-[16px] font-normal leading-7 text-[#111111]">
                    Pronto. Executei a rotina, gerei o artefato de acompanhamento e separei os itens sensiveis para revisao.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}

function DesktopChatAutomationPanel({ steps, title }: { steps: ChatStep[]; title: string }) {
  const stepGap = 2.65
  const finalDelay = 4.7 + steps.length * stepGap
  const scrollDistance = 180 + steps.reduce((total, step) => total + (step.name === 'Classificar despesas' || step.name === 'Conciliar bancos' ? 360 : 260), 0)

  return (
    <div className="overflow-hidden rounded-[22px] border border-black/10 bg-white text-[#111111] sm:rounded-[26px]">
      <div className="grid min-h-[560px] grid-cols-1 bg-white md:grid-cols-[190px_1fr]">
        <aside className="hidden border-r border-[#eeeeee] bg-[#f7f7f8] p-3 md:block">
          <div className="flex h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#111111]">
            <span className="grid size-7 place-items-center rounded-full bg-[#111111] text-[10px] font-bold text-white">O</span>
            Otto no ChatGPT
          </div>
          <div className="mt-4 grid gap-1 text-sm font-medium text-[#555555]">
            {['Financeiro', 'Conciliação', 'Relatórios', 'Aprovações'].map((item, index) => (
              <span key={item} className={`rounded-xl px-3 py-2 ${index === 0 ? 'bg-white text-[#111111]' : ''}`}>{item}</span>
            ))}
          </div>
        </aside>

        <div className="relative min-h-[560px] min-w-0 bg-white p-3 sm:p-5">
          <div className="flex h-11 items-center justify-between border-b border-[#f0f0f0] pb-3">
            <div>
              <p className="text-[15px] font-semibold text-[#111111]">ChatGPT</p>
              <p className="truncate text-xs font-medium text-[#777777]">Otto conectado aos dados financeiros</p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 sm:px-3 sm:text-xs">Tools ativas</span>
          </div>

          <div className="landing-chat-scroll absolute bottom-[92px] left-3 right-3 top-[76px] overflow-x-hidden overflow-y-auto sm:left-5 sm:right-5">
            <div className="landing-chat-scroll-content pb-4" style={{ ['--landing-scroll-y' as string]: `${scrollDistance}px` }}>
              <div className="landing-user-question ml-auto max-w-[88%] rounded-[22px] bg-[#f1f1f1] px-4 py-3 text-[#111111] sm:max-w-[76%] sm:rounded-[24px] sm:px-5 sm:py-4">
                <p className="break-words text-[14px] font-normal leading-5 sm:text-[16px] sm:leading-6">{title}</p>
              </div>
              <div className="landing-sequence-item mt-5 max-w-[94%] sm:mt-6 sm:max-w-[84%]" style={{ animationDelay: '2.8s' }}>
                <p className="text-[14px] font-normal leading-6 text-[#111111] sm:text-[16px] sm:leading-7">
                  Vou analisar os lancamentos, cruzar banco e ERP, classificar despesas e separar o que precisa de revisao.
                </p>
              </div>
              {steps.map((step, index) => {
                const baseDelay = 3.85 + index * stepGap
                return (
                  <div key={`desktop-${step.name}`} className="grid gap-3">
                    <AssistantText delay={baseDelay} text={`Agora vou executar ${step.name.toLowerCase()} com os dados sincronizados.`} />
                    <div className="landing-sequence-item grid w-full gap-2" style={{ animationDelay: `${baseDelay + 0.48}s` }}>
                      <ToolCallCard name={step.name.toLowerCase().replaceAll(' ', '_')} />
                      <ToolResultTable delay={baseDelay + 0.68} step={step} />
                    </div>
                    <AssistantText delay={baseDelay + 2.12} text={`${step.name} finalizado: ${step.status}. ${step.description}.`} />
                  </div>
                )
              })}
              <div className="landing-sequence-item mt-5 max-w-[94%] sm:max-w-[86%]" style={{ animationDelay: `${finalDelay}s` }}>
                <p className="text-[14px] font-normal leading-6 text-[#111111] sm:text-[16px] sm:leading-7">
                  Resumo: as despesas recorrentes foram classificadas, os principais recebimentos conciliados e uma divergencia ficou marcada para revisao.
                </p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-5 left-3 right-3 z-20 flex h-[58px] items-center gap-2 overflow-hidden rounded-[18px] border border-[#e5e5e5] bg-white px-3 py-2 sm:left-5 sm:right-5 sm:gap-3 sm:px-4">
            <Plus className="shrink-0" size={20} strokeWidth={1.8} />
            <span className="relative min-w-0 flex-1">
              <span className="landing-typed-prompt text-[14px] font-normal leading-5 text-[#111111] sm:text-[15px]">{title}</span>
              <span className="landing-input-placeholder absolute left-0 top-1/2 -translate-y-1/2 text-[14px] font-normal text-[#777777] sm:text-[15px]">Mensagem para Otto</span>
            </span>
            <Mic className="ml-auto shrink-0" size={17} strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  )
}

function AssistantText({ delay, text }: { delay: number; text: string }) {
  return (
    <div className="landing-sequence-item" style={{ animationDelay: `${delay}s` }}>
      <div className="max-w-[94%] sm:max-w-[92%]">
        <p className="text-[14px] font-normal leading-6 text-[#111111] sm:text-[16px] sm:leading-7">{text}</p>
      </div>
    </div>
  )
}

function ToolCallCard({ name }: { name: string }) {
  return (
    <div className="flex min-h-[48px] items-center gap-3 rounded-xl border border-[#e4e4e7] bg-white px-3 py-2.5 text-[15px] font-medium text-[#111111]">
      <span className="grid size-7 place-items-center rounded-lg border border-[#e4e4e7] bg-[#fafafa] text-[#71717a]">
        <Sparkles size={14} strokeWidth={1.8} />
      </span>
      <span>{name}</span>
    </div>
  )
}

function OutlineArtifact({ steps }: { steps: ChatStep[] }) {
  const label = steps.some((step) => step.name.includes('NFS')) ? 'nota_fiscal_emitida' : steps.some((step) => step.name.includes('WhatsApp')) ? 'mensagens_enviadas' : steps.some((step) => step.name.includes('Fluxo')) ? 'dashboard_fluxo_caixa' : 'resumo_operacional'
  const type = steps.some((step) => step.name.includes('NFS')) ? 'Nota fiscal' : steps.some((step) => step.name.includes('WhatsApp')) ? 'WhatsApp' : steps.some((step) => step.name.includes('Fluxo')) ? 'Dashboard' : 'Relatorio'

  return (
    <div className="landing-tool-row grid grid-cols-[54px_1fr_auto] items-center gap-4 rounded-[18px] border border-[#e4e4e7] bg-white p-3" style={{ animationDelay: '0.58s' }}>
      <span className="grid size-[54px] place-items-center rounded-2xl border border-[#e4e4e7] bg-[#fafafa]">
        <FileText size={23} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[16px] font-semibold text-[#111827]">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-[#71717a]">{type} · Gerado pelo Otto</p>
      </div>
      <span className="rounded-full bg-[#f1f1f1] px-3 py-2 text-sm font-medium text-[#52525b]">Abrir</span>
    </div>
  )
}

function toneClasses(tone: ChatStep['tone']) {
  return {
    amber: 'bg-orange-50 text-orange-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    slate: 'bg-slate-100 text-slate-700',
  }[tone]
}

function resultRowsForStep(step: ChatStep): ResultRow[] {
  if (step.name === 'Classificar despesas') {
    return [
      { amount: 'R$ 1.280', color: '#111827', description: 'Uso de API e automacao', initials: 'AI', name: 'OpenAI API', result: 'Software', tone: 'green' },
      { amount: 'R$ 420', color: '#1877f2', description: 'Campanhas de aquisicao', icon: MetaIcon, initials: 'M', name: 'Meta Ads', result: 'Marketing', tone: 'green' },
      { amount: 'R$ 189', color: '#f97316', description: 'Pacote e TED bancaria', initials: 'BI', name: 'Banco Inter', result: 'Tarifa bancaria', tone: 'amber' },
      { amount: 'R$ 2.450', color: '#facc15', description: 'Envios e fretes nacionais', initials: 'CO', name: 'Correios', result: 'Logistica', tone: 'green' },
      { amount: 'R$ 980', color: '#95bf47', description: 'Apps e checkout da loja', icon: ShopifyIcon, initials: 'S', name: 'Shopify Apps', result: 'Ecommerce', tone: 'blue' },
      { amount: 'R$ 740', color: '#4285f4', description: 'Leads e conversoes', icon: GoogleAdsIcon, initials: 'G', name: 'Google Ads', result: 'Vendas', tone: 'blue' },
    ]
  }

  if (step.name === 'Conciliar bancos') {
    return [
      { color: '#0ea5e9', description: 'Conta azul - recebimento', erp: 'NF-9031', initials: 'CN', name: 'PIX Cliente Norte', result: 'Conciliado', tone: 'green', value: 'R$ 42.100' },
      { color: '#111827', description: 'Adquirente - lote diario', erp: 'Lote-552', initials: 'ST', name: 'Cartao Stone', result: 'Conciliado', tone: 'green', value: 'R$ 68.900' },
      { color: '#f97316', description: 'Banco Inter - taxa avulsa', erp: 'Sem lancamento', initials: 'BI', name: 'Tarifa bancaria', result: 'Revisar', tone: 'amber', value: 'R$ 189' },
      { color: '#95bf47', description: 'Shopify - assinatura loja', erp: 'CP-1182', icon: ShopifyIcon, initials: 'S', name: 'Boleto Fornecedor', result: 'Conciliado', tone: 'green', value: 'R$ 12.430' },
      { color: '#4285f4', description: 'Cartao corporativo - marketing', erp: 'MKT-884', icon: GoogleAdsIcon, initials: 'G', name: 'Google Ads BR', result: 'Conciliado', tone: 'green', value: 'R$ 8.760' },
      { color: '#1877f2', description: 'Cartao corporativo - campanhas', erp: 'MKT-921', icon: MetaIcon, initials: 'M', name: 'Meta Ads', result: 'Conciliado', tone: 'green', value: 'R$ 6.420' },
    ]
  }

  if (step.name === 'Separar revisoes') {
    return [
      { description: 'Taxa avulsa sem regra recorrente', initials: 'BI', name: 'Banco Inter', result: 'Revisar', tone: 'amber' },
      { description: 'Fornecedor fora do padrao mensal', initials: 'FS', name: 'Frete Sul', result: 'Reter', tone: 'red' },
      { description: 'Conta duplicada no periodo', icon: MetaIcon, initials: 'M', name: 'Meta Ads', result: 'Checar', tone: 'blue' },
    ]
  }

  if (step.name === 'Contas a pagar') {
    return [
      { description: 'Midia paga e campanhas', icon: GoogleAdsIcon, initials: 'G', name: 'Google Ads', result: 'R$ 18.400', tone: 'red' },
      { description: 'DAS e retencoes federais', initials: 'IR', name: 'Impostos federais', result: 'R$ 31.200', tone: 'amber' },
      { description: 'Hospedagem e infraestrutura', initials: 'AW', name: 'AWS Brasil', result: 'R$ 14.750', tone: 'blue' },
    ]
  }

  if (step.name === 'Contas a receber') {
    return [
      { description: 'NF-9031 - servicos recorrentes', initials: 'CN', name: 'Cliente Norte', result: 'R$ 42.100', tone: 'green' },
      { description: 'Contrato enterprise anual', initials: 'GD', name: 'Grupo Delta', result: 'R$ 76.500', tone: 'green' },
      { description: 'Pedidos integrados Shopify', icon: ShopifyIcon, initials: 'S', name: 'Mercado Sul', result: 'Atraso leve', tone: 'amber' },
    ]
  }

  if (step.name === 'Fluxo de caixa') {
    return [
      { description: 'Saldo projetado em 30 dias', initials: 'CX', name: 'Caixa projetado', result: 'R$ 465k', tone: 'green' },
      { description: 'Pior semana do periodo', initials: 'RW', name: 'Risco semanal', result: 'Semana 3', tone: 'amber' },
      { description: 'Relatorio executivo criado', initials: 'PPT', name: 'Dashboard financeiro', result: 'Pronto', tone: 'blue' },
    ]
  }

  if (step.name === 'Insights de margem') {
    return [
      { description: 'Aumento no custo logistico', initials: 'FR', name: 'Frete', result: '+18%', tone: 'red' },
      { description: 'CPL subiu em 3 campanhas', icon: GoogleAdsIcon, initials: 'G', name: 'Google Ads', result: '+9%', tone: 'amber' },
      { description: 'Recebimento em atraso', initials: 'CN', name: 'Cliente Norte', result: 'R$ 42.100', tone: 'red' },
    ]
  }

  if (step.name === 'Pagamentos acima de R$ 1.000') {
    return [
      { description: 'Campanhas dentro da regra', icon: GoogleAdsIcon, initials: 'G', name: 'Google Ads', result: 'Baixo risco', tone: 'green' },
      { description: 'Recorrente, acima da media', initials: 'AW', name: 'AWS Brasil', result: 'Confirmar', tone: 'amber' },
      { description: 'Prioridade fiscal', initials: 'IR', name: 'Impostos federais', result: 'Prioridade', tone: 'blue' },
    ]
  }

  if (step.name === 'Aprovacao humana') {
    return [
      { description: 'Google Ads e Meta Ads', icon: GoogleAdsIcon, initials: 'G', name: 'Midia paga', result: 'Aprovado', tone: 'green' },
      { description: 'AWS Brasil e impostos', initials: 'AG', name: 'Agendamentos', result: 'Agendado', tone: 'blue' },
      { description: 'Saiu do padrao mensal', initials: 'FS', name: 'Frete Sul', result: 'Retido', tone: 'amber' },
    ]
  }

  if (step.name === 'Trilha de auditoria') {
    return [
      { description: 'Prompt recebido no ChatGPT', initials: 'AN', name: 'Ana', result: '09:12', tone: 'blue' },
      { description: 'Regra de aprovacao aplicada', initials: 'O', name: 'Otto', result: '09:14', tone: 'green' },
      { description: 'Pagamentos autorizados', initials: 'AN', name: 'Aprovacao', result: '09:15', tone: 'green' },
    ]
  }

  if (step.name === 'Documentos fiscais') {
    return [
      { description: 'PDF + XML conferidos', initials: 'CN', name: 'Contrato Cliente Norte', result: 'Validado', tone: 'green' },
      { description: 'Servico aprovado', initials: 'OS', name: 'OS-2048', result: 'Conferido', tone: 'green' },
      { description: 'Cadastro municipal', initials: 'TM', name: 'Tomador', result: 'OK', tone: 'blue' },
    ]
  }

  if (step.name === 'Obrigacoes fiscais') {
    return [
      { description: 'Retencao do servico', initials: 'ISS', name: 'ISS retido', result: 'Calculado', tone: 'green' },
      { description: 'Vencimento em 7 dias', initials: 'DAS', name: 'DAS', result: 'Programado', tone: 'blue' },
      { description: 'Obrigacao mensal', initials: 'DCT', name: 'DCTFWeb', result: 'Em dia', tone: 'green' },
    ]
  }

  if (step.name === 'Emitir NFS-e') {
    return [
      { description: 'Consultoria operacional', initials: 'NF', name: 'NFS-e 2048', result: 'Emitida', tone: 'green' },
      { description: 'Arquivo fiscal gerado', initials: 'XML', name: 'XML', result: 'Gerado', tone: 'green' },
      { description: 'Documento para cliente', initials: 'PDF', name: 'PDF', result: 'Gerado', tone: 'blue' },
    ]
  }

  if (step.name === 'Contratos') {
    return [
      { description: 'Contrato assinado e anexos', initials: 'CN', name: 'Cliente Norte', result: 'Organizado', tone: 'green' },
      { description: 'Aguardando assinatura', initials: 'JD', name: 'Juridico Delta', result: 'Pendente', tone: 'amber' },
      { description: 'Renovacao anual', initials: 'RA', name: 'Rede Alpha', result: 'Arquivo', tone: 'blue' },
    ]
  }

  if (step.name === 'Administrativo') {
    return [
      { description: 'Boleto e comprovante', initials: 'FB', name: 'Fornecedor Beta', result: 'Organizado', tone: 'green' },
      { description: 'Pedido e nota ecommerce', icon: ShopifyIcon, initials: 'S', name: 'Shopify pedidos', result: 'Organizado', tone: 'green' },
      { description: 'Fatura de campanha', icon: GoogleAdsIcon, initials: 'G', name: 'Google Ads', result: 'Arquivo', tone: 'blue' },
    ]
  }

  if (step.name === 'Pendencias') {
    return [
      { description: 'Documento sem assinatura', initials: 'JD', name: 'Juridico Delta', result: 'Pendente', tone: 'amber' },
      { description: 'Comprovante incompleto', initials: 'RH', name: 'Folha e RH', result: 'Revisar', tone: 'amber' },
      { description: 'Contrato fora da pasta', initials: 'CT', name: 'Contratos', result: 'Movido', tone: 'green' },
    ]
  }

  if (step.name === 'Inadimplentes') {
    return [
      { description: 'NF-2041 vencida ha 18 dias', initials: 'CN', name: 'Cliente Norte', result: 'Alta', tone: 'red' },
      { description: 'Boleto vencido ha 9 dias', initials: 'RA', name: 'Rede Alpha', result: 'Media', tone: 'amber' },
      { description: 'Parcela em aberto ha 14 dias', initials: 'MS', name: 'Mercado Sul', result: 'Alta', tone: 'red' },
    ]
  }

  if (step.name === 'Preparar cobrancas') {
    return [
      { description: 'Mensagem amigavel com contexto', initials: 'WA', name: 'WhatsApp', result: 'Pronto', tone: 'green' },
      { description: 'Link de pagamento e codigo PIX', initials: 'PX', name: 'PIX + boleto', result: 'Gerado', tone: 'blue' },
      { description: 'Follow-up em D+2', initials: 'F2', name: 'Proximo contato', result: 'Agendado', tone: 'blue' },
    ]
  }

  return [
    { description: 'Mensagem enviada ao cliente', initials: 'CN', name: 'Cliente Norte', result: 'Enviado', tone: 'green' },
    { description: 'Mensagem enviada ao financeiro', initials: 'RA', name: 'Rede Alpha', result: 'Enviado', tone: 'green' },
    { description: 'Historico salvo no contas a receber', initials: 'AR', name: 'Registro financeiro', result: 'Salvo', tone: 'blue' },
  ]
}

function ResultIcon({ row }: { row: ResultRow }) {
  const Icon = row.icon

  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#e7edf0] bg-white text-[#111111] sm:size-[42px]" style={{ color: row.color ?? '#111111' }}>
      {Icon ? <Icon className="h-6 w-6 sm:h-7 sm:w-7" /> : <span className="grid size-7 place-items-center rounded-[9px] text-[12px] font-bold text-white sm:size-[31px] sm:text-[14px]" style={{ background: row.color ?? '#111827' }}>{row.initials}</span>}
    </span>
  )
}

function ToolResultTable({ delay = 0, step }: { delay?: number; step: ChatStep }) {
  const rows = resultRowsForStep(step)
  const isExpense = step.name === 'Classificar despesas'
  const isReconciliation = step.name === 'Conciliar bancos'
  const title = isExpense ? 'Classificacao automatica' : isReconciliation ? 'Matching de lancamentos' : step.name
  const subtitle = isExpense ? 'Fornecedor, valor e categoria sugerida' : isReconciliation ? 'Movimento bancario x registro no ERP' : step.description

  return (
    <div className="overflow-hidden rounded-[20px] border border-[#e5e7eb] bg-white py-2 sm:rounded-[24px] sm:py-3">
      <div className="flex items-start justify-between gap-3 px-3 pb-2 sm:gap-4 sm:px-5 sm:pb-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-[#111111] sm:text-[17px]">{title}</p>
          <p className="mt-1 truncate text-[12px] font-normal text-[#8b8b8b] sm:text-sm">{subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 sm:px-3 sm:py-1.5 sm:text-sm">100%</span>
      </div>
      <div>
        {rows.map((row, index) => {
          if (isReconciliation) {
            return <ReconciliationResultRow key={`${step.name}-${row.name}`} delay={delay + index * 0.18} row={row as ReconciliationResult} />
          }

          if (isExpense) {
            return <ExpenseResultRow key={`${step.name}-${row.name}`} delay={delay + index * 0.18} row={row as ExpenseResult} />
          }

          return (
            <div key={`${step.name}-${row.name}`} className="landing-table-row grid min-h-[58px] grid-cols-[36px_1fr_auto] items-center gap-2 border-b border-[#f1f1f1] px-3 py-2 last:border-b-0 sm:min-h-[66px] sm:grid-cols-[42px_1fr_auto] sm:gap-3 sm:px-5 sm:py-2.5" style={{ animationDelay: `${delay + index * 0.14}s` }}>
              <ResultIcon row={row} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[#111111] sm:text-[15px]">{row.name}</p>
                <p className="mt-1 truncate text-[11px] font-normal text-[#777777] sm:text-sm">{row.description}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold sm:px-2.5 sm:py-1.5 sm:text-xs ${toneClasses(row.tone)}`}>{row.result}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ExpenseResultRow({ delay, row }: { delay: number; row: ExpenseResult }) {
  return (
    <div className="landing-table-row grid h-[60px] grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:h-[72px] sm:grid-cols-[42px_1fr_auto_28px] sm:gap-[15px] sm:px-5" style={{ animationDelay: `${delay}s` }}>
      <ResultIcon row={row} />
      <div className="min-w-0">
        <strong className="block truncate text-[13px] font-medium leading-none tracking-[-0.01em] text-[#111111] sm:text-[18px]">{row.name}</strong>
        <span className="mt-1.5 block truncate text-[14px] font-normal leading-none text-[#8a8a8a]">{row.description} · {row.amount}</span>
      </div>
      <span className="landing-table-status relative min-w-[72px] text-right text-[12px] font-medium leading-none tracking-[-0.01em] sm:min-w-[116px] sm:text-[16px]">
        <span className="landing-table-pending text-[#111111]">Classificando</span>
        <span className="landing-table-done absolute inset-0 text-emerald-700">{row.result}</span>
      </span>
      <TableSpinner className="hidden sm:grid" />
    </div>
  )
}

function ReconciliationResultRow({ delay, row }: { delay: number; row: ReconciliationResult }) {
  const review = row.result === 'Revisar'

  return (
    <div className="landing-table-row grid h-[60px] grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:h-[72px] sm:grid-cols-[42px_1fr_34px_0.78fr_auto_28px] sm:gap-3 sm:px-5" style={{ animationDelay: `${delay}s` }}>
      <ResultIcon row={row} />
      <div className="min-w-0">
        <strong className="block truncate text-[13px] font-semibold leading-none tracking-[-0.01em] text-[#111111] sm:text-[17px]">{row.name}</strong>
        <span className="mt-1.5 block truncate text-[13px] font-normal leading-none text-[#8a8a8a]">{row.description} · {row.value}</span>
      </div>
      <span className="landing-review-icon relative hidden size-[34px] place-items-center rounded-full text-[18px] font-black sm:grid">
        <span className="landing-table-pending absolute grid size-[34px] place-items-center rounded-full bg-[#f2f4f7] text-[#667085]">·</span>
        <span className={`landing-table-done absolute grid size-[34px] place-items-center rounded-full ${review ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>{review ? '!' : '✓'}</span>
      </span>
      <div className="hidden min-w-0 truncate text-[15px] font-medium tracking-[-0.01em] text-[#111111] sm:block">{row.erp}</div>
      <span className="landing-table-status relative min-w-[68px] text-right text-[12px] font-medium leading-none tracking-[-0.01em] sm:min-w-[86px] sm:text-[15px]">
        <span className="landing-table-pending text-[#111111]">Verificando</span>
        <span className={`landing-table-done absolute inset-0 ${review ? 'text-orange-700' : 'text-emerald-700'}`}>{row.result}</span>
      </span>
      <TableSpinner className="hidden sm:grid" />
    </div>
  )
}

function TableSpinner({ className = 'grid' }: { className?: string }) {
  return (
    <span className={`relative size-7 place-items-center ${className}`}>
      <span className="landing-table-spinner size-[18px] rounded-full border-2 border-[#d0d5dd] border-r-[#111827]" />
      <span className="landing-table-check absolute grid size-7 place-items-center rounded-full bg-emerald-50 text-emerald-700">
        <Check size={15} strokeWidth={2.4} />
      </span>
    </span>
  )
}

function PricingCard() {
  const plans = [
    { badge: '', cadence: 'Mensal', description: 'Flexivel para comecar sem compromisso longo.', price: 'R$ 997' },
    { badge: 'Mais escolhido', cadence: 'Trimestral', description: 'Melhor para implantar, ajustar e medir os primeiros ganhos.', price: 'R$ 897' },
    { badge: 'Melhor valor', cadence: 'Anual', description: 'Para transformar o financeiro em uma operacao continua com IA.', price: 'R$ 797' },
  ]
  const [selectedCadence, setSelectedCadence] = useState('Trimestral')
  const selectedPlan = plans.find((plan) => plan.cadence === selectedCadence) ?? plans[1]
  const features = [
    'Módulos de financeiro, fiscal, documentos e relatórios',
    'Conexões com bancos, anúncios, lojas, documentos e planilhas',
    'Automação de classificação, conciliação, cobrança e aprovação',
    'Relatórios, dashboards e trilha de auditoria em tempo real',
    'Onboarding assistido para centralizar sua operação',
  ]

  return (
    <div className="rounded-[30px] border border-black/10 bg-white p-5 text-[#111827] md:p-7">
      <div className="border-b border-black/10 pb-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-emerald-700">ERP AI-powered</p>
          <h3 className="mt-3 text-[32px] font-semibold tracking-[-0.035em] text-[#111827] md:text-[42px]">Operação ERP</h3>
          <p className="mt-3 max-w-[420px] text-base leading-7 text-[#667085]">Para empresas que querem centralizar dados, automatizar rotinas e acompanhar a operação em um ERP AI-first.</p>
        </div>
      </div>

      <div className="mx-auto mt-7 grid max-w-[430px] grid-cols-3 rounded-full border border-black/10 bg-[#f8fafc] p-1 text-sm font-semibold text-[#64748b]">
        {plans.map((plan) => {
          const active = plan.cadence === selectedPlan.cadence
          return (
            <button
              key={plan.cadence}
              className={`rounded-full px-3 py-2 transition-colors ${active ? 'bg-[#111827] text-white' : 'text-[#64748b]'}`}
              onClick={() => setSelectedCadence(plan.cadence)}
              type="button"
            >
              {plan.cadence}
            </button>
          )
        })}
      </div>

      <div className="mx-auto mt-5 max-w-[520px] rounded-[26px] border border-[#111827] bg-[#111827] p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">{selectedPlan.cadence}</p>
            <p className="mt-1 text-sm font-medium text-white/58">{selectedPlan.description}</p>
          </div>
          {selectedPlan.badge ? <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#111827]">{selectedPlan.badge}</span> : null}
        </div>

        <div className="mt-7 flex items-end gap-2">
          <span className="text-[52px] font-semibold leading-none tracking-[-0.045em]">{selectedPlan.price}</span>
          <span className="pb-2 text-base font-medium text-white/62">/mes</span>
        </div>

        <Link href="/sign-up" className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#111827]">
          Comecar agora
          <ArrowRight size={18} strokeWidth={1.6} />
        </Link>

        <div className="mt-7 border-t border-white/12 pt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-white/58">Incluso</p>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">Implementacao guiada</span>
          </div>
          <div className="grid gap-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white/10 text-white">
                  <Check size={14} strokeWidth={2.2} />
                </span>
                <span className="text-sm font-medium leading-6 text-white/76">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function OttoLandingPage() {
  return (
    <main className={`${sfPro.variable} min-h-screen bg-[#050505] text-white`} style={sfProLandingStyle}>
      <style>
        {`
          .landing-title-font {
            font-family: Georgia, "Times New Roman", Times, serif !important;
          }

          @keyframes landing-row-loop {
            0% { opacity: 0; transform: translateY(14px); }
            12% { opacity: 1; transform: translateY(0); }
            82% { opacity: 1; transform: translateY(0); }
            100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes landing-status-swap {
            0%, 3% { opacity: 0; transform: translateY(4px); }
            6%, 14% { opacity: 1; transform: translateY(0); }
            18%, 100% { opacity: 0; transform: translateY(-4px); }
          }

          @keyframes landing-status-done {
            0%, 15% { opacity: 0; transform: translateY(4px); }
            19%, 78% { opacity: 1; transform: translateY(0); }
            92%, 100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes landing-spinner {
            to { transform: rotate(360deg); }
          }

          @keyframes landing-prompt-cycle {
            0%, 100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes landing-typing-mask {
            0%, 8% { max-width: 0; opacity: 1; }
            22%, 28% { max-width: 520px; opacity: 1; }
            34%, 100% { max-width: 0; opacity: 0; }
          }

          @keyframes landing-caret-cycle {
            0%, 28% { opacity: 1; }
            31%, 100% { opacity: 0; }
          }

          @keyframes landing-placeholder-cycle {
            0%, 30% { opacity: 0; }
            36%, 100% { opacity: 1; }
          }

          @keyframes landing-question-cycle {
            0%, 26% { opacity: 0; transform: translateY(16px); }
            30%, 88% { opacity: 1; transform: translateY(0); }
            100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes landing-chat-cycle {
            0%, 34% { opacity: 0; transform: translateY(16px); }
            40%, 88% { opacity: 1; transform: translateY(0); }
            100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes landing-tool-cycle {
            0%, 46% { opacity: 0; transform: translateY(16px); }
            52%, 88% { opacity: 1; transform: translateY(0); }
            100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes landing-final-cycle {
            0%, 72% { opacity: 0; transform: translateY(16px); }
            78%, 88% { opacity: 1; transform: translateY(0); }
            100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes landing-chat-scroll-cycle {
            0%, 30% { transform: translateY(0); }
            44% { transform: translateY(calc(var(--landing-scroll-y) * -0.24)); }
            58% { transform: translateY(calc(var(--landing-scroll-y) * -0.52)); }
            74% { transform: translateY(calc(var(--landing-scroll-y) * -0.78)); }
            88% { transform: translateY(calc(var(--landing-scroll-y) * -1)); }
            96% { transform: translateY(calc(var(--landing-scroll-y) * -1)); }
            100% { transform: translateY(0); }
          }

          @keyframes landing-sequence-cycle {
            0% { opacity: 0; transform: translateY(14px); }
            4% { opacity: 1; transform: translateY(0); }
            72% { opacity: 1; transform: translateY(0); }
            100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes landing-table-row-cycle {
            0% { opacity: 0; transform: translateY(18px); }
            4% { opacity: 1; transform: translateY(0); }
            78% { opacity: 1; transform: translateY(0); }
            100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes landing-table-pending-cycle {
            0%, 34% { opacity: 1; transform: translateY(0); }
            42%, 100% { opacity: 0; transform: translateY(-4px); }
          }

          @keyframes landing-table-done-cycle {
            0%, 36% { opacity: 0; transform: translateY(4px); }
            44%, 78% { opacity: 1; transform: translateY(0); }
            100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes landing-table-spinner-cycle {
            0%, 34% { opacity: 1; transform: rotate(0deg); }
            42%, 100% { opacity: 0; transform: rotate(270deg); }
          }

          @keyframes landing-table-check-cycle {
            0%, 36% { opacity: 0; transform: scale(0.78); }
            44%, 78% { opacity: 1; transform: scale(1); }
            100% { opacity: 1; transform: scale(1); }
          }

          @keyframes landing-codex-prompt-cycle {
            0% { opacity: 0; transform: translate(-50%, 16px) scale(0.96); }
            10%, 44% { opacity: 1; transform: translate(-50%, 0) scale(1); }
            54%, 100% { opacity: 0; transform: translate(-50%, -18px) scale(0.98); }
          }

          @keyframes landing-codex-card-cycle {
            0%, 44% { opacity: 0; transform: translateY(18px) scale(0.97); }
            56%, 100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes landing-codex-type-cycle {
            0%, 12% { max-width: 0; }
            36%, 100% { max-width: 230px; }
          }

          @keyframes landing-codex-caret-cycle {
            0%, 10% { opacity: 0; }
            13%, 18% { opacity: 1; }
            19%, 24% { opacity: 0; }
            25%, 30% { opacity: 1; }
            31%, 36% { opacity: 0; }
            37%, 43% { opacity: 1; }
            48%, 100% { opacity: 0; }
          }

          @keyframes landing-codex-send-cycle {
            0%, 39% { background: #111111; transform: scale(1); }
            43% { background: #52D273; color: #06130d; transform: scale(0.9); }
            48%, 100% { background: #111111; color: #ffffff; transform: scale(1); }
          }

          @keyframes landing-codex-bar-cycle {
            0%, 54% { transform: scaleY(0.12); }
            72%, 100% { transform: scaleY(1); }
          }

          @keyframes landing-codex-insight-cycle {
            0%, 70% { opacity: 0; transform: translateY(10px); }
            84%, 100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes landing-codex-tile-cycle {
            0%, 52% { opacity: 0; transform: translateY(10px) scale(0.96); }
            68%, 100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          .landing-sync-row,
          .landing-hero-row {
            animation: landing-row-loop 5.8s ease both;
          }

          .landing-sync-row {
            animation-duration: 7.2s;
          }

          .landing-sync-loading {
            animation: landing-status-swap 7.2s ease both;
          }

          .landing-sync-loading span {
            animation: landing-spinner 900ms linear 8 both;
          }

          .landing-sync-done {
            animation: landing-status-done 7.2s ease both;
            display: inline-flex;
            position: absolute;
          }

          .landing-sync-status {
            position: relative;
          }

          .landing-sync-status .landing-sync-loading,
          .landing-sync-status .landing-sync-done {
            animation-delay: inherit;
          }

          .landing-codex-chart {
            color: #111827;
            padding: 16px;
            position: relative;
          }

          .landing-codex-prompt {
            align-items: center;
            animation: landing-codex-prompt-cycle 5.8s ease-in-out infinite;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 999px;
            box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
            display: grid;
            gap: 9px;
            grid-template-columns: auto 1fr auto;
            left: 50%;
            max-width: calc(100% - 28px);
            padding: 9px 10px 9px 14px;
            position: absolute;
            top: 50%;
            transform: translate(-50%, 0);
            width: 330px;
            z-index: 2;
          }

          .landing-codex-prompt span {
            color: #7b8491;
            font-size: 18px;
            line-height: 1;
          }

          .landing-codex-prompt p {
            align-items: center;
            color: #111827;
            display: flex;
            font-size: 13px;
            font-weight: 560;
            line-height: 1.1;
            margin: 0;
            overflow: hidden;
            white-space: nowrap;
          }

          .landing-codex-typed {
            animation: landing-codex-type-cycle 5.8s steps(24, end) infinite;
            display: inline-block;
            max-width: 0;
            overflow: hidden;
            white-space: nowrap;
          }

          .landing-codex-prompt p i {
            animation: landing-codex-caret-cycle 5.8s ease infinite;
            background: #111827;
            display: inline-block;
            height: 15px;
            margin-left: 2px;
            width: 1px;
          }

          .landing-codex-prompt strong {
            align-items: center;
            animation: landing-codex-send-cycle 5.8s ease-in-out infinite;
            background: #111111;
            border-radius: 999px;
            color: #ffffff;
            display: flex;
            font-size: 12px;
            height: 24px;
            justify-content: center;
            line-height: 1;
            width: 24px;
          }

          .landing-codex-card {
            animation: landing-codex-card-cycle 5.8s ease-in-out infinite;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 18px;
            box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
            display: grid;
            gap: 12px;
            height: 100%;
            padding: 15px;
          }

          .landing-codex-card-header {
            align-items: center;
            display: flex;
            justify-content: space-between;
          }

          .landing-codex-card-header strong {
            color: #111827;
            display: block;
            font-size: 14px;
            font-weight: 750;
            letter-spacing: -0.02em;
            line-height: 1.1;
          }

          .landing-codex-card-header span,
          .landing-codex-card-header em {
            color: #8b95a1;
            display: block;
            font-size: 11px;
            font-style: normal;
            font-weight: 560;
            margin-top: 3px;
          }

          .landing-codex-card-header em {
            background: #ecfdf3;
            border-radius: 999px;
            color: #168a4a;
            margin-top: 0;
            padding: 5px 8px;
          }

          .landing-codex-kpis {
            display: grid;
            gap: 7px;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .landing-codex-kpis span {
            background: #f8fafc;
            border: 1px solid #eef2f7;
            border-radius: 12px;
            color: #7b8491;
            display: grid;
            font-size: 10px;
            font-weight: 560;
            gap: 3px;
            padding: 8px;
          }

          .landing-codex-kpis strong {
            color: #111827;
            font-size: 13px;
            font-weight: 760;
          }

          .landing-codex-bars {
            align-items: end;
            background: linear-gradient(to bottom, transparent 0 31%, #eef2f7 32% 33%, transparent 34% 64%, #eef2f7 65% 66%, transparent 67%);
            display: grid;
            flex: 1;
            gap: 8px;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            min-height: 58px;
          }

          .landing-codex-bars i {
            animation: landing-codex-bar-cycle 5.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
            background: linear-gradient(180deg, #52D273, #0f9f70);
            border-radius: 8px 8px 3px 3px;
            display: block;
            height: var(--bar-height);
            min-height: 12px;
            transform-origin: bottom;
          }

          .landing-codex-insight {
            align-items: center;
            animation: landing-codex-insight-cycle 5.8s ease-in-out infinite;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 12px;
            color: #166534;
            display: flex;
            gap: 7px;
            padding: 8px 10px;
          }

          .landing-codex-insight span {
            font-size: 11px;
            font-weight: 650;
            line-height: 1.25;
          }

          .landing-codex-dashboard-grid {
            display: grid;
            gap: 8px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .landing-codex-dashboard-grid span {
            animation: landing-codex-tile-cycle 5.8s ease-in-out infinite both;
            background: #f8fafc;
            border: 1px solid #eef2f7;
            border-radius: 13px;
            display: grid;
            gap: 3px;
            padding: 9px;
          }

          .landing-codex-dashboard-grid small,
          .landing-codex-dashboard-grid em {
            color: #7b8491;
            font-size: 10px;
            font-style: normal;
            font-weight: 620;
            line-height: 1;
          }

          .landing-codex-dashboard-grid strong {
            color: #111827;
            font-size: 15px;
            font-weight: 780;
            letter-spacing: -0.02em;
            line-height: 1.05;
          }

          .landing-codex-dashboard-grid em {
            color: #16a34a;
          }

          .landing-codex-dashboard-chart {
            align-items: end;
            background: linear-gradient(to bottom, transparent 0 31%, #eef2f7 32% 33%, transparent 34% 64%, #eef2f7 65% 66%, transparent 67%);
            display: grid;
            flex: 1;
            gap: 7px;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            min-height: 48px;
          }

          .landing-codex-dashboard-chart i {
            animation: landing-codex-bar-cycle 5.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
            background: linear-gradient(180deg, #2563eb, #52D273);
            border-radius: 999px 999px 4px 4px;
            display: block;
            height: var(--bar-height);
            min-height: 12px;
            transform-origin: bottom;
          }

          .landing-codex-agents {
            display: grid;
            gap: 8px;
          }

          .landing-codex-agents div {
            align-items: center;
            animation: landing-codex-tile-cycle 5.8s ease-in-out infinite both;
            background: #f8fafc;
            border: 1px solid #eef2f7;
            border-radius: 14px;
            display: grid;
            gap: 9px;
            grid-template-columns: 30px 1fr auto;
            min-width: 0;
            padding: 8px;
          }

          .landing-codex-agents div > span {
            align-items: center;
            background: #ecfdf3;
            border-radius: 999px;
            color: #168a4a;
            display: flex;
            height: 30px;
            justify-content: center;
            width: 30px;
          }

          .landing-codex-agents p {
            display: grid;
            gap: 2px;
            margin: 0;
            min-width: 0;
          }

          .landing-codex-agents p strong {
            color: #111827;
            font-size: 12px;
            font-weight: 760;
            line-height: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .landing-codex-agents p small {
            color: #7b8491;
            font-size: 10px;
            font-weight: 560;
            line-height: 1.15;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .landing-codex-agents div > em {
            background: #ecfdf3;
            border-radius: 999px;
            color: #168a4a;
            font-size: 10px;
            font-style: normal;
            font-weight: 720;
            padding: 5px 7px;
          }

          .landing-prompt-input {
            opacity: 1;
            transform: translateY(0);
          }

          .landing-typed-prompt {
            display: inline-block;
            max-width: 0;
            overflow: hidden;
            white-space: nowrap;
            animation: landing-typing-mask 20s steps(54, end) both;
          }

          @media (max-width: 640px) {
            .landing-typed-prompt {
              display: inline-block;
              max-width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .landing-table-row span {
              font-size: 11px;
            }

            .landing-table-row .landing-table-status span {
              font-size: 12px;
            }
          }

          .landing-caret {
            animation: landing-caret-cycle 20s ease both;
          }

          .landing-input-placeholder {
            animation: landing-placeholder-cycle 20s ease both;
          }

          .landing-chat-scroll {
            scrollbar-width: thin;
            scrollbar-color: #d7d7d7 transparent;
          }

          .landing-chat-scroll::-webkit-scrollbar {
            width: 6px;
          }

          .landing-chat-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .landing-chat-scroll::-webkit-scrollbar-thumb {
            background: #d7d7d7;
            border-radius: 999px;
          }

          .landing-chat-scroll::before,
          .landing-chat-scroll::after {
            content: '';
            left: 0;
            pointer-events: none;
            position: absolute;
            right: 0;
            z-index: 5;
          }

          .landing-chat-scroll::before {
            background: linear-gradient(#ffffff, rgba(255,255,255,0));
            height: 22px;
            top: 0;
          }

          .landing-chat-scroll::after {
            background: linear-gradient(rgba(255,255,255,0), #ffffff);
            bottom: 0;
            height: 34px;
          }

          .landing-chat-scroll-content {
            animation: landing-chat-scroll-cycle 20s ease both;
            will-change: transform;
          }

          .landing-user-question {
            animation: landing-question-cycle 20s ease both;
          }

          .landing-assistant-intro {
            animation: landing-chat-cycle 20s ease both;
          }

          .landing-sequence-item {
            opacity: 0;
            animation: landing-sequence-cycle 20s ease both;
          }

          .landing-table-row {
            opacity: 0;
            animation: landing-table-row-cycle 20s ease both;
          }

          .landing-table-pending,
          .landing-table-done,
          .landing-table-spinner,
          .landing-table-check {
            animation-duration: 20s;
            animation-fill-mode: both;
            animation-iteration-count: 1;
            animation-timing-function: ease;
            animation-delay: inherit;
          }

          .landing-table-pending {
            animation-name: landing-table-pending-cycle;
          }

          .landing-table-done {
            opacity: 0;
            animation-name: landing-table-done-cycle;
          }

          .landing-table-spinner {
            animation-name: landing-table-spinner-cycle;
          }

          .landing-table-check {
            opacity: 0;
            animation-name: landing-table-check-cycle;
          }

          .landing-animate-scope:not(.landing-in-view) .landing-sync-row,
          .landing-animate-scope:not(.landing-in-view) .landing-sync-loading,
          .landing-animate-scope:not(.landing-in-view) .landing-sync-done,
          .landing-animate-scope:not(.landing-in-view) .landing-typed-prompt,
          .landing-animate-scope:not(.landing-in-view) .landing-caret,
          .landing-animate-scope:not(.landing-in-view) .landing-input-placeholder,
          .landing-animate-scope:not(.landing-in-view) .landing-chat-scroll-content,
          .landing-animate-scope:not(.landing-in-view) .landing-user-question,
          .landing-animate-scope:not(.landing-in-view) .landing-assistant-intro,
          .landing-animate-scope:not(.landing-in-view) .landing-sequence-item,
          .landing-animate-scope:not(.landing-in-view) .landing-table-row,
          .landing-animate-scope:not(.landing-in-view) .landing-table-pending,
          .landing-animate-scope:not(.landing-in-view) .landing-table-done,
          .landing-animate-scope:not(.landing-in-view) .landing-table-spinner,
          .landing-animate-scope:not(.landing-in-view) .landing-table-check,
          .landing-animate-scope:not(.landing-in-view) .landing-tool-row {
            animation-play-state: paused;
          }
        `}
      </style>

      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#050505] pl-0.5 pr-1 py-1 sm:px-8 sm:py-5">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between">
          <Link href="/lp" className="flex items-center">
            <img src="/logoOtto.svg" alt="Otto" className="h-12 w-auto brightness-0 invert" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/55 md:flex">
            <a href="#conecte">Dados</a>
            <a href="#financeiro">Financeiro</a>
            <a href="#fiscal">Fiscal</a>
            <a href="#preco">Preço</a>
          </nav>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#050505] px-6 py-8 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="text-center">
            <h1
              className="mx-auto max-w-[760px] !text-[36px] md:!text-[54px]"
              style={{ color: '#f8f8f8', fontFamily: 'Inter, var(--font-sf-pro), -apple-system, BlinkMacSystemFont, system-ui, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}
            >
              Sistema de Gestão integrado ao <span className="whitespace-nowrap"><ClaudeWordmark /><WordmarkPlus /><ChatGptWordmark /></span> que cuida do seu financeiro.
            </h1>
            <p
              className="mx-auto mt-7 max-w-[580px] text-[22px] md:text-lg"
              style={{ color: '#f8f8f8', fontFamily: 'Inter, var(--font-sf-pro), -apple-system, BlinkMacSystemFont, system-ui, sans-serif', fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.6 }}
            >
              Com Otto, você opera o financeiro da sua empresa pelo ChatGPT ou Claude: funcionários de IA classificam despesas, conciliam bancos, acompanham contas a pagar e receber, organizam documentos e geram relatórios para você decidir melhor.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/sign-up" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#52D273] px-6 py-3 text-sm font-semibold text-[#050505]">
                Comprar
                <ArrowRight size={18} strokeWidth={1.6} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section
        eyebrow="Conecte os dados"
        id="conecte"
        subtitle="Conecte bancos, ERPs legados, lojas, anúncios, documentos e planilhas para criar uma base única de operação."
        title="Traga seus dados para um ERP inteligente."
      >
        <DataConnectionSync />
      </Section>

      <Section
        eyebrow="Financeiro"
        id="financeiro"
        subtitle="Otto classifica despesas, concilia bancos, acompanha contas a pagar e receber e mostra divergências antes que virem problema."
        theme="dark"
        title="Um financeiro que fecha, concilia e alerta sozinho."
      >
        <ChatAutomationPanel dark steps={financeSteps} title="Classifique despesas, concilie bancos e atualize o financeiro do ERP." />
      </Section>

      <Section
        eyebrow="Contas a pagar"
        id="contas-a-pagar"
        layout="stacked"
        subtitle="Acompanhe contas a pagar, contas a receber e DRE em uma visão clara para evitar atrasos, duplicidades e decisões sem contexto."
        title="Gestão financeira com contas e resultado no mesmo lugar."
      >
        <div className="grid gap-5 md:gap-6">
          <BentoGallery items={financeBentos} />
          <BentoGallery items={managementBentos} />
        </div>
      </Section>

      <Section
        eyebrow="Análise de dados"
        id="analise-de-dados"
        layout="stacked"
        subtitle="Faça perguntas sobre seus dados financeiros e veja gráficos, comparativos e respostas visuais serem gerados em tempo real."
        title="Análise de dados"
      >
        <CodexChartsFeatureGallery />
      </Section>

      <Section
        eyebrow="Fiscal e documentos"
        id="fiscal"
        subtitle="Notas fiscais, XMLs, contratos, comprovantes e obrigações ficam organizados, rastreáveis e prontos para execução."
        title="Fiscal, notas e documentos no mesmo ERP."
      >
        <ChatAutomationPanel steps={fiscalSteps} title="Organize notas, documentos fiscais e obrigações no ERP." />
      </Section>

      <Section
        eyebrow="Cobrancas"
        id="cobrancas"
        subtitle="Otto encontra inadimplentes, prepara mensagens e registra cada cobrança dentro do histórico financeiro."
        theme="green"
        title="Cobrança integrada ao contas a receber."
      >
        <ChatAutomationPanel dark steps={collectionSteps} title="Cobre clientes inadimplentes e registre as mensagens no contas a receber." />
      </Section>

      <Section
        eyebrow="Preco"
        id="preco"
        subtitle="Escolha o ciclo de pagamento e comece com os módulos essenciais para centralizar dados, automatizar rotinas e acompanhar a operação."
        title="Um ERP AI-powered para operar sua empresa."
      >
        <PricingCard />
      </Section>

      <section className="bg-[#050505] px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-[900px] text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-emerald-200">Otto ERP</p>
          <h2 className="mt-5 text-[38px] font-extrabold leading-[0.92] tracking-[-0.03em] text-[#f8f8f8] md:text-[64px]">
            Coloque seu ERP AI-first para operar todos os dias.
          </h2>
          <p className="mx-auto mt-6 max-w-[620px] text-lg font-normal leading-[1.6] tracking-[-0.01em] text-[#f8f8f8]/70">
            Centralize dados, automatize processos e mantenha aprovacao humana nas decisoes que importam.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/sign-up" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#050505]">
              Criar conta
              <ArrowRight size={18} strokeWidth={1.6} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
