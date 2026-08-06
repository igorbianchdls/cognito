import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleCheck,
  Clock3,
  FileCheck2,
  FileText,
  KeyRound,
  Link2,
  LockKeyhole,
  Mail,
  MessageSquareText,
  ReceiptText,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { FiscalLandingHeader } from '@/assets/landingpages/otto-fiscal/components/FiscalLandingHeader'
import { FiscalPricingSection } from '@/assets/landingpages/otto-fiscal/components/FiscalPricingSection'
import { InvoiceShowcase } from '@/assets/landingpages/otto-fiscal/components/InvoiceShowcase'
import { fiscalFaq } from '@/assets/landingpages/otto-fiscal/fiscalLandingContent'

const benefits = [
  {
    icon: MessageSquareText,
    title: 'Prepare pelo ChatGPT',
    description: 'Peça uma nota a partir da venda e deixe a Otto reunir cliente, itens, valores e dados fiscais para revisão.',
  },
  {
    icon: Clock3,
    title: 'Consulte a situação por conversa',
    description: 'Encontre rascunhos, notas autorizadas e documentos que exigem correção sem navegar por várias telas.',
  },
  {
    icon: FileCheck2,
    title: 'Encontre XML e DANFE',
    description: 'Localize documentos fiscais pelo ChatGPT enquanto a Otto preserva arquivos, eventos e histórico.',
  },
  {
    icon: Link2,
    title: 'Venda conectada à nota',
    description: 'Transforme uma venda em documento fiscal sem redigitar dados e confirme antes de transmitir.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Peça pelo ChatGPT',
    description: 'Informe a venda ou descreva o documento fiscal que deseja preparar.',
  },
  {
    number: '02',
    title: 'A Otto prepara a nota',
    description: 'Cliente, itens, natureza da operação e configurações fiscais são reunidos para revisão.',
  },
  {
    number: '03',
    title: 'Revise, envie e acompanhe',
    description: 'Confirme os dados antes da transmissão e consulte depois a autorização, o XML e o documento auxiliar.',
  },
]

const securityPoints = [
  { icon: KeyRound, title: 'Certificado protegido', description: 'Credenciais fiscais tratadas com acesso restrito e uso controlado.' },
  { icon: LockKeyhole, title: 'Dados separados por empresa', description: 'Documentos, configurações e operações permanecem isolados por organização.' },
  { icon: ShieldCheck, title: 'Histórico auditável', description: 'Emissões e eventos fiscais preservam situação, datas e responsável pela ação.' },
]

export function FiscalLandingPage() {
  return (
    <main className="min-h-screen bg-white text-[#181b19] [color-scheme:light]">
      <FiscalLandingHeader />

      <section className="overflow-hidden px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="mx-auto max-w-[1020px] text-center">
            <div className="inline-flex items-center gap-2 rounded-md border border-[#d8e6dc] bg-[#f2f8f4] px-3 py-2 text-xs font-medium text-[#17653a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3d9b5c]" />
              Emissão fiscal integrada ao ChatGPT
            </div>
            <h1 className="mt-7 [--ui-title-font-size:52px] font-medium text-[#181b19] sm:[--ui-title-font-size:72px] lg:[--ui-title-font-size:88px]" style={{ lineHeight: 1 }}>
              Sistema de Emissão de Nota Fiscal 100% integrado ao ChatGPT.
            </h1>
            <p className="mx-auto mt-6 max-w-[760px] text-base leading-7 text-[#5e6760] sm:text-lg sm:leading-8">
              Prepare notas a partir das vendas, consulte documentos e acompanhe autorizações e rejeições por conversa. A Otto mantém os dados fiscais, as permissões e o histórico organizados.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/sign-up" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#17653a] px-5 text-sm font-medium text-white transition-colors hover:bg-[#11542f]">
                Começar a emitir <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#chatgpt" className="inline-flex h-12 items-center justify-center rounded-md border border-[#d5dbd6] bg-white px-5 text-sm font-medium text-[#303631] transition-colors hover:bg-[#f5f7f5]">
                Ver a integração
              </a>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#747c76]">
              <span className="inline-flex items-center gap-1.5"><MessageSquareText className="h-3.5 w-3.5 text-[#2f8450]" />ChatGPT conectado</span>
              <span className="inline-flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-[#2f8450]" />Revisão antes do envio</span>
              <span className="inline-flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-[#2f8450]" />Histórico fiscal preservado</span>
            </div>
          </div>

          <div className="mt-12 sm:mt-16">
            <InvoiceShowcase />
          </div>
        </div>
      </section>

      <section aria-label="Recursos fiscais" className="border-y border-[#e4e8e5] bg-[#f8faf8] px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-[1050px] flex-wrap items-center justify-center gap-x-9 gap-y-3 text-xs font-medium text-[#69716b]">
          <span className="inline-flex items-center gap-2"><ReceiptText className="h-4 w-4 text-[#397b50]" />NF-e</span>
          <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-[#397b50]" />NFS-e</span>
          <span className="inline-flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-[#397b50]" />XML e DANFE</span>
          <span className="inline-flex items-center gap-2"><RefreshCw className="h-4 w-4 text-[#397b50]" />Eventos fiscais</span>
          <span className="inline-flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-[#397b50]" />ChatGPT integrado</span>
        </div>
      </section>

      <section id="chatgpt" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-[1100px] gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-xs font-medium uppercase text-[#17653a]">ChatGPT + Otto</p>
            <h2 className="mt-4 [--ui-title-font-size:46px] font-medium text-[#181b19] sm:[--ui-title-font-size:64px]" style={{ lineHeight: 1.06 }}>Prepare uma nota com uma conversa.</h2>
            <p className="mt-5 text-[15px] leading-7 text-[#646c66]">O ChatGPT vira a interface. A Otto encontra a venda, reúne os dados fiscais autorizados e devolve o documento pronto para você revisar.</p>
            <div className="mt-7 grid gap-3 text-sm text-[#4f5751]">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#2f8450]" />Dados preenchidos a partir da venda</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#2f8450]" />Pendências apontadas antes do envio</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#2f8450]" />Transmissão sujeita à sua confirmação</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#dfe4e0] bg-white shadow-[0_24px_70px_-48px_rgba(25,70,42,0.42)]">
            <div className="flex h-14 items-center border-b border-[#e3e7e4] bg-[#fafcfb] px-4">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-[#e5f2e9] text-[#17653a]"><MessageSquareText className="h-4 w-4" /></span>
              <div className="ml-3"><p className="text-xs font-semibold text-[#252b27]">Otto no ChatGPT</p><p className="mt-0.5 text-[10px] text-[#818982]">Conectado à operação fiscal</p></div>
              <span className="ml-auto text-[10px] font-medium text-[#397b50]">Dados autorizados</span>
            </div>
            <div className="bg-[#f7f9f7] p-5 sm:p-6">
              <div className="ml-auto max-w-[82%] rounded-lg bg-[#e8ece9] px-4 py-3 text-sm leading-6 text-[#333a35]">Prepare a nota fiscal da venda 317.</div>
              <div className="mt-5 max-w-[94%]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2f3631]"><Sparkles className="h-4 w-4 text-[#247244]" />Nota preparada para revisão</div>
                <p className="mt-3 text-sm leading-6 text-[#5e675f]">Localizei a venda, o cliente e os itens. Antes de transmitir, confirme a natureza da operação e os dados tributários.</p>
                <div className="mt-4 grid gap-px overflow-hidden rounded-md border border-[#dfe4e0] bg-[#dfe4e0] sm:grid-cols-3">
                  <div className="bg-white p-3"><p className="text-[10px] text-[#858c86]">Venda</p><p className="mt-1 text-xs font-medium text-[#303631]">317</p></div>
                  <div className="bg-white p-3"><p className="text-[10px] text-[#858c86]">Cliente</p><p className="mt-1 truncate text-xs font-medium text-[#303631]">Bruna Schmitz</p></div>
                  <div className="bg-white p-3"><p className="text-[10px] text-[#858c86]">Total</p><p className="mt-1 text-xs font-medium text-[#303631]">R$ 375,00</p></div>
                </div>
                <button type="button" className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-[#17653a] px-4 text-xs font-medium text-white">Revisar nota <ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="scroll-mt-24 border-t border-[#e3e7e4] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-xs font-medium uppercase text-[#17653a]">Emissão assistida</p>
              <h2 className="mt-4 [--ui-title-font-size:46px] font-medium text-[#181b19] sm:[--ui-title-font-size:64px]" style={{ lineHeight: 1.06 }}>Da conversa ao documento autorizado.</h2>
              <p className="mt-5 max-w-[460px] text-[15px] leading-7 text-[#636c65]">
                Use o ChatGPT para iniciar e consultar a rotina. Use a Otto para revisar, confirmar e manter cada documento fiscal sob controle.
              </p>
              <Link href="/sign-up" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[#17653a] hover:text-[#104e2d]">
                Conhecer o emissor <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
              {benefits.map((benefit) => {
                const Icon = benefit.icon
                return (
                  <article key={benefit.title} className="border-t border-[#dfe4e0] py-6">
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-[#e8f3eb] text-[#17653a]"><Icon className="h-4.5 w-4.5" /></div>
                    <h3 className="mt-4 text-base font-semibold text-[#232824]">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#687069]">{benefit.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-24 border-y border-[#e3e7e4] bg-[#f6f8f6] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[640px]">
            <p className="text-xs font-medium uppercase text-[#17653a]">Como funciona</p>
            <h2 className="mt-4 [--ui-title-font-size:46px] font-medium text-[#181b19] sm:[--ui-title-font-size:64px]" style={{ lineHeight: 1.06 }}>Do pedido no ChatGPT à emissão.</h2>
            <p className="mt-5 text-[15px] leading-7 text-[#646c66]">A conversa acelera o preenchimento, enquanto a Otto mantém revisão, transmissão e histórico no fluxo correto.</p>
          </div>

          <div className="mt-12 grid gap-0 border-y border-[#dce2dd] lg:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.number} className={`py-7 lg:px-8 ${index > 0 ? 'border-t border-[#dce2dd] lg:border-l lg:border-t-0' : ''}`}>
                <span className="text-xs font-semibold text-[#2f8450]">{step.number}</span>
                <h3 className="mt-5 text-lg font-semibold text-[#222723]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#687069]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-[1100px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-xs font-medium uppercase text-[#a0582f]">Pendências fiscais</p>
            <h2 className="mt-4 [--ui-title-font-size:46px] font-medium text-[#181b19] sm:[--ui-title-font-size:64px]" style={{ lineHeight: 1.06 }}>Entenda uma rejeição sem decifrar códigos fiscais.</h2>
            <p className="mt-5 text-[15px] leading-7 text-[#646c66]">Consulte a pendência pelo ChatGPT e receba uma explicação clara com base na resposta fiscal preservada pela Otto.</p>
            <div className="mt-7 grid gap-3 text-sm text-[#4f5751]">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#2f8450]" />Motivo da rejeição preservado no histórico</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#2f8450]" />Nova tentativa sem duplicar o documento</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#2f8450]" />Situação atualizada após cada resposta</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#e1ddd7] bg-white shadow-[0_18px_50px_rgba(62,51,38,0.08)]">
            <div className="flex items-center justify-between border-b border-[#e8e4df] px-5 py-4">
              <div><p className="text-xs font-semibold text-[#262b27]">NF-e 000185</p><p className="mt-1 text-[10px] text-[#7d847e]">Tentativa realizada hoje, 11:24</p></div>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#faece8] px-2.5 py-1.5 text-[10px] font-medium text-[#a04736]"><AlertTriangle className="h-3 w-3" />Rejeitada</span>
            </div>
            <div className="p-5 sm:p-6">
              <div className="rounded-md border border-[#edcfbf] bg-[#fff8f4] p-4">
                <p className="text-xs font-semibold text-[#8f432f]">Código 539 · Duplicidade de NF-e</p>
                <p className="mt-2 text-xs leading-5 text-[#725f56]">Já existe uma nota com a mesma identificação fiscal. Confira a numeração e a chave retornada antes de reenviar.</p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-[#e2e6e3] p-3"><p className="text-[10px] text-[#828983]">Série</p><p className="mt-1 text-xs font-medium text-[#343a35]">1</p></div>
                <div className="rounded-md border border-[#e2e6e3] p-3"><p className="text-[10px] text-[#828983]">Número</p><p className="mt-1 text-xs font-medium text-[#343a35]">000185</p></div>
              </div>
              <button type="button" className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-[#17653a] px-4 text-xs font-medium text-white"><RefreshCw className="h-3.5 w-3.5" />Revisar documento</button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#dfe5e0] bg-[#f3f8f4] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20">
            <div>
              <p className="text-xs font-medium uppercase text-[#17653a]">Venda conectada</p>
              <h2 className="mt-4 [--ui-title-font-size:44px] font-medium text-[#181b19] sm:[--ui-title-font-size:60px]" style={{ lineHeight: 1.06 }}>Peça pelo ChatGPT. Revise na Otto.</h2>
              <p className="mt-5 text-[15px] leading-7 text-[#626b64]">Cliente, itens, quantidades e valores seguem da venda para a conversa e chegam organizados à revisão fiscal.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { icon: Building2, label: 'Venda aprovada' },
                { icon: FileText, label: 'Revisão fiscal' },
                { icon: Send, label: 'Transmissão' },
                { icon: BadgeCheck, label: 'Nota autorizada' },
              ].map((item, index) => {
                const Icon = item.icon
                return <div key={item.label} className="relative border-t border-[#cfd9d1] pt-4"><span className="text-[10px] font-medium text-[#7a837c]">0{index + 1}</span><Icon className="mt-4 h-5 w-5 text-[#247244]" /><p className="mt-3 text-xs font-medium text-[#333a35]">{item.label}</p></div>
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[620px]">
            <p className="text-xs font-medium uppercase text-[#17653a]">Segurança operacional</p>
            <h2 className="mt-4 [--ui-title-font-size:46px] font-medium text-[#181b19] sm:[--ui-title-font-size:64px]" style={{ lineHeight: 1.06 }}>Controle para uma rotina fiscal séria.</h2>
          </div>
          <div className="mt-12 grid gap-0 border-y border-[#dfe4e0] md:grid-cols-3">
            {securityPoints.map((point, index) => {
              const Icon = point.icon
              return <article key={point.title} className={`py-7 md:px-8 ${index > 0 ? 'border-t border-[#dfe4e0] md:border-l md:border-t-0' : ''}`}><Icon className="h-5 w-5 text-[#247244]" /><h3 className="mt-5 text-base font-semibold text-[#242a25]">{point.title}</h3><p className="mt-2 text-sm leading-6 text-[#687069]">{point.description}</p></article>
            })}
          </div>
        </div>
      </section>

      <FiscalPricingSection />

      <section id="duvidas" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-[1050px] gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="text-xs font-medium uppercase text-[#17653a]">Dúvidas</p>
            <h2 className="mt-4 [--ui-title-font-size:44px] font-medium text-[#181b19] sm:[--ui-title-font-size:60px]" style={{ lineHeight: 1.06 }}>Antes da primeira emissão.</h2>
            <p className="mt-5 text-sm leading-7 text-[#687069]">Algumas exigências variam por documento, município e configuração fiscal da empresa.</p>
          </div>
          <div className="border-t border-[#dfe4e0]">
            {fiscalFaq.map((item) => (
              <details key={item.question} className="group border-b border-[#dfe4e0] py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-sm font-semibold text-[#29302b]">
                  {item.question}<span className="text-lg font-normal text-[#778079] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-[700px] pb-5 pr-8 text-sm leading-6 text-[#69716b]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#dce6de] bg-[#eaf4ec] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto flex max-w-[980px] flex-col items-start justify-between gap-7 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-medium uppercase text-[#17653a]">Sua próxima nota</p>
            <h2 className="mt-3 max-w-[900px] [--ui-title-font-size:44px] font-medium text-[#18231b] sm:[--ui-title-font-size:60px]" style={{ lineHeight: 1.06 }}>Leve sua emissão fiscal para o ChatGPT.</h2>
          </div>
          <Link href="/sign-up" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-[#17653a] px-5 text-sm font-medium text-white hover:bg-[#11542f]">Começar a emitir <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <footer className="px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/emissor-nota-fiscal" className="inline-flex items-center gap-2.5" aria-label="Otto Nota Fiscal">
            <Image src="/logoOttoIcon.svg" alt="" width={21} height={21} />
            <span className="text-lg font-medium text-[#181b19]">Otto</span>
            <span className="border-l border-[#dfe3df] pl-2.5 text-xs text-[#747c76]">Nota fiscal</span>
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#727a74]">
            <Link href="/sign-in" className="hover:text-[#202521]">Entrar</Link>
            <a href="#planos" className="hover:text-[#202521]">Planos</a>
            <a href="mailto:comercial@otto.app.br" className="inline-flex items-center gap-1.5 hover:text-[#202521]"><Mail className="h-3.5 w-3.5" />Contato</a>
          </div>
          <p className="text-xs text-[#858c86]">© {new Date().getFullYear()} Otto</p>
        </div>
      </footer>
    </main>
  )
}
