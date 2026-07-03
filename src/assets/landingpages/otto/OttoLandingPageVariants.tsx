import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { sfPro, sfProLandingStyle } from '@/assets/landingpages/otto/fonts'
import BlingIcon from '@/components/icons/BlingIcon'
import ContaAzulIcon from '@/components/icons/ContaAzulIcon'
import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon'
import MetaIcon from '@/components/icons/MetaIcon'
import NuvemshopIcon from '@/components/icons/NuvemshopIcon'
import OmieIcon from '@/components/icons/OmieIcon'
import PipedriveIcon from '@/components/icons/PipedriveIcon'
import RdStationIcon from '@/components/icons/RdStationIcon'
import TinyIcon from '@/components/icons/TinyIcon'
import TotvsIcon from '@/components/icons/TotvsIcon'
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Calculator,
  Check,
  FileText,
  Landmark,
  LayoutDashboard,
  LineChart,
  PlugZap,
  ShieldCheck,
  Tags,
  Workflow,
} from 'lucide-react'

type CardCopy = {
  title: string
  description: string
}

type IntegrationLogoCopy = {
  name: string
  Icon: ComponentType<{ className?: string }>
}

type CapabilityCardCopy = CardCopy & {
  Icon: LucideIcon
  metric: string
}

type VariantCopy = {
  route: string
  headline: string
  subtitle: string
  primaryCta: string
  secondaryCta: string
  productEyebrow: string
  productTitle: string
  cards: CardCopy[]
  workflowTitle: string
  workflowItems: string[]
  workflowEyebrow: string
  workflowHeading: string
  workflowDescription: string
  securityHeading: string
  securityDescription: string
  proofPoints: CardCopy[]
}

const cardIcons = [PlugZap, Bot, Workflow]

const whiteTitleStyle = { color: '#ffffff', letterSpacing: '-0.02em' }
const heroTitleStyle = { ...whiteTitleStyle, fontSize: 'var(--otto-title-size)', lineHeight: 0.95 }
const sectionTitleStyle = { ...whiteTitleStyle, fontSize: 'var(--otto-title-size)', lineHeight: 0.95 }
const cardTitleStyle = { ...whiteTitleStyle, fontSize: '18px', lineHeight: 1.25 }
const responsiveHeroTitleClassName = '[--otto-title-size:40px] md:[--otto-title-size:50px]'
const responsiveSectionTitleClassName = '[--otto-title-size:30px] md:[--otto-title-size:50px]'
const mobileCarouselTrackClassName =
  'flex gap-3 overflow-x-auto scroll-smooth pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch] [scroll-snap-type:x_mandatory] lg:grid lg:overflow-visible lg:pb-0 lg:[scroll-snap-type:none]'
const mobileCarouselCardClassName = 'min-w-[78vw] snap-start lg:min-w-0'

const landingIntegrationRows: IntegrationLogoCopy[][] = [
  [
    { name: 'Conta Azul', Icon: ContaAzulIcon },
    { name: 'Omie', Icon: OmieIcon },
    { name: 'Bling', Icon: BlingIcon },
    { name: 'Tiny', Icon: TinyIcon },
    { name: 'TOTVS', Icon: TotvsIcon },
  ],
  [
    { name: 'RD Station', Icon: RdStationIcon },
    { name: 'Pipedrive', Icon: PipedriveIcon },
    { name: 'Nuvemshop', Icon: NuvemshopIcon },
    { name: 'Meta Ads', Icon: MetaIcon },
    { name: 'Google Ads', Icon: GoogleAdsIcon },
  ],
]

const howItWorksSteps: CardCopy[] = [
  {
    title: 'Conecte as fontes',
    description: 'ERP, banco, planilhas, documentos e plataformas entram como base de trabalho.',
  },
  {
    title: 'O funcionario de IA executa',
    description: 'Ele consulta dados, cruza informacoes, encontra pendencias e prepara a acao.',
  },
  {
    title: 'Voce aprova o que importa',
    description: 'Relatorios, alertas e acoes sensiveis chegam com contexto para revisao.',
  },
]

const capabilityCards: CapabilityCardCopy[] = [
  {
    title: 'Realiza lancamentos',
    description: 'Cria lancamentos no ERP a partir de notas, extratos, documentos e pedidos aprovados.',
    Icon: Calculator,
    metric: 'ERP atualizado',
  },
  {
    title: 'Classifica despesas',
    description: 'Identifica categorias, centros de custo e fornecedores para reduzir trabalho manual no financeiro.',
    Icon: Tags,
    metric: 'Regras aplicadas',
  },
  {
    title: 'Conciliacao bancaria',
    description: 'Compara extrato, contas a pagar, contas a receber e lancamentos para encontrar divergencias.',
    Icon: Landmark,
    metric: 'Movimentos conciliados',
  },
  {
    title: 'Analise de Dados',
    description: 'Cruza dados financeiros e operacionais para explicar variacoes, riscos e oportunidades.',
    Icon: LineChart,
    metric: 'Insights com contexto',
  },
  {
    title: 'Criacao de Dashboards',
    description: 'Monta visoes de caixa, inadimplencia, despesas, vendas e operacao para acompanhar a empresa.',
    Icon: LayoutDashboard,
    metric: 'Indicadores prontos',
  },
]

const variantA: VariantCopy = {
  route: '/lp-a',
  headline: 'Automatize o financeiro do seu negocio com funcionarios de IA.',
  subtitle: 'Otto conecta seus sistemas, documentos, plataformas e planilhas para criar funcionarios de IA que acompanham o financeiro, organizam a operacao, geram relatorios e automatizam tarefas do dia a dia.',
  primaryCta: 'Criar meu primeiro funcionario de IA',
  secondaryCta: 'Ver integracoes',
  productEyebrow: 'Produto',
  productTitle: 'Cada funcionario de IA recebe uma funcao, acessa as fontes certas e trabalha com os dados reais da empresa.',
  cards: [
    {
      title: 'Defina a funcao',
      description: 'Crie funcionarios para financeiro, operacao, compras, cobranca, documentos ou relatorios.',
    },
    {
      title: 'Conecte as fontes',
      description: 'Integre sistemas, bancos, plataformas, planilhas e arquivos usados pela sua empresa.',
    },
    {
      title: 'Automatize a rotina',
      description: 'Receba analises, alertas, tarefas concluidas e pedidos de aprovacao quando necessario.',
    },
  ],
  workflowTitle: 'Funcionario de IA',
  workflowItems: ['Funcao definida', 'Fontes conectadas', 'Rotina automatizada', 'Relatorio entregue'],
  workflowEyebrow: 'Rotina operacional',
  workflowHeading: 'A empresa ganha gente trabalhando em cima dos dados, sem aumentar a equipe.',
  workflowDescription: 'Otto transforma dados espalhados em funcionarios de IA com responsabilidades claras: analisar, conferir, cobrar, resumir, reportar e acionar o time certo.',
  securityHeading: 'Cada funcionario de IA trabalha com limites claros.',
  securityDescription: 'Controle quais fontes ele pode acessar, quais acoes pode executar e quando precisa pedir aprovacao humana.',
  proofPoints: [
    {
      title: 'Permissoes por funcao',
      description: 'Cada funcionario acessa apenas os dados necessarios para sua rotina.',
    },
    {
      title: 'Aprovacao para acoes sensiveis',
      description: 'Pagamentos, cobrancas, mensagens e alteracoes criticas podem exigir validacao.',
    },
    {
      title: 'Historico de execucao',
      description: 'Veja o que foi feito, quando aconteceu e qual funcionario de IA executou.',
    },
    {
      title: 'Relatorios auditaveis',
      description: 'Mantenha entregas e analises registradas com contexto para revisao posterior.',
    },
  ],
}

const departmentCards: CardCopy[] = [
  {
    title: 'Financeiro',
    description: 'Fluxo de caixa, contas a pagar, contas a receber, cobrancas, conciliacao e fechamento.',
  },
  {
    title: 'Operacao',
    description: 'Acompanhamento de processos, pendencias, aprovacoes, documentos e rotinas entre areas.',
  },
  {
    title: 'Compras e fornecedores',
    description: 'Pedidos, notas, contratos, vencimentos e alertas de divergencia.',
  },
  {
    title: 'Relatorios de gestao',
    description: 'Resumo executivo, indicadores, variacoes e explicacoes com contexto do negocio.',
  },
]

const rolloutSteps: CardCopy[] = [
  {
    title: 'Escolha a rotina',
    description: 'Defina uma tarefa recorrente do financeiro ou da operacao que hoje depende de trabalho manual.',
  },
  {
    title: 'Conecte os dados',
    description: 'Libere os sistemas, planilhas, documentos e plataformas necessarios para executar a rotina.',
  },
  {
    title: 'Valide as primeiras entregas',
    description: 'Revise relatorios, alertas e acoes antes de deixar o fluxo rodar com mais autonomia.',
  },
  {
    title: 'Expanda por area',
    description: 'Depois de validar o primeiro caso, crie novos funcionarios de IA para outras rotinas.',
  },
]

const resultCards: CardCopy[] = [
  {
    title: 'Financeiro mais acompanhado',
    description: 'Caixa, contas e cobrancas deixam de depender so de checagens manuais.',
  },
  {
    title: 'Operacao mais organizada',
    description: 'Pendencias, documentos e aprovacoes ficam visiveis e acionaveis.',
  },
  {
    title: 'Gestao com contexto',
    description: 'O dono recebe relatorios e explicacoes baseados nos dados reais da empresa.',
  },
]

function getTheme(copy: VariantCopy) {
  void copy

  return {
    accent: 'text-violet-200',
    badge: 'border-violet-400/20 bg-violet-400/10 text-violet-200',
    icon: 'text-violet-200',
    iconBox: 'bg-violet-300 text-[#16091f]',
    result: 'border-violet-400/20 bg-violet-400/10',
  }
}

function LandingIntegrationsMarqueeSection() {
  return (
    <section id="integracoes" className="border-b border-white/10 bg-[#080808] px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-10 max-w-[680px]">
          <p className="text-sm font-semibold uppercase text-violet-200">Integracoes</p>
          <p className={`mt-4 font-semibold text-white ${responsiveSectionTitleClassName}`} style={sectionTitleStyle}>
            Conecte os sistemas que guardam o financeiro e a operacao da empresa.
          </p>
          <p className="mt-5 text-base leading-7 text-white/60">
            Otto usa essas fontes para dar contexto aos funcionarios de IA: ERPs, CRMs, ecommerce, anuncios, documentos e planilhas.
          </p>
        </div>

        <div className="space-y-4" aria-label="Integracoes disponiveis em movimento">
          {landingIntegrationRows.map((row, rowIndex) => (
            <div key={rowIndex} className="integracoes-logo-marquee">
              <div
                className={`integracoes-logo-marquee__track ${
                  rowIndex === 0
                    ? 'integracoes-logo-marquee__track--left'
                    : 'integracoes-logo-marquee__track--right'
                }`}
              >
                {[...row, ...row].map(({ Icon, name }, index) => (
                  <div key={`${name}-${index}`} className="integracoes-logo-marquee__item">
                    <Icon className="h-8 w-8 rounded-md" />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function LandingHowItWorksSection() {
  return (
    <section id="como-funciona" className="border-b border-white/10 bg-[#040404] px-6 py-16 sm:px-8">
      <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase text-violet-200">Como funciona</p>
          <p className={`mt-4 font-semibold text-white ${responsiveSectionTitleClassName}`} style={sectionTitleStyle}>
            O usuario pede uma rotina. Otto usa as integracoes e entrega o trabalho pronto para revisar.
          </p>
          <p className="mt-5 text-base leading-7 text-white/60">
            A experiencia parece um chat, mas por tras cada funcionario de IA busca dados, cruza informacoes e executa etapas com limites claros.
          </p>

          <div className="mt-7 grid gap-3">
            {howItWorksSteps.map((step, index) => (
              <div key={step.title} className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-300 text-[13px] font-semibold text-[#16091f]">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-white" style={cardTitleStyle}>{step.title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/58">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="integracoes-chat-demo" aria-label="Animacao mostrando Otto usando integracoes">
          <div className="integracoes-chat-demo__phone">
            <div className="integracoes-chat-demo__status">
              <span>18:07</span>
              <span>Otto</span>
              <span>...</span>
            </div>

            <div className="integracoes-chat-demo__conversation">
              <div className="integracoes-chat-demo__bubble integracoes-chat-demo__bubble--user integracoes-chat-demo__step integracoes-chat-demo__step--1">
                Concilie o banco com o ERP e me mostre pendencias da semana.
              </div>

              <div className="integracoes-chat-demo__assistant integracoes-chat-demo__step integracoes-chat-demo__step--2">
                <div className="integracoes-chat-demo__assistant-header">Otto</div>
                Vou buscar extrato, lancamentos do ERP e planilhas financeiras conectadas.
              </div>

              <div className="integracoes-chat-demo__tool integracoes-chat-demo__step integracoes-chat-demo__step--3">
                <span>consultar_conta_azul</span>
                <strong>124 lancamentos encontrados</strong>
              </div>

              <div className="integracoes-chat-demo__tool integracoes-chat-demo__step integracoes-chat-demo__step--4">
                <span>conciliar_extrato</span>
                <strong>14 movimentos conciliados</strong>
              </div>

              <div className="integracoes-chat-demo__assistant integracoes-chat-demo__step integracoes-chat-demo__step--5">
                <div className="integracoes-chat-demo__assistant-header">Otto</div>
                Feito. Separei 3 divergencias, 2 contas vencendo hoje e um resumo para aprovacao.
              </div>
            </div>

            <div className="integracoes-chat-demo__input">
              <span>Pedir uma rotina financeira</span>
              <i />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CapabilityImage({ card, index }: { card: CapabilityCardCopy; index: number }) {
  const Icon = card.Icon

  return (
    <figure className="relative min-h-[190px] overflow-hidden rounded-[24px] border border-white/10 bg-[#101014] p-5" role="img" aria-label={`Imagem de ${card.title}`}>
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_30%_20%,rgba(196,181,253,0.28),transparent_58%)]" />
      <div className="relative flex items-center justify-between">
        <div className="grid size-12 place-items-center rounded-2xl bg-violet-300 text-[#16091f]">
          <Icon size={22} strokeWidth={1.6} />
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase text-white/55">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <div className="relative mt-8 rounded-[18px] border border-white/10 bg-white/[0.05] p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold uppercase text-white/45">{card.metric}</span>
          <span className="h-2 w-2 rounded-full bg-violet-300" />
        </div>
        <div className="mt-4 grid gap-2">
          {[0, 1, 2].map((row) => (
            <span
              key={row}
              className="block h-2 rounded-full bg-white/15"
              style={{ width: `${92 - row * 18}%` }}
            />
          ))}
        </div>
      </div>
    </figure>
  )
}

function LandingCapabilitiesSection() {
  return (
    <section id="o-que-faz" className="border-b border-white/10 bg-[#080808] px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-10 max-w-[680px]">
          <p className="text-sm font-semibold uppercase text-violet-200">O que faz</p>
          <p className={`mt-4 font-semibold text-white ${responsiveSectionTitleClassName}`} style={sectionTitleStyle}>
            Funcionarios de IA para tirar rotinas financeiras do manual.
          </p>
          <p className="mt-5 text-base leading-7 text-white/60">
            Cada rotina combina dados conectados, regras do negocio e aprovacao humana quando a acao pede controle.
          </p>
        </div>

        <div className={`${mobileCarouselTrackClassName} lg:grid-cols-5`} aria-label="O que os funcionarios de IA fazem">
          {capabilityCards.map((card, index) => (
            <article key={card.title} className={`${mobileCarouselCardClassName} rounded-[28px] border border-white/10 bg-white/[0.04] p-3`}>
              <CapabilityImage card={card} index={index} />
              <div className="p-2 pt-5">
                <p className="font-semibold text-white" style={cardTitleStyle}>{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/58">{card.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function OttoLandingExperimentPage({ copy }: { copy: VariantCopy }) {
  const theme = getTheme(copy)

  return (
    <main className={`${sfPro.variable} min-h-screen bg-[#040404] text-white`} style={sfProLandingStyle}>
      <section className="relative isolate min-h-[88svh] overflow-hidden border-b border-white/10">
        <div className="relative z-10 flex min-h-[88svh] max-w-[1180px] flex-col px-6 py-6 sm:px-8 lg:mx-auto">
          <header className="flex items-center justify-between">
            <Link href={copy.route} className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-2xl bg-white text-sm font-semibold text-[#040404]">
                O
              </span>
              <span className="text-lg font-semibold text-white">Otto</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-medium text-white/55 md:flex">
              <a href="#integracoes">Integracoes</a>
              <a href="#como-funciona">Como funciona</a>
              <a href="#o-que-faz">O que faz</a>
              <a href="#produto">Produto</a>
              <a href="#areas">Areas</a>
              <a href="#seguranca">Seguranca</a>
            </nav>
          </header>

          <div className="max-w-[600px] pb-16 pt-10 sm:pt-12 lg:pt-14">
            <p className={`max-w-[620px] font-semibold text-white ${responsiveHeroTitleClassName}`} style={heroTitleStyle}>
              {copy.headline}
            </p>
            <p className="mt-6 max-w-[560px] text-lg leading-7 text-white/68">
              {copy.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/integracoes"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#040404]"
              >
                {copy.primaryCta}
                <ArrowRight size={18} strokeWidth={1.5} />
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white"
              >
                {copy.secondaryCta}
                <ArrowRight size={18} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingIntegrationsMarqueeSection />
      <LandingHowItWorksSection />
      <LandingCapabilitiesSection />

      <section id="produto" className="border-b border-white/10 bg-[#040404] px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className={`text-sm font-semibold uppercase ${theme.accent}`}>{copy.productEyebrow}</p>
            <p className={`mt-4 max-w-[560px] font-semibold text-white ${responsiveSectionTitleClassName}`} style={sectionTitleStyle}>
              {copy.productTitle}
            </p>
          </div>
          <div className={`${mobileCarouselTrackClassName} lg:grid-cols-2`} aria-label="Recursos do produto">
            {copy.cards.map((card, index) => {
              const Icon = cardIcons[index] || FileText
              return (
                <article key={card.title} className={`${mobileCarouselCardClassName} rounded-[28px] border border-white/10 bg-white/[0.04] p-5`}>
                  <Icon size={18} strokeWidth={1.5} className={theme.icon} />
                  <p className="mt-5 font-semibold text-white" style={cardTitleStyle}>{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/58">{card.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="areas" className="border-b border-white/10 bg-[#080808] px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className={`text-sm font-semibold uppercase ${theme.accent}`}>Areas da empresa</p>
            <p className={`mt-4 max-w-[520px] font-semibold text-white ${responsiveSectionTitleClassName}`} style={sectionTitleStyle}>
              Comece pelo financeiro ou pela operacao e expanda conforme a empresa ganha ritmo.
            </p>
            <p className="mt-5 text-base leading-7 text-white/60">
              Otto foi desenhado para PMEs que precisam tirar trabalho manual da equipe sem contratar mais sistemas.
            </p>
          </div>
          <div className={`${mobileCarouselTrackClassName} lg:grid-cols-2`} aria-label="Areas atendidas">
            {departmentCards.map((card) => (
              <article key={card.title} className={`${mobileCarouselCardClassName} rounded-[28px] border border-white/10 bg-white/[0.04] p-5`}>
                <Brain size={18} strokeWidth={1.5} className={theme.icon} />
                <p className="mt-5 font-semibold text-white" style={cardTitleStyle}>{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/58">{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="border-b border-white/10 bg-[#0a0a0b] px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-white/10 bg-[#111114] p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <p className="text-sm font-semibold text-white">{copy.workflowTitle}</p>
              <BarChart3 size={18} strokeWidth={1.5} className="text-white/50" />
            </div>
            <div className="mt-5 grid gap-3">
              {copy.workflowItems.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span className={`grid size-6 place-items-center rounded-full ${theme.iconBox}`}>
                    <Check size={14} strokeWidth={1.5} />
                  </span>
                  <span className="text-sm font-medium text-white">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className={`text-sm font-semibold uppercase ${theme.accent}`}>{copy.workflowEyebrow}</p>
            <p className={`mt-4 font-semibold text-white ${responsiveSectionTitleClassName}`} style={sectionTitleStyle}>
              {copy.workflowHeading}
            </p>
            <p className="mt-5 text-base leading-7 text-white/60">
              {copy.workflowDescription}
            </p>
          </div>
        </div>
      </section>

      <section id="implantacao" className="border-b border-white/10 bg-[#040404] px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className={`text-sm font-semibold uppercase ${theme.accent}`}>Implantacao</p>
            <p className={`mt-4 max-w-[540px] font-semibold text-white ${responsiveSectionTitleClassName}`} style={sectionTitleStyle}>
              Coloque o primeiro funcionario de IA para trabalhar em uma rotina especifica.
            </p>
          </div>
          <div className={`${mobileCarouselTrackClassName} lg:grid-cols-2`} aria-label="Etapas de implantacao">
            {rolloutSteps.map((step, index) => (
              <article key={step.title} className={`${mobileCarouselCardClassName} rounded-[28px] border border-white/10 bg-white/[0.04] p-5`}>
                <span className={`grid size-8 place-items-center rounded-full text-sm font-semibold ${theme.iconBox}`}>
                  {index + 1}
                </span>
                <p className="mt-5 font-semibold text-white" style={cardTitleStyle}>{step.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/58">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="seguranca" className="border-b border-white/10 bg-[#080808] px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className={`mb-5 grid size-12 place-items-center rounded-3xl border ${theme.result}`}>
              <ShieldCheck size={20} strokeWidth={1.5} />
            </div>
            <p className={`font-semibold text-white ${responsiveSectionTitleClassName}`} style={sectionTitleStyle}>
              {copy.securityHeading}
            </p>
            <p className="mt-5 text-base leading-7 text-white/60">
              {copy.securityDescription}
            </p>
          </div>
          <div className={`${mobileCarouselTrackClassName} lg:grid-cols-2`} aria-label="Governanca e controle">
            {copy.proofPoints.map((point) => (
              <div key={point.title} className={`${mobileCarouselCardClassName} rounded-[24px] border border-white/10 bg-white/[0.04] p-5`}>
                <Brain size={18} strokeWidth={1.5} className={`shrink-0 ${theme.icon}`} />
                <p className="mt-4 font-semibold text-white" style={cardTitleStyle}>{point.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/58">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="resultados" className="bg-[#040404] px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className={`text-sm font-semibold uppercase ${theme.accent}`}>Resultados</p>
            <p className={`mt-4 max-w-[540px] font-semibold text-white ${responsiveSectionTitleClassName}`} style={sectionTitleStyle}>
              Menos operacao manual. Mais clareza sobre o que esta acontecendo no negocio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/integracoes"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#040404]"
              >
                Conectar minha empresa
                <ArrowRight size={18} strokeWidth={1.5} />
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white"
              >
                Criar conta
                <ArrowRight size={18} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
          <div className={`${mobileCarouselTrackClassName} lg:grid-cols-3`} aria-label="Resultados esperados">
            {resultCards.map((card) => (
              <article key={card.title} className={`${mobileCarouselCardClassName} rounded-[28px] border border-white/10 bg-white/[0.04] p-5`}>
                <Check size={18} strokeWidth={1.5} className={theme.icon} />
                <p className="mt-5 font-semibold text-white" style={cardTitleStyle}>{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/58">{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export function OttoLandingPageVariantA() {
  return <OttoLandingExperimentPage copy={variantA} />
}
