import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, CircleCheck, Landmark, ReceiptText, ShoppingBag } from 'lucide-react'

type AuthLayoutProps = {
  children: ReactNode
  mode: 'onboarding' | 'sign-in' | 'sign-up'
}

const cashFlowBars = [38, 52, 44, 64, 58, 74, 68, 86, 78, 94, 82, 100]

function OttoBrand() {
  return (
    <Link href="/" aria-label="Ir para a página inicial da Otto" className="inline-flex items-center gap-2.5 text-[#181818]">
      <Image src="/logoOttoIcon.svg" alt="" width={22} height={22} priority className="h-[22px] w-[22px]" />
      <span className="text-[21px] font-medium leading-none tracking-normal">Otto</span>
    </Link>
  )
}

function OperationsPreview() {
  return (
    <div className="mt-9 overflow-hidden rounded-lg border border-black/10 bg-[#181818] text-white shadow-[0_30px_70px_-38px_rgba(24,24,24,0.75)]">
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-5">
        <div>
          <p className="text-[13px] font-medium text-white">Visão geral</p>
          <p className="mt-0.5 text-[11px] text-white/50">Movimento financeiro</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/65">
          <span className="h-1.5 w-1.5 rounded-full bg-[#52d273]" />
          Atualizado agora
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-white/10">
        <div className="border-r border-white/10 p-5">
          <div className="flex items-center gap-2 text-[11px] text-white/55">
            <ArrowUpRight className="h-3.5 w-3.5 text-[#52d273]" />
            A receber
          </div>
          <p className="mt-2 text-[22px] font-medium tracking-normal">R$ 42.580</p>
          <p className="mt-1 text-[11px] text-[#74de90]">12 títulos em aberto</p>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 text-[11px] text-white/55">
            <ArrowDownRight className="h-3.5 w-3.5 text-[#f6c96f]" />
            A pagar
          </div>
          <p className="mt-2 text-[22px] font-medium tracking-normal">R$ 18.230</p>
          <p className="mt-1 text-[11px] text-[#f6c96f]">7 títulos nos próximos dias</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_148px]">
        <div className="border-r border-white/10 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-white/70">Fluxo de caixa</p>
            <p className="text-[10px] text-white/40">Últimos 12 meses</p>
          </div>
          <div className="mt-5 flex h-[82px] items-end gap-2" aria-hidden="true">
            {cashFlowBars.map((height, index) => (
              <span
                key={`${height}-${index}`}
                className="min-w-0 flex-1 rounded-t-[2px] bg-white/15"
                style={{ height: `${height}%`, backgroundColor: index >= 8 ? '#52d273' : undefined }}
              />
            ))}
          </div>
        </div>
        <div className="grid content-center gap-4 p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10"><ShoppingBag className="h-4 w-4 text-[#81d4fa]" /></span>
            <div><p className="text-[11px] text-white/45">Vendas</p><p className="text-xs font-medium">24 este mês</p></div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10"><ReceiptText className="h-4 w-4 text-[#f6c96f]" /></span>
            <div><p className="text-[11px] text-white/45">Cobranças</p><p className="text-xs font-medium">93% em dia</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthLayout({ children, mode }: AuthLayoutProps) {
  const isSignUp = mode === 'sign-up'
  const isOnboarding = mode === 'onboarding'

  return (
    <main className="min-h-dvh bg-white text-[#181818]">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(430px,44%)_1fr]">
        <aside className="relative hidden overflow-hidden border-r border-black/5 bg-[#eef2ec] p-10 lg:flex lg:min-h-dvh lg:flex-col xl:p-14">
          <OttoBrand />

          <div className="my-auto w-full max-w-[570px] py-10">
            <div className="flex items-center gap-2 text-xs font-medium text-[#4e6253]">
              <CircleCheck className="h-4 w-4 text-[#2d8a48]" />
              Gestão simples para negócios reais
            </div>
            <h1 className="mt-5 max-w-[520px] text-[40px] font-medium leading-[1.12] tracking-normal text-[#181818] xl:text-[46px]">
              Sua empresa organizada em um só lugar.
            </h1>
            <p className="mt-5 max-w-[480px] text-[15px] leading-7 text-[#58615a]">
              Vendas, compras, financeiro e documentos trabalhando juntos para você decidir com clareza.
            </p>
            <OperationsPreview />
          </div>

          <div className="flex items-center gap-2 text-xs text-[#677168]">
            <Landmark className="h-4 w-4" />
            Feito para a rotina das pequenas empresas brasileiras.
          </div>
        </aside>

        <section className="flex min-h-dvh flex-col bg-white px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
          <div className="flex items-center justify-between lg:justify-end">
            <div className="lg:hidden"><OttoBrand /></div>
            {isOnboarding ? (
              <p className="text-sm text-[#777]">Configuração inicial</p>
            ) : (
              <p className="text-sm text-[#666]">
                {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
                <Link
                  href={isSignUp ? '/sign-in' : '/sign-up'}
                  className="font-medium text-[#181818] underline decoration-[#b9b9b9] underline-offset-4 transition-colors hover:decoration-[#181818]"
                >
                  {isSignUp ? 'Entrar' : 'Criar conta'}
                </Link>
              </p>
            )}
          </div>

          <div className="flex flex-1 items-center justify-center py-12 sm:py-16">
            <div className="w-full max-w-[400px]">{children}</div>
          </div>

          <div className="flex items-center justify-center text-center text-[11px] text-[#858585] lg:justify-end">
            © {new Date().getFullYear()} Otto. Gestão empresarial simples e segura.
          </div>
        </section>
      </div>
    </main>
  )
}
