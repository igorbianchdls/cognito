import type { ComponentType, ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  FileCheck2,
  FileText,
  FolderKanban,
  Landmark,
  LockKeyhole,
  MessageCircle,
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

const documentSteps: ChatStep[] = [
  { description: 'Contratos, anexos e assinaturas', icon: <FolderKanban size={18} />, name: 'Contratos', status: 'Organizado', tone: 'blue' },
  { description: 'Boletos, comprovantes e pedidos', icon: <ReceiptText size={18} />, name: 'Administrativo', status: '8 docs', tone: 'green' },
  { description: 'Pendencias juridicas e contabeis', icon: <FileText size={18} />, name: 'Pendencias', status: '2 itens', tone: 'amber' },
]

const collectionSteps: ChatStep[] = [
  { description: 'Cliente Norte, Rede Alpha e Mercado Sul', icon: <CircleDollarSign size={18} />, name: 'Inadimplentes', status: 'R$ 71.000', tone: 'red' },
  { description: 'Tom, PIX, boleto e follow-up', icon: <MessageCircle size={18} />, name: 'Preparar cobrancas', status: 'Pronto', tone: 'blue' },
  { description: 'Mensagens enviadas e historico salvo', icon: <MessageCircle size={18} />, name: 'WhatsApp', status: 'Enviado', tone: 'green' },
]

function Section({
  children,
  eyebrow,
  id,
  subtitle,
  theme = 'light',
  title,
}: {
  children: ReactNode
  eyebrow: string
  id: string
  subtitle: string
  theme?: 'light' | 'dark' | 'warm' | 'green'
  title: string
}) {
  const isDark = theme === 'dark' || theme === 'green'
  const background = theme === 'dark' ? 'bg-[#050505]' : theme === 'green' ? 'bg-[#06130d]' : theme === 'warm' ? 'bg-[#f5f1eb]' : 'bg-[#f7f8fa]'
  const border = isDark ? 'border-white/10' : 'border-black/10'
  const text = isDark ? 'text-white' : 'text-[#111827]'
  const muted = isDark ? 'text-white/62' : 'text-[#667085]'
  const eyebrowColor = theme === 'green' ? 'text-emerald-200' : isDark ? 'text-emerald-200' : 'text-emerald-700'

  return (
    <section id={id} className={`border-b ${border} ${background} px-6 py-20 sm:px-8`}>
      <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className={`text-sm font-semibold uppercase tracking-[0.08em] ${eyebrowColor}`}>{eyebrow}</p>
          <h2 className={`mt-4 max-w-[560px] text-[34px] font-semibold leading-[0.98] tracking-[-0.03em] md:text-[52px] ${text}`}>
            {title}
          </h2>
          <p className={`mt-5 max-w-[520px] text-base leading-7 md:text-lg ${muted}`}>{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

function IntegrationIcon({ row }: { row: SyncRow }) {
  const Icon = row.icon

  return (
    <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-black/10 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)]" style={{ color: row.tone }}>
      {Icon ? <Icon className="h-8 w-8" /> : <span className="grid size-8 place-items-center rounded-xl text-[13px] font-bold text-white" style={{ background: row.tone }}>{row.initials}</span>}
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
    <div className="rounded-[30px] border border-black/10 bg-white p-4 shadow-[0_28px_80px_rgba(15,23,42,0.10)] md:p-6">
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
  const surface = dark ? 'border-white/10 bg-white/[0.06]' : 'border-black/10 bg-white'
  const inner = dark ? 'border-white/10 bg-[#111111]' : 'border-black/10 bg-[#f8fafc]'
  const titleColor = dark ? 'text-white' : 'text-[#111827]'
  const muted = dark ? 'text-white/55' : 'text-[#667085]'

  return (
    <div className={`rounded-[30px] border ${surface} p-4 shadow-[0_28px_80px_rgba(15,23,42,0.12)] md:p-6`}>
      <div className={`overflow-hidden rounded-[24px] border ${inner}`}>
        <div className="flex items-center justify-between border-b border-current/10 pb-4">
          <div className="flex items-center gap-3 px-4 pt-4">
            <span className="grid size-10 place-items-center rounded-2xl bg-emerald-300 text-sm font-bold text-[#06130d]">O</span>
            <div>
              <p className={`text-lg font-semibold ${titleColor}`}>Otto</p>
              <p className={`mt-1 text-sm font-medium ${muted}`}>Agente operando no chat</p>
            </div>
          </div>
          <span className="mr-4 mt-4 grid size-10 place-items-center rounded-full bg-emerald-300 text-[#06130d]">
            <Sparkles size={18} strokeWidth={1.8} />
          </span>
        </div>
        <div className="grid gap-4 p-4">
          <div className="landing-chat-message ml-auto max-w-[82%] rounded-[24px] bg-white px-5 py-4 text-[#111827] shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
            <p className="text-[17px] font-medium leading-6">{title}</p>
          </div>
          <div className="landing-chat-message flex items-start gap-3" style={{ animationDelay: '0.18s' }}>
            <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-300 text-xs font-bold text-[#06130d]">O</span>
            <div className="max-w-[88%] rounded-[24px] border border-black/[0.06] bg-white px-5 py-4 text-[#111827] shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
              <p className="text-[16px] font-medium leading-6 text-[#334155]">
                Vou consultar suas fontes conectadas, executar as ferramentas certas e trazer o resultado com pontos de revisao.
              </p>
            </div>
          </div>
          <div className="landing-chat-message flex items-start gap-3" style={{ animationDelay: '0.34s' }}>
            <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-300 text-xs font-bold text-[#06130d]">O</span>
            <div className="grid w-full gap-3 rounded-[24px] border border-black/[0.06] bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
              {steps.map((step, index) => (
                <div key={step.name} className="grid gap-2">
                  <div className="landing-tool-call inline-flex w-max items-center gap-2 rounded-xl border border-black/[0.08] bg-[#f8fafc] px-3 py-2 text-sm font-semibold text-[#475467]" style={{ animationDelay: `${0.42 + index * 0.16}s` }}>
                    <Sparkles size={14} strokeWidth={1.8} />
                    {step.name.toLowerCase().replaceAll(' ', '_')}
                  </div>
                  <ToolResultRow index={index} step={step} />
                </div>
              ))}
            </div>
          </div>
          <div className="landing-chat-message flex items-start gap-3" style={{ animationDelay: '0.72s' }}>
            <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-300 text-xs font-bold text-[#06130d]">O</span>
            <div className="max-w-[88%] rounded-[24px] border border-black/[0.06] bg-white px-5 py-4 text-[#111827] shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
              <p className="text-[16px] font-medium leading-6 text-[#334155]">
                Pronto. A rotina foi executada e deixei os itens sensiveis separados para acompanhamento.
              </p>
            </div>
          </div>
          <div className={`mt-1 flex items-center gap-3 rounded-full border px-4 py-3 ${dark ? 'border-white/10 bg-white/[0.04]' : 'border-black/10 bg-white'}`}>
            <span className={`text-sm font-medium ${muted}`}>Pergunte ao Otto...</span>
            <span className="ml-auto grid size-8 place-items-center rounded-full bg-[#111827] text-white">
              <ArrowRight size={15} strokeWidth={1.8} />
            </span>
          </div>
        </div>
      </div>
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

function ToolResultRow({ index, step }: { index: number; step: ChatStep }) {
  return (
    <div className="landing-tool-row grid min-h-[72px] grid-cols-[44px_1fr_auto] items-center gap-4 rounded-[20px] border border-black/[0.06] bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)]" style={{ animationDelay: `${0.12 + index * 0.12}s` }}>
      <span className={`grid size-11 place-items-center rounded-2xl ${toneClasses(step.tone)}`}>{step.icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[16px] font-semibold text-[#111827]">{step.name}</p>
        <p className="mt-1 truncate text-sm font-medium text-[#7a8290]">{step.description}</p>
      </div>
      <span className={`rounded-full px-3 py-2 text-sm font-semibold ${toneClasses(step.tone)}`}>{step.status}</span>
    </div>
  )
}

function HeroVisual() {
  return (
    <div className="relative min-h-[420px] lg:min-h-0">
      <div className="absolute inset-x-0 top-6 rounded-[34px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <span className="grid size-11 place-items-center rounded-2xl bg-white text-sm font-bold text-[#050505]">O</span>
          <div>
            <p className="font-semibold text-white">Otto</p>
            <p className="text-sm font-medium text-white/50">Agentes financeiros conectados</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          {['Conectando dados da empresa', 'Classificando despesas e conciliando bancos', 'Gerando dashboard, relatorio e insights de margem'].map((item, index) => (
            <div key={item} className="landing-hero-row flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3" style={{ animationDelay: `${index * 0.18}s` }}>
              <span className="grid size-7 place-items-center rounded-full bg-emerald-300 text-[#06130d]">
                <Check size={15} strokeWidth={2} />
              </span>
              <span className="text-sm font-semibold text-white">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AgentHandoff() {
  const agents = ['Financeiro', 'Fiscal', 'Documentos', 'Cobranca', 'Relatorios']

  return (
    <div className="grid gap-3 rounded-[30px] border border-black/10 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.09)] md:grid-cols-5">
      {agents.map((agent, index) => (
        <div key={agent} className="landing-tool-row rounded-[22px] border border-black/[0.08] bg-[#f8fafc] p-4" style={{ animationDelay: `${index * 0.1}s` }}>
          <span className="grid size-10 place-items-center rounded-2xl bg-[#111827] text-sm font-bold text-white">{agent.slice(0, 2)}</span>
          <p className="mt-4 text-[17px] font-semibold text-[#111827]">{agent}</p>
          <p className="mt-2 text-sm font-medium leading-5 text-[#667085]">Contexto recebido e proxima acao preparada.</p>
        </div>
      ))}
    </div>
  )
}

export function OttoLandingPage() {
  return (
    <main className={`${sfPro.variable} min-h-screen bg-[#050505] text-white`} style={sfProLandingStyle}>
      <style>
        {`
          @keyframes landing-row-loop {
            0% { opacity: 0; transform: translateY(14px); }
            12% { opacity: 1; transform: translateY(0); }
            82% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-8px); }
          }

          @keyframes landing-status-swap {
            0%, 3% { opacity: 0; transform: translateY(4px); }
            6%, 14% { opacity: 1; transform: translateY(0); }
            18%, 100% { opacity: 0; transform: translateY(-4px); }
          }

          @keyframes landing-status-done {
            0%, 15% { opacity: 0; transform: translateY(4px); }
            19%, 78% { opacity: 1; transform: translateY(0); }
            92%, 100% { opacity: 0; transform: translateY(-4px); }
          }

          @keyframes landing-spinner {
            to { transform: rotate(360deg); }
          }

          .landing-sync-row,
          .landing-tool-row,
          .landing-hero-row,
          .landing-chat-message,
          .landing-tool-call {
            animation: landing-row-loop 5.8s ease infinite both;
          }

          .landing-sync-row {
            animation-duration: 7.2s;
          }

          .landing-chat-message,
          .landing-tool-call {
            animation-duration: 6.4s;
          }

          .landing-sync-loading {
            animation: landing-status-swap 7.2s ease infinite both;
          }

          .landing-sync-loading span {
            animation: landing-spinner 900ms linear infinite;
          }

          .landing-sync-done {
            animation: landing-status-done 7.2s ease infinite both;
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
        `}
      </style>

      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#050505] px-6 py-6 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between">
          <Link href="/lp" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-2xl bg-white text-sm font-semibold text-[#050505]">O</span>
            <span className="text-lg font-semibold text-white">Otto</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/55 md:flex">
            <a href="#conecte">Conecte</a>
            <a href="#financeiro">Financeiro</a>
            <a href="#fiscal">Fiscal</a>
            <a href="#documentos">Documentos</a>
          </nav>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#050505] px-6 py-20 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-emerald-200">Agentes de IA para PMEs</p>
            <h1 className="mt-5 max-w-[680px] text-[44px] font-semibold leading-[0.95] tracking-[-0.04em] text-white md:text-[72px]">
              Automatize financeiro, fiscal e administrativo.
            </h1>
            <p className="mt-6 max-w-[580px] text-lg leading-8 text-white/64">
              Otto conecta seus sistemas, entende os dados da empresa e aciona agentes para executar rotinas com controle humano quando importa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/integracoes" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#050505]">
                Conectar minha empresa
                <ArrowRight size={18} strokeWidth={1.6} />
              </Link>
              <Link href="/sign-up" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white">
                Criar conta
                <ArrowRight size={18} strokeWidth={1.6} />
              </Link>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <Section
        eyebrow="Conecte os dados"
        id="conecte"
        subtitle="ERPs, bancos, anuncios, e-commerce, documentos e canais de cobranca entram como contexto operacional para os agentes."
        title="Todas as fontes sincronizadas antes da IA trabalhar."
      >
        <DataConnectionSync />
      </Section>

      <Section
        eyebrow="Financeiro"
        id="financeiro"
        subtitle="Classifique despesas, concilie bancos, cartoes e movimentacoes, e deixe apenas divergencias reais para revisao."
        theme="dark"
        title="O financeiro deixa de depender de conferencia manual."
      >
        <ChatAutomationPanel dark steps={financeSteps} title="Classifique despesas e concilie os ultimos lancamentos." />
      </Section>

      <Section
        eyebrow="Caixa, relatorios e margem"
        id="caixa"
        subtitle="Otto acompanha contas a pagar, contas a receber, fluxo de caixa, relatorios e mostra onde sua margem esta vazando."
        title="Da rotina de caixa ao insight que muda a decisao."
      >
        <ChatAutomationPanel steps={cashSteps} title="Mostre caixa, relatorio executivo e onde estamos perdendo margem." />
      </Section>

      <Section
        eyebrow="Aprovacoes e controle"
        id="aprovacoes"
        subtitle="Pagamentos sensiveis podem exigir aprovacao humana, com regra aplicada, historico salvo e acao rastreavel."
        theme="dark"
        title="Automatize sem abrir mao do controle."
      >
        <ChatAutomationPanel dark steps={approvalSteps} title="Revise pagamentos acima de R$ 1.000 antes de executar." />
      </Section>

      <Section
        eyebrow="Fiscal"
        id="fiscal"
        subtitle="Notas fiscais, XMLs, impostos, obrigacoes fiscais e emissao de NFS-e ficam organizados em uma rotina acompanhavel."
        title="Seu fiscal com documentos, impostos e notas em ordem."
      >
        <ChatAutomationPanel steps={fiscalSteps} title="Organize notas fiscais, impostos pendentes e emita a NFS-e." />
      </Section>

      <Section
        eyebrow="Documentos e contratos"
        id="documentos"
        subtitle="Contratos, boletos, comprovantes, anexos e documentos administrativos saem da bagunca para pastas prontas."
        theme="warm"
        title="O administrativo ganha uma caixa de entrada inteligente."
      >
        <ChatAutomationPanel steps={documentSteps} title="Organize contratos, boletos e documentos da semana." />
      </Section>

      <Section
        eyebrow="Cobrancas"
        id="cobrancas"
        subtitle="Otto encontra inadimplentes, prepara contexto de cobranca e envia mensagens com registro no financeiro."
        theme="green"
        title="Cobrar clientes vira um fluxo acompanhado, nao uma tarefa esquecida."
      >
        <ChatAutomationPanel dark steps={collectionSteps} title="Cobre os inadimplentes e mostre as mensagens enviadas." />
      </Section>

      <Section
        eyebrow="Time de agentes"
        id="agentes"
        subtitle="Cada agente trabalha em uma parte da operacao e passa contexto para o proximo, sem perder rastreabilidade."
        title="Financeiro, fiscal, documentos, cobranca e relatorios trabalhando juntos."
      >
        <AgentHandoff />
      </Section>

      <section className="bg-[#050505] px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-[900px] text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-emerald-200">Otto</p>
          <h2 className="mt-5 text-[38px] font-semibold leading-[0.98] tracking-[-0.04em] text-white md:text-[64px]">
            Coloque seus agentes para operar a empresa todos os dias.
          </h2>
          <p className="mx-auto mt-6 max-w-[620px] text-lg leading-8 text-white/62">
            Conecte dados, automatize rotinas e mantenha aprovacao humana nas decisoes que importam.
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
