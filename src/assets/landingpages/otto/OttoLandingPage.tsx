import { SiClaude, SiOpenai } from '@icons-pack/react-simple-icons'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronDown, LockKeyhole } from 'lucide-react'

import { AnimatedHeroPrompt } from '@/assets/landingpages/AnimatedHeroPrompt'
import { FinancialBenefitsSection } from '@/assets/landingpages/otto/components/FinancialBenefitsSection'
import { LandingHeader } from '@/assets/landingpages/otto/components/LandingHeader'
import { PricingSection } from '@/assets/landingpages/otto/components/PricingSection'
import { frequentlyAskedQuestions } from '@/assets/landingpages/otto/landingContent'
import { instrumentSerif, montserrat } from '@/assets/landingpages/otto/fonts'
import typography from '@/assets/landingpages/LandingTypography.module.css'

export function OttoLandingPage() {
  return (
    <main className={`${instrumentSerif.variable} ${montserrat.variable} ${typography.root} min-h-screen bg-white text-[#181818] [color-scheme:light]`}>
      <LandingHeader />

      <section className="overflow-hidden px-5 pt-16 pb-20 sm:px-8 sm:pt-24 sm:pb-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="mx-auto max-w-[1000px] text-center">
            <div className="inline-flex items-center gap-2 rounded-md border border-[#dce5dc] bg-[#f5faf6] px-3 py-2 text-xs font-medium text-[#326342]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3b9b54]" />
              ChatGPT e Claude conectados à gestão da sua empresa
            </div>
            <h1 className="mt-7 [--ui-title-font-size:40px] font-medium text-[#181818] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1 }}>
              Opere o financeiro da sua empresa pelo ChatGPT ou Claude.
            </h1>
            <p className="mx-auto mt-6 max-w-[760px] text-base text-[#5f655f] sm:text-lg" style={{ lineHeight: 1.5 }}>
              A Otto conecta o ChatGPT e o Claude ao financeiro da sua empresa. Você faz o pedido na conversa; a Otto encontra os dados, prepara a operação e registra o resultado.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/sign-up" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#181818] px-5 text-sm font-medium text-white transition-colors hover:bg-[#303030]">
                Começar com ChatGPT ou Claude
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#beneficios" className="inline-flex h-12 items-center justify-center rounded-md border border-[#d8dcd7] bg-white px-5 text-sm font-medium text-[#3c413c] transition-colors hover:bg-[#f5f6f4]">
                Ver como funciona
              </a>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-[#777d77]">
              <span className="inline-flex items-center gap-2"><SiOpenai aria-hidden="true" className="h-3.5 w-3.5" color="#111111" /> ChatGPT conectado</span>
              <span className="inline-flex items-center gap-2"><SiClaude aria-hidden="true" className="h-3.5 w-3.5" color="#D97757" /> Claude conectado</span>
              <span className="inline-flex items-center gap-2"><LockKeyhole className="h-3.5 w-3.5" /> Dados e permissões protegidos</span>
            </div>
            <AnimatedHeroPrompt />
          </div>
        </div>
      </section>

      <FinancialBenefitsSection />

      <PricingSection />

      <section id="duvidas" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[900px]">
          <div className="mx-auto max-w-[820px] text-center">
            <p className="text-xs font-medium uppercase text-[#317543]">Dúvidas frequentes</p>
            <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181818] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>
              O que você precisa saber antes de começar.
            </h2>
            <p className="mt-5 text-[15px] text-[#626862] sm:text-base" style={{ lineHeight: 1.5 }}>
              Respostas diretas sobre implantação, ChatGPT, Claude, segurança e uso do produto.
            </p>
          </div>
          <div className="mt-12 border-t border-[#dfe3df]">
            {frequentlyAskedQuestions.map((item) => (
              <details key={item.question} className="group border-b border-[#dfe3df]">
                <summary className="flex cursor-pointer list-none items-center gap-4 py-5 text-left text-[15px] font-medium text-[#292d29] marker:hidden">
                  {item.question}
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-[#858b85] transition-transform group-open:rotate-180" />
                </summary>
                <p className="max-w-[760px] pr-8 pb-6 text-sm leading-7 text-[#686e68]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e4e7e3] bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/lp" className="inline-flex items-center gap-2.5" aria-label="Otto">
            <Image src="/logoOttoIcon.svg" alt="" width={20} height={20} />
            <span className="text-lg font-medium text-[#181818]">Otto</span>
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-[#727872]">
            <a href="#beneficios" className="hover:text-[#181818]">Benefícios</a>
            <a href="#preco" className="hover:text-[#181818]">Preço</a>
            <a href="#duvidas" className="hover:text-[#181818]">Dúvidas</a>
            <Link href="/sign-in" className="hover:text-[#181818]">Entrar</Link>
          </div>
          <p className="text-xs text-[#8a908a]">© {new Date().getFullYear()} Otto.</p>
        </div>
      </footer>
    </main>
  )
}
