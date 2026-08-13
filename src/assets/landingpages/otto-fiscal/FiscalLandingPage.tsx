import { SiClaude, SiOpenai } from '@icons-pack/react-simple-icons'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CircleCheck, Mail } from 'lucide-react'

import { AnimatedHeroPrompt } from '@/assets/landingpages/AnimatedHeroPrompt'
import { instrumentSerif } from '@/assets/landingpages/otto/fonts'
import typography from '@/assets/landingpages/LandingTypography.module.css'
import { FiscalBenefitsSection } from '@/assets/landingpages/otto-fiscal/components/FiscalBenefitsSection'
import { FiscalLandingHeader } from '@/assets/landingpages/otto-fiscal/components/FiscalLandingHeader'
import { FiscalPricingSection } from '@/assets/landingpages/otto-fiscal/components/FiscalPricingSection'
import { fiscalFaq } from '@/assets/landingpages/otto-fiscal/fiscalLandingContent'

export function FiscalLandingPage() {
  return (
    <main className={`${instrumentSerif.variable} ${typography.root} min-h-screen bg-white text-[#181b19] [color-scheme:light]`}>
      <FiscalLandingHeader />

      <section className="overflow-hidden px-5 pt-14 pb-20 sm:px-8 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="mx-auto max-w-[1020px] text-center">
            <div className="inline-flex items-center gap-2 rounded-md border border-[#d8e6dc] bg-[#f2f8f4] px-3 py-2 text-xs font-medium text-[#17653a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3d9b5c]" />
              Emissão fiscal integrada ao ChatGPT e Claude
            </div>
            <h1 className="mt-7 [--ui-title-font-size:40px] font-medium text-[#181b19] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1 }}>
              Emita notas fiscais conversando com o ChatGPT ou Claude.
            </h1>
            <p className="mx-auto mt-6 max-w-[760px] text-base text-[#5e6760] sm:text-lg" style={{ lineHeight: 1.5 }}>
              Peça a nota como faria em uma conversa. A Otto encontra a venda, identifica o cliente, preenche os dados fiscais e deixa tudo pronto para sua confirmação.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/sign-up" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#17653a] px-5 text-sm font-medium text-white transition-colors hover:bg-[#11542f]">
                Começar a emitir <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#beneficios-fiscais" className="inline-flex h-12 items-center justify-center rounded-md border border-[#d5dbd6] bg-white px-5 text-sm font-medium text-[#303631] transition-colors hover:bg-[#f5f7f5]">
                Ver como funciona
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#747c76]">
              <span className="inline-flex items-center gap-2"><SiOpenai aria-hidden="true" className="h-3.5 w-3.5" color="#111111" />ChatGPT conectado</span>
              <span className="inline-flex items-center gap-2"><SiClaude aria-hidden="true" className="h-3.5 w-3.5" color="#D97757" />Claude conectado</span>
              <span className="inline-flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-[#2f8450]" />Confirmação antes da transmissão</span>
            </div>
            <AnimatedHeroPrompt variant="fiscal" />
          </div>
        </div>
      </section>

      <FiscalBenefitsSection />

      <FiscalPricingSection />

      <section id="duvidas" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-[1050px] gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="text-xs font-medium uppercase text-[#17653a]">Dúvidas</p>
            <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181b19] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>Antes de emitir pela conversa.</h2>
            <p className="mt-5 text-sm text-[#687069]" style={{ lineHeight: 1.5 }}>Veja como ChatGPT, Claude e Otto participam da operação e quais exigências dependem do documento e do município.</p>
          </div>
          <div className="border-t border-[#dfe4e0]">
            {fiscalFaq.map((item) => (
              <details key={item.question} className="group border-b border-[#dfe4e0] py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-sm font-semibold text-[#29302b]">
                  {item.question}<span className="text-lg font-normal text-[#778079] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-[700px] pr-8 pb-5 text-sm leading-6 text-[#69716b]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e3e7e4] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/emissor-nota-fiscal" className="inline-flex items-center gap-2.5" aria-label="Otto Nota Fiscal">
            <Image src="/logoOttoIcon.svg" alt="" width={21} height={21} />
            <span className="text-lg font-medium text-[#181b19]">Otto</span>
            <span className="border-l border-[#dfe3df] pl-2.5 text-xs text-[#747c76]">Nota fiscal</span>
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#727a74]">
            <a href="#beneficios-fiscais" className="hover:text-[#202521]">Benefícios</a>
            <a href="#planos" className="hover:text-[#202521]">Planos</a>
            <a href="#duvidas" className="hover:text-[#202521]">Dúvidas</a>
            <Link href="/sign-in" className="hover:text-[#202521]">Entrar</Link>
            <a href="mailto:comercial@otto.app.br" className="inline-flex items-center gap-1.5 hover:text-[#202521]"><Mail className="h-3.5 w-3.5" />Contato</a>
          </div>
          <p className="text-xs text-[#858c86]">© {new Date().getFullYear()} Otto</p>
        </div>
      </footer>
    </main>
  )
}
