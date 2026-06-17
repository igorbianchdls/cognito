import Link from 'next/link'
import { sfPro, sfProLandingStyle } from '@/assets/landingpages/otto/fonts'
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Check,
  Database,
  FileText,
  MessageSquare,
  PlugZap,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react'

type CardCopy = {
  title: string
  description: string
}

type VariantCopy = {
  route: string
  eyebrow: string
  headline: string
  subtitle: string
  primaryCta: string
  secondaryCta: string
  heroPrompt: string
  heroReply: string
  workerName: string
  workerStatus: string
  stats: [string, string][]
  sourceTitle: string
  sources: string[]
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
  proofPoints: string[]
}

const cardIcons = [PlugZap, Bot, Workflow]

const variantA: VariantCopy = {
  route: '/lp-a',
  eyebrow: 'Funcionarios de IA para PMEs',
  headline: 'Contrate uma equipe de IA para operar sua empresa.',
  subtitle: 'Otto conecta sistemas, bancos, documentos e planilhas para criar funcionarios de IA que acompanham rotinas, respondem perguntas, geram relatorios e executam tarefas.',
  primaryCta: 'Criar meu primeiro funcionario',
  secondaryCta: 'Ver integracoes',
  heroPrompt: 'Prepare o fechamento da semana e avise o que precisa de acao.',
  heroReply: 'Vou revisar financeiro, vendas, marketing e documentos pendentes.',
  workerName: 'Gerente financeiro IA',
  workerStatus: 'fechamento preparado',
  stats: [
    ['Rotinas', '31'],
    ['Relatorios', '12'],
    ['Pendencias', '5'],
  ],
  sourceTitle: 'Fontes do trabalho',
  sources: ['ERP e CRM', 'Bancos', 'Planilhas'],
  productEyebrow: 'Equipe de IA',
  productTitle: 'Cada funcionario de IA trabalha com o contexto real do negocio.',
  cards: [
    {
      title: 'Defina a funcao',
      description: 'Crie analistas, assistentes financeiros, operadores de vendas ou agentes de atendimento.',
    },
    {
      title: 'Conecte o conhecimento',
      description: 'Entregue acesso a sistemas, documentos, bancos e planilhas que esse funcionario precisa usar.',
    },
    {
      title: 'Acompanhe o trabalho',
      description: 'Receba relatorios, alertas, tarefas concluidas e pedidos de aprovacao quando necessario.',
    },
  ],
  workflowTitle: 'Funcionario de IA',
  workflowItems: ['Funcao definida', 'Fontes liberadas', 'Rotina criada', 'Primeiro relatorio entregue'],
  workflowEyebrow: 'Rotina operacional',
  workflowHeading: 'A empresa ganha gente trabalhando em cima dos dados, sem contratar mais sistemas.',
  workflowDescription: 'Otto transforma dados espalhados em funcionarios de IA com responsabilidades claras: analisar, resumir, cobrar, reportar e acionar o time certo.',
  securityHeading: 'Cada funcionario de IA tem limites claros.',
  securityDescription: 'Controle quais fontes ele pode ler, quais acoes pode executar e quando precisa pedir aprovacao antes de seguir.',
  proofPoints: [
    'Permissoes por funcao',
    'Aprovacao para acoes sensiveis',
    'Historico de tarefas executadas',
    'Relatorios auditaveis',
  ],
}

const variantB: VariantCopy = {
  route: '/lp-b',
  eyebrow: 'Central de inteligencia operacional',
  headline: 'Uma central de inteligencia para decidir e agir mais rapido.',
  subtitle: 'Otto junta dados de sistemas, documentos, bancos e planilhas para responder perguntas, encontrar gargalos, criar relatorios e automatizar decisoes do dia a dia.',
  primaryCta: 'Centralizar meus dados',
  secondaryCta: 'Criar conta',
  heroPrompt: 'O que mudou na operacao esta semana?',
  heroReply: 'Vou comparar vendas, caixa, campanhas, documentos e atividades do time.',
  workerName: 'Central de inteligencia',
  workerStatus: 'resumo executivo pronto',
  stats: [
    ['Fontes', '16'],
    ['Insights', '24'],
    ['Acoes', '9'],
  ],
  sourceTitle: 'Base operacional',
  sources: ['Sistemas', 'Documentos', 'Bancos'],
  productEyebrow: 'Inteligencia conectada',
  productTitle: 'A resposta que voce procura quase sempre esta espalhada em varios lugares.',
  cards: [
    {
      title: 'Unifique a operacao',
      description: 'Conecte vendas, financeiro, marketing, documentos, bancos e planilhas em uma camada inteligente.',
    },
    {
      title: 'Pergunte ao negocio',
      description: 'Receba respostas com contexto real, comparacoes, tabelas, alertas e explicacoes acionaveis.',
    },
    {
      title: 'Transforme insight em acao',
      description: 'Crie relatorios, acompanhe indicadores e dispare tarefas para o time ou para funcionarios de IA.',
    },
  ],
  workflowTitle: 'Central Otto',
  workflowItems: ['Fontes conectadas', 'Dados comparados', 'Gargalos encontrados', 'Relatorio executivo gerado'],
  workflowEyebrow: 'Decisao com contexto',
  workflowHeading: 'Menos procura manual, mais decisao com base no que aconteceu de verdade.',
  workflowDescription: 'Otto conecta os pontos entre areas e mostra o que mudou, onde esta o risco e qual acao deve vir depois.',
  securityHeading: 'Inteligencia com governanca para negocios reais.',
  securityDescription: 'Defina quem pode acessar cada fonte, quais analises podem ser feitas e quais acoes exigem aprovacao.',
  proofPoints: [
    'Acesso por fonte de dados',
    'Indicadores rastreaveis',
    'Relatorios por area',
    'Acoes com controle',
  ],
}

function ProductScene({ copy }: { copy: VariantCopy }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-y-0 right-0 w-[72%] min-w-[720px] bg-[#f7f7f7]" />
      <div className="absolute right-[-40px] top-[76px] grid w-[780px] gap-4 rounded-[32px] border border-[#dedede] bg-white p-4 shadow-[0_24px_80px_rgba(24,24,24,0.12)]">
        <div className="flex items-center justify-between border-b border-[#eeeeee] pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-2xl bg-[#181818] text-sm font-semibold text-white">
              O
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-[#181818]">Otto workspace</p>
              <p className="mt-1 text-xs text-[#6a6a6a]">empresa conectada</p>
            </div>
          </div>
          <div className="rounded-full border border-[#e6e6e6] px-3 py-1 text-xs font-medium text-[#4c4c4c]">
            IA ativa
          </div>
        </div>

        <div className="grid grid-cols-[1.05fr_0.95fr] gap-4">
          <div className="grid gap-3">
            <div className="rounded-3xl border border-[#e6e6e6] bg-[#fbfbfb] p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#181818]">Chat com a empresa</p>
                <MessageSquare size={18} strokeWidth={1.5} className="text-[#6a6a6a]" />
              </div>
              <div className="grid gap-3">
                <div className="ml-auto max-w-[78%] rounded-[20px] bg-[#181818] px-4 py-3 text-sm leading-snug text-white">
                  {copy.heroPrompt}
                </div>
                <div className="max-w-[86%] rounded-[20px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm leading-snug text-[#181818]">
                  {copy.heroReply}
                </div>
                <div className="flex min-h-[64px] items-center gap-3 rounded-[20px] border border-[#e4e4e4] bg-transparent px-4 py-3">
                  <div className="grid size-9 place-items-center rounded-2xl border border-[#dddddd]">
                    <Sparkles size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-base font-semibold leading-none text-[#181818]">{copy.workerName}</p>
                    <p className="mt-1 text-xs text-[#6a6a6a]">{copy.workerStatus}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {copy.stats.map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-[#e8e8e8] bg-white p-4">
                  <p className="text-xs font-medium text-[#6a6a6a]">{label}</p>
                  <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#181818]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-[#e6e6e6] bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#181818]">{copy.sourceTitle}</p>
                <Database size={18} strokeWidth={1.5} className="text-[#6a6a6a]" />
              </div>
              <div className="grid gap-2 text-sm">
                {copy.sources.map((source) => (
                  <div key={source} className="flex items-center justify-between rounded-2xl border border-[#eeeeee] px-3 py-2">
                    <span className="font-medium text-[#181818]">{source}</span>
                    <Check size={16} strokeWidth={1.5} className="text-[#225f42]" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#e6e6e6] bg-[#fbfbfb] p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#181818]">Areas conectadas</p>
                <Brain size={18} strokeWidth={1.5} className="text-[#6a6a6a]" />
              </div>
              <div className="grid gap-3">
                {['Financeiro', 'Vendas', 'Marketing', 'Operacoes'].map((area, index) => (
                  <div key={area} className="grid grid-cols-[1fr_auto] items-center gap-3">
                    <span className="text-sm font-medium text-[#181818]">{area}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-[#6a6a6a]">
                      {index === 3 ? 'config' : 'ativo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OttoLandingExperimentPage({ copy }: { copy: VariantCopy }) {
  return (
    <main className={`${sfPro.variable} min-h-screen bg-white text-[#181818]`} style={sfProLandingStyle}>
      <section className="relative isolate min-h-[88svh] overflow-hidden border-b border-[#e8e8e8]">
        <ProductScene copy={copy} />
        <div className="relative z-10 flex min-h-[88svh] max-w-[1180px] flex-col justify-between px-6 py-6 sm:px-8 lg:mx-auto">
          <header className="flex items-center justify-between">
            <Link href={copy.route} className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-2xl bg-[#181818] text-sm font-semibold text-white">
                O
              </span>
              <span className="text-lg font-semibold tracking-[-0.03em]">Otto</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-medium text-[#6a6a6a] md:flex">
              <a href="#produto">Produto</a>
              <a href="#workflow">Workflow</a>
              <a href="#seguranca">Seguranca</a>
            </nav>
          </header>

          <div className="max-w-[600px] pb-16 pt-28 sm:pt-36">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#6a6a6a]">
              {copy.eyebrow}
            </p>
            <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.03em] text-[#181818] sm:text-7xl">
              {copy.headline}
            </h1>
            <p className="mt-6 max-w-[560px] text-lg leading-7 tracking-[-0.02em] text-[#4f4f4f]">
              {copy.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/integracoes"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#181818] px-5 py-3 text-sm font-semibold text-white"
              >
                {copy.primaryCta}
                <ArrowRight size={18} strokeWidth={1.5} />
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dcdcdc] bg-white px-5 py-3 text-sm font-semibold text-[#181818]"
              >
                {copy.secondaryCta}
                <ArrowRight size={18} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="produto" className="border-b border-[#e8e8e8] bg-white px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#6a6a6a]">{copy.productEyebrow}</p>
            <h2 className="mt-4 max-w-[560px] text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#181818] sm:text-5xl">
              {copy.productTitle}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {copy.cards.map((card, index) => {
              const Icon = cardIcons[index] || FileText
              return (
                <article key={card.title} className="rounded-[28px] border border-[#e5e5e5] bg-[#fbfbfb] p-5">
                  <Icon size={18} strokeWidth={1.5} className="text-[#181818]" />
                  <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-[#181818]">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6a6a6a]">{card.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="workflow" className="border-b border-[#e8e8e8] bg-[#f7f7f7] px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-[#dfdfdf] bg-white p-5">
            <div className="flex items-center justify-between border-b border-[#eeeeee] pb-4">
              <p className="text-sm font-semibold text-[#181818]">{copy.workflowTitle}</p>
              <BarChart3 size={18} strokeWidth={1.5} className="text-[#6a6a6a]" />
            </div>
            <div className="mt-5 grid gap-3">
              {copy.workflowItems.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#eeeeee] px-4 py-3">
                  <span className="grid size-6 place-items-center rounded-full bg-[#181818] text-white">
                    <Check size={14} strokeWidth={1.5} />
                  </span>
                  <span className="text-sm font-medium text-[#181818]">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#6a6a6a]">{copy.workflowEyebrow}</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#181818] sm:text-5xl">
              {copy.workflowHeading}
            </h2>
            <p className="mt-5 text-base leading-7 text-[#5f5f5f]">
              {copy.workflowDescription}
            </p>
          </div>
        </div>
      </section>

      <section id="seguranca" className="bg-white px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="mb-5 grid size-12 place-items-center rounded-3xl border border-[#e5e5e5]">
              <ShieldCheck size={20} strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#181818] sm:text-5xl">
              {copy.securityHeading}
            </h2>
            <p className="mt-5 text-base leading-7 text-[#5f5f5f]">
              {copy.securityDescription}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {copy.proofPoints.map((point) => (
              <div key={point} className="flex items-center gap-3 rounded-[24px] border border-[#e5e5e5] bg-[#fbfbfb] p-4">
                <Brain size={18} strokeWidth={1.5} className="shrink-0 text-[#181818]" />
                <span className="text-sm font-medium text-[#181818]">{point}</span>
              </div>
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

export function OttoLandingPageVariantB() {
  return <OttoLandingExperimentPage copy={variantB} />
}
