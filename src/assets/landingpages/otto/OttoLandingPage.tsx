'use client'

import { useEffect, useRef, useState } from 'react'
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
  const sectionRef = useRef<HTMLElement | null>(null)
  const [hasEntered, setHasEntered] = useState(false)
  const isDark = theme === 'dark' || theme === 'green'
  const background = theme === 'dark' ? 'bg-[#050505]' : theme === 'green' ? 'bg-[#06130d]' : theme === 'warm' ? 'bg-[#f5f1eb]' : 'bg-[#f7f8fa]'
  const border = isDark ? 'border-white/10' : 'border-black/10'
  const text = isDark ? 'text-white' : 'text-[#111827]'
  const muted = isDark ? 'text-white/62' : 'text-[#667085]'
  const eyebrowColor = theme === 'green' ? 'text-emerald-200' : isDark ? 'text-emerald-200' : 'text-emerald-700'

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
    <section ref={sectionRef} id={id} className={`landing-animate-scope border-b ${border} ${background} px-6 py-20 sm:px-8 ${hasEntered ? 'landing-in-view' : ''}`}>
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
    <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-black/10 bg-white" style={{ color: row.tone }}>
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
        <div className="relative min-h-[560px] bg-white px-1 py-3 sm:p-5">
          <div className="landing-prompt-input absolute bottom-3 left-1 right-1 z-20 flex h-[58px] items-center gap-2 overflow-hidden rounded-[28px] bg-[#f1f1f1] px-3 py-2 sm:bottom-5 sm:left-5 sm:right-5 sm:gap-3 sm:rounded-full sm:px-4">
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
          <div className="landing-chat-scroll absolute bottom-[112px] left-1 right-1 top-3 overflow-x-hidden overflow-y-auto sm:bottom-[92px] sm:left-5 sm:right-5 sm:top-5">
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

        <div className="relative min-h-[560px] min-w-0 bg-white px-1 py-3 sm:p-5">
          <div className="flex h-11 items-center justify-between border-b border-[#f0f0f0] pb-3">
            <div>
              <p className="text-[15px] font-semibold text-[#111111]">ChatGPT</p>
              <p className="truncate text-xs font-medium text-[#777777]">Otto conectado aos dados financeiros</p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 sm:px-3 sm:text-xs">Tools ativas</span>
          </div>

          <div className="landing-chat-scroll absolute bottom-[92px] left-1 right-1 top-[76px] overflow-x-hidden overflow-y-auto sm:left-5 sm:right-5">
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

          <div className="absolute bottom-5 left-1 right-1 z-20 flex h-[58px] items-center gap-2 overflow-hidden rounded-[18px] border border-[#e5e5e5] bg-white px-3 py-2 sm:left-5 sm:right-5 sm:gap-3 sm:px-4">
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
    <div className="grid gap-3 rounded-[30px] border border-black/10 bg-white p-5 md:grid-cols-5">
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
        eyebrow="Financeiro no desktop"
        id="financeiro-desktop"
        subtitle="Para quem trabalha no computador, Otto tambem roda dentro do ChatGPT em uma conversa ampla, com tool calls, tabelas animadas e resumo executivo."
        title="A rotina financeira acontecendo no ChatGPT desktop."
      >
        <DesktopChatAutomationPanel steps={financeSteps} title="Analise o financeiro do mes, classifique despesas e concilie banco com ERP." />
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
