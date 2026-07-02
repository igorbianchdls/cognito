import Link from 'next/link'
import { sfPro, sfProLandingStyle } from '@/assets/landingpages/otto/fonts'
import {
  ArrowRight,
  Brain,
  Check,
  Database,
  LineChart,
  MessageSquare,
  PlugZap,
  ShieldCheck,
} from 'lucide-react'

const workflowSteps = [
  {
    icon: PlugZap,
    title: 'Conecte suas fontes',
    description: 'Integre ERPs, CRMs, bancos, planilhas, documentos e ferramentas de marketing.',
  },
  {
    icon: Database,
    title: 'Crie funcionarios de IA',
    description: 'Configure agentes para atendimento, financeiro, vendas, marketing, operacoes e gestao.',
  },
  {
    icon: MessageSquare,
    title: 'Automatize o trabalho',
    description: 'Transforme rotinas manuais em analises, relatorios, alertas e acoes acompanhaveis.',
  },
]

const proofPoints = [
  {
    title: 'Permissoes por funcionario de IA',
    description: 'Defina quais dados cada agente pode consultar e quais areas ficam fora do escopo.',
  },
  {
    title: 'Fontes conectadas com rastreabilidade',
    description: 'Acompanhe de onde veio cada informacao usada em analises, respostas e relatorios.',
  },
  {
    title: 'Relatorios e analises auditaveis',
    description: 'Mantenha historico do que foi gerado, quando foi gerado e qual contexto foi usado.',
  },
  {
    title: 'Automacao com aprovacao quando necessario',
    description: 'Exija confirmacao humana antes de executar acoes sensiveis no negocio.',
  },
]

const whiteTitleStyle = { color: '#ffffff', letterSpacing: '-0.02em' }
const heroTitleStyle = { ...whiteTitleStyle, fontSize: 'var(--otto-title-size)', lineHeight: 0.95 }
const sectionTitleStyle = { ...whiteTitleStyle, fontSize: 'var(--otto-title-size)', lineHeight: 0.95 }
const cardTitleStyle = { ...whiteTitleStyle, fontSize: '18px', lineHeight: 1.25 }
const responsiveHeroTitleClassName = '[--otto-title-size:40px] md:[--otto-title-size:50px]'
const responsiveSectionTitleClassName = '[--otto-title-size:30px] md:[--otto-title-size:50px]'
const mobileCarouselTrackClassName =
  'flex gap-3 overflow-x-auto scroll-smooth pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch] [scroll-snap-type:x_mandatory] lg:grid lg:overflow-visible lg:pb-0 lg:[scroll-snap-type:none]'
const mobileCarouselCardClassName = 'min-w-[78vw] snap-start lg:min-w-0'

export function OttoLandingPage() {
  return (
    <main className={`${sfPro.variable} min-h-screen bg-[#050505] text-white`} style={sfProLandingStyle}>
      <section className="relative isolate min-h-[88svh] overflow-hidden border-b border-white/10">
        <div className="relative z-10 flex min-h-[88svh] max-w-[1180px] flex-col px-6 py-6 sm:px-8 lg:mx-auto">
          <header className="flex items-center justify-between">
            <Link href="/lp" className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-2xl bg-white text-sm font-semibold text-[#050505]">
                O
              </span>
              <span className="text-lg font-semibold text-white">Otto</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-medium text-white/55 md:flex">
              <a href="#produto">Produto</a>
              <a href="#workflow">Workflow</a>
              <a href="#seguranca">Seguranca</a>
            </nav>
          </header>

          <div className="max-w-[560px] pb-16 pt-10 sm:pt-12 lg:pt-14">
            <p className="mb-4 text-sm font-semibold uppercase text-emerald-200">
              Camada de inteligencia para PMEs
            </p>
            <p className={`max-w-[520px] font-semibold text-white ${responsiveHeroTitleClassName}`} style={heroTitleStyle}>
              Otto
            </p>
            <p className="mt-6 max-w-[520px] text-lg leading-7 text-white/68">
              Conecte sistemas, documentos, bancos e planilhas. Crie funcionarios de IA que entendem sua operacao, automatizam tarefas, analisam dados e geram relatorios para sua empresa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/integracoes"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#050505]"
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
        </div>
      </section>

      <section id="produto" className="border-b border-white/10 bg-[#050505] px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-200">Produto</p>
            <p className={`mt-4 max-w-[520px] font-semibold text-white ${responsiveSectionTitleClassName}`} style={sectionTitleStyle}>
              Tudo que sua empresa sabe, em um lugar onde a IA consegue trabalhar.
            </p>
          </div>
          <div className={`${mobileCarouselTrackClassName} lg:grid-cols-2`} aria-label="Recursos do produto">
            {workflowSteps.map((step) => (
              <article key={step.title} className={`${mobileCarouselCardClassName} rounded-[28px] border border-white/10 bg-white/[0.04] p-5`}>
                <step.icon size={18} strokeWidth={1.5} className="text-emerald-200" />
                <p className="mt-5 font-semibold text-white" style={cardTitleStyle}>{step.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/58">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="border-b border-white/10 bg-[#0a0a0a] px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <p className="text-sm font-semibold text-white">Funcionario de IA</p>
              <LineChart size={18} strokeWidth={1.5} className="text-white/50" />
            </div>
            <div className="mt-5 grid gap-3">
              {['Fontes conectadas', 'Documentos e planilhas interpretados', 'Dados organizados', 'Funcionario de IA pronto para trabalhar'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span className="grid size-6 place-items-center rounded-full bg-emerald-300 text-[#06130d]">
                    <Check size={14} strokeWidth={1.5} />
                  </span>
                  <span className="text-sm font-medium text-white">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase text-emerald-200">Workflow</p>
            <p className={`mt-4 font-semibold text-white ${responsiveSectionTitleClassName}`} style={sectionTitleStyle}>
              Funcionarios de IA que trabalham com os dados reais da empresa.
            </p>
            <p className="mt-5 text-base leading-7 text-white/60">
              Otto organiza o conhecimento operacional do negocio e entrega contexto para cada funcionario de IA executar tarefas com seguranca.
            </p>
          </div>
        </div>
      </section>

      <section id="seguranca" className="bg-[#050505] px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="mb-5 grid size-12 place-items-center rounded-3xl border border-white/10 bg-white/[0.04] text-emerald-200">
              <ShieldCheck size={20} strokeWidth={1.5} />
            </div>
            <p className={`font-semibold text-white ${responsiveSectionTitleClassName}`} style={sectionTitleStyle}>
              Controle o que cada funcionario de IA pode ler, analisar e executar.
            </p>
            <p className="mt-5 text-base leading-7 text-white/60">
              Defina permissoes por funcao, fonte de dados e tipo de acao antes de liberar automacoes no negocio.
            </p>
          </div>
          <div className={`${mobileCarouselTrackClassName} lg:grid-cols-2`} aria-label="Controles e seguranca">
            {proofPoints.map((point) => (
              <div key={point.title} className={`${mobileCarouselCardClassName} rounded-[24px] border border-white/10 bg-white/[0.04] p-5`}>
                <Brain size={18} strokeWidth={1.5} className="shrink-0 text-emerald-200" />
                <p className="mt-4 font-semibold text-white" style={cardTitleStyle}>{point.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/58">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
