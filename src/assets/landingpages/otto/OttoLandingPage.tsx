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
  Workflow,
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
  'Permissoes por funcionario de IA',
  'Fontes conectadas com rastreabilidade',
  'Relatorios e analises auditaveis',
  'Automacao com aprovacao quando necessario',
]

function ProductScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#050505]" aria-hidden="true">
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="absolute right-[-80px] top-[92px] hidden w-[680px] rounded-[36px] border border-white/10 bg-[#0d0d0d] p-5 shadow-[0_24px_100px_rgba(0,0,0,0.7)] lg:block">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-sm font-semibold text-white">Otto</p>
            <p className="mt-1 text-xs text-white/45">empresa conectada</p>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
            IA ativa
          </span>
        </div>

        <div className="grid gap-3 pt-5">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-white/48">Pedido</p>
            <p className="mt-2 max-w-[430px] text-xl font-semibold leading-tight tracking-[-0.03em] text-white">
              Analise a semana e me diga o que precisa de acao.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['Financeiro', 'Vendas', 'Marketing'].map((area) => (
              <div key={area} className="rounded-[24px] border border-white/10 bg-[#141414] p-4">
                <Check size={16} strokeWidth={1.5} className="text-emerald-300" />
                <p className="mt-4 text-sm font-semibold text-white">{area}</p>
                <p className="mt-1 text-xs text-white/45">fonte conectada</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-[28px] border border-emerald-400/20 bg-emerald-400/10 p-4">
            <div className="grid size-10 place-items-center rounded-2xl bg-emerald-300 text-[#06130d]">
              <Workflow size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Analista financeiro</p>
              <p className="text-sm text-emerald-100/70">relatorio e proximas acoes prontos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OttoLandingPage() {
  return (
    <main className={`${sfPro.variable} min-h-screen bg-[#050505] text-white`} style={sfProLandingStyle}>
      <section className="relative isolate min-h-[88svh] overflow-hidden border-b border-white/10">
        <ProductScene />
        <div className="relative z-10 flex min-h-[88svh] max-w-[1180px] flex-col justify-between px-6 py-6 sm:px-8 lg:mx-auto">
          <header className="flex items-center justify-between">
            <Link href="/lp" className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-2xl bg-white text-sm font-semibold text-[#050505]">
                O
              </span>
              <span className="text-lg font-semibold tracking-[-0.03em] text-white">Otto</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-medium text-white/55 md:flex">
              <a href="#produto">Produto</a>
              <a href="#workflow">Workflow</a>
              <a href="#seguranca">Seguranca</a>
            </nav>
          </header>

          <div className="max-w-[560px] pb-16 pt-28 sm:pt-36">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-emerald-200">
              Camada de inteligencia para PMEs
            </p>
            <h1 className="max-w-[520px] text-5xl font-semibold leading-[0.95] tracking-[-0.03em] text-white sm:text-7xl">
              Otto
            </h1>
            <p className="mt-6 max-w-[520px] text-lg leading-7 tracking-[-0.02em] text-white/68">
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
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-emerald-200">Produto</p>
            <h2 className="mt-4 max-w-[520px] text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-5xl">
              Tudo que sua empresa sabe, em um lugar onde a IA consegue trabalhar.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {workflowSteps.map((step) => (
              <article key={step.title} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                <step.icon size={18} strokeWidth={1.5} className="text-emerald-200" />
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-white">{step.title}</h3>
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
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-emerald-200">Workflow</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-5xl">
              Funcionarios de IA que trabalham com os dados reais da empresa.
            </h2>
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
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-5xl">
              Controle o que cada funcionario de IA pode ler, analisar e executar.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/60">
              Defina permissoes por funcao, fonte de dados e tipo de acao antes de liberar automacoes no negocio.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {proofPoints.map((point) => (
              <div key={point} className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <Brain size={18} strokeWidth={1.5} className="shrink-0 text-emerald-200" />
                <span className="text-sm font-medium text-white">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
