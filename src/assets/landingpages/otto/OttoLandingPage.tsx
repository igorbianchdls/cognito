import Link from 'next/link'
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

const integrations = ['Meta Ads', 'Google Ads', 'HubSpot', 'Shopify', 'TOTVS', 'BigQuery']

const workflowSteps = [
  {
    icon: PlugZap,
    title: 'Conecte as fontes',
    description: 'OAuth, conectores e datasets por tenant em um fluxo unico.',
  },
  {
    icon: Database,
    title: 'Organize o warehouse',
    description: 'Raw e normalized prontos para consulta, auditoria e MCP.',
  },
  {
    icon: MessageSquare,
    title: 'Use no chat',
    description: 'ChatGPT e Claude consultam dados e executam tools com contexto.',
  },
]

const proofPoints = [
  'Datasets por organizacao',
  'Permissoes para leitura e acao',
  'Observabilidade de conectores',
  'Dashboards e artifacts acionaveis',
]

function ProductScene() {
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
              <p className="mt-1 text-xs text-[#6a6a6a]">tenant_org_82</p>
            </div>
          </div>
          <div className="rounded-full border border-[#e6e6e6] px-3 py-1 text-xs font-medium text-[#4c4c4c]">
            datasets synced
          </div>
        </div>

        <div className="grid grid-cols-[1.05fr_0.95fr] gap-4">
          <div className="grid gap-3">
            <div className="rounded-3xl border border-[#e6e6e6] bg-[#fbfbfb] p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#181818]">Chat operacional</p>
                <MessageSquare size={18} strokeWidth={1.5} className="text-[#6a6a6a]" />
              </div>
              <div className="grid gap-3">
                <div className="ml-auto max-w-[76%] rounded-[20px] bg-[#181818] px-4 py-3 text-sm leading-snug text-white">
                  Analise campanhas de hoje e mostre os gargalos.
                </div>
                <div className="max-w-[84%] rounded-[20px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm leading-snug text-[#181818]">
                  Vou chamar marketing para buscar spend, receita e ROAS.
                </div>
                <div className="flex min-h-[64px] items-center gap-3 rounded-[20px] border border-[#e4e4e4] bg-transparent px-4 py-3">
                  <div className="grid size-9 place-items-center rounded-2xl border border-[#dddddd]">
                    <Workflow size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-base font-semibold leading-none text-[#181818]">marketing</p>
                    <p className="mt-1 text-xs text-[#6a6a6a]">tool call concluida</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                ['ROAS', '4.8x'],
                ['Spend', 'R$ 82k'],
                ['Alertas', '7'],
              ].map(([label, value]) => (
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
                <p className="text-sm font-semibold text-[#181818]">Warehouse</p>
                <Database size={18} strokeWidth={1.5} className="text-[#6a6a6a]" />
              </div>
              <div className="grid gap-2 text-sm">
                {['org_82_raw', 'org_82_normalized', 'connector_events'].map((dataset) => (
                  <div key={dataset} className="flex items-center justify-between rounded-2xl border border-[#eeeeee] px-3 py-2">
                    <span className="font-medium text-[#181818]">{dataset}</span>
                    <Check size={16} strokeWidth={1.5} className="text-[#225f42]" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#e6e6e6] bg-[#fbfbfb] p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#181818]">Connectors</p>
                <PlugZap size={18} strokeWidth={1.5} className="text-[#6a6a6a]" />
              </div>
              <div className="grid gap-3">
                {integrations.slice(0, 4).map((integration, index) => (
                  <div key={integration} className="grid grid-cols-[1fr_auto] items-center gap-3">
                    <span className="text-sm font-medium text-[#181818]">{integration}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-[#6a6a6a]">
                      {index === 3 ? 'pending' : 'live'}
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

export function OttoLandingPage() {
  return (
    <main className="min-h-screen bg-white text-[#181818]">
      <section className="relative isolate min-h-[88svh] overflow-hidden border-b border-[#e8e8e8]">
        <ProductScene />
        <div className="relative z-10 flex min-h-[88svh] max-w-[1180px] flex-col justify-between px-6 py-6 sm:px-8 lg:mx-auto">
          <header className="flex items-center justify-between">
            <Link href="/lp" className="flex items-center gap-3">
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

          <div className="max-w-[560px] pb-16 pt-28 sm:pt-36">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#6a6a6a]">
              SaaS operacional para dados e agentes
            </p>
            <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.03em] text-[#181818] sm:text-7xl">
              Otto
            </h1>
            <p className="mt-6 max-w-[520px] text-lg leading-7 tracking-[-0.02em] text-[#4f4f4f]">
              Conecte ferramentas, organize datasets no warehouse e permita que ChatGPT e Claude consultem dados reais com permissoes claras.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/integracoes"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#181818] px-5 py-3 text-sm font-semibold text-white"
              >
                Abrir integracoes
                <ArrowRight size={18} strokeWidth={1.5} />
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dcdcdc] bg-white px-5 py-3 text-sm font-semibold text-[#181818]"
              >
                Criar conta
                <ArrowRight size={18} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="produto" className="border-b border-[#e8e8e8] bg-white px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#6a6a6a]">Produto</p>
            <h2 className="mt-4 max-w-[520px] text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#181818] sm:text-5xl">
              Um plano de controle para integracoes, warehouse e MCP.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {workflowSteps.map((step) => (
              <article key={step.title} className="rounded-[28px] border border-[#e5e5e5] bg-[#fbfbfb] p-5">
                <step.icon size={18} strokeWidth={1.5} className="text-[#181818]" />
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-[#181818]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6a6a6a]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="border-b border-[#e8e8e8] bg-[#f7f7f7] px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-[#dfdfdf] bg-white p-5">
            <div className="flex items-center justify-between border-b border-[#eeeeee] pb-4">
              <p className="text-sm font-semibold text-[#181818]">Pipeline do tenant</p>
              <LineChart size={18} strokeWidth={1.5} className="text-[#6a6a6a]" />
            </div>
            <div className="mt-5 grid gap-3">
              {['OAuth conectado', 'Dataset raw criado', 'Normalizer executado', 'MCP liberado para leitura'].map((item) => (
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
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#6a6a6a]">Workflow</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#181818] sm:text-5xl">
              Da conexao ao insight sem costurar sistemas manualmente.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#5f5f5f]">
              Otto observa conectores, provisiona datasets, normaliza dados e entrega uma interface MCP para agentes trabalharem em cima da operacao.
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
              Permissoes explicitas para agentes.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#5f5f5f]">
              Defina leitura, acoes permitidas e destino dos dados antes de liberar ferramentas para cada tenant.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {proofPoints.map((point) => (
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
