import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Building2,
  ChevronDown,
  FileCheck2,
  FileText,
  Landmark,
  LockKeyhole,
  MessageSquareText,
  PackageCheck,
  ReceiptText,
  RefreshCw,
} from 'lucide-react'

import { LandingHeader } from '@/assets/landingpages/otto/components/LandingHeader'
import { FinancialBenefitsSection } from '@/assets/landingpages/otto/components/FinancialBenefitsSection'
import { PricingSection } from '@/assets/landingpages/otto/components/PricingSection'
import { frequentlyAskedQuestions } from '@/assets/landingpages/otto/landingContent'
import BlingIcon from '@/components/icons/BlingIcon'
import ContaAzulIcon from '@/components/icons/ContaAzulIcon'
import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon'
import MetaIcon from '@/components/icons/MetaIcon'
import OmieIcon from '@/components/icons/OmieIcon'
import ShopifyIcon from '@/components/icons/ShopifyIcon'
import { AnimatedHeroPrompt } from '@/assets/landingpages/AnimatedHeroPrompt'

const integrations = [
  { icon: ContaAzulIcon, label: 'Conta Azul' },
  { icon: OmieIcon, label: 'Omie' },
  { icon: BlingIcon, label: 'Bling' },
  { icon: ShopifyIcon, label: 'Shopify' },
  { icon: GoogleAdsIcon, label: 'Google Ads' },
  { icon: MetaIcon, label: 'Meta Ads' },
]

const outcomes = [
  {
    icon: MessageSquareText,
    title: 'Pergunte sobre a empresa',
    description: 'Consulte saldos, vencimentos, vendas e compras pelo ChatGPT ou Claude usando os dados reais da Otto.',
  },
  {
    icon: RefreshCw,
    title: 'Prepare operações por conversa',
    description: 'Transforme pedidos em cadastros, vendas e rotinas financeiras prontas para revisão.',
  },
  {
    icon: BadgeCheck,
    title: 'Confirme antes de executar',
    description: 'Ações importantes respeitam as permissões da equipe e permanecem registradas no sistema.',
  },
]

const operationSteps = [
  {
    number: '01',
    icon: Building2,
    title: 'Organize os dados na Otto',
    description: 'Clientes, vendas, compras, financeiro e documentos ficam reunidos em uma base confiável.',
  },
  {
    number: '02',
    icon: MessageSquareText,
    title: 'Converse no ChatGPT ou Claude',
    description: 'Consulte a empresa e prepare rotinas usando apenas o contexto que você tem permissão para acessar.',
  },
  {
    number: '03',
    icon: BadgeCheck,
    title: 'Revise e acompanhe na Otto',
    description: 'Confirme ações sensíveis e preserve responsáveis, alterações e resultados no sistema de gestão.',
  },
]

const assistantActions = [
  { icon: ReceiptText, label: 'Contas a receber', value: 'R$ 42.580 em aberto' },
  { icon: Landmark, label: 'Saldo financeiro', value: 'R$ 86.420 disponível' },
  { icon: PackageCheck, label: 'Compras recentes', value: '11 confirmadas no mês' },
]

function SectionHeading({ eyebrow, title, description, align = 'left' }: { eyebrow: string; title: string; description: string; align?: 'center' | 'left' }) {
  const centered = align === 'center'
  return (
    <div className={centered ? 'mx-auto max-w-[820px] text-center' : 'max-w-[720px]'}>
      <p className="text-xs font-medium uppercase text-[#317543]">{eyebrow}</p>
      <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181818] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>{title}</h2>
      <p className="mt-5 text-[15px] text-[#626862] sm:text-base" style={{ lineHeight: 1.5 }}>{description}</p>
    </div>
  )
}

export function OttoLandingPage() {
  return (
    <main className="min-h-screen bg-white text-[#181818] [color-scheme:light]">
      <LandingHeader />

      <section className="overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-[1180px]">
          <div className="mx-auto max-w-[1000px] text-center">
            <div className="inline-flex items-center gap-2 rounded-md border border-[#dce5dc] bg-[#f5faf6] px-3 py-2 text-xs font-medium text-[#326342]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3b9b54]" />
              Gestão empresarial conectada ao ChatGPT e Claude
            </div>
            <h1 className="mt-7 [--ui-title-font-size:40px] font-medium text-[#181818] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1 }}>
              Sistema de Gestão 100% integrado ao Claude e ChatGPT.
            </h1>
            <p className="mx-auto mt-6 max-w-[760px] text-base text-[#5f655f] sm:text-lg" style={{ lineHeight: 1.5 }}>
              Consulte vendas, compras, financeiro, clientes e documentos por conversa. A Otto conecta os assistentes que você já usa aos dados reais da sua empresa, com permissões e histórico.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/sign-up" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#181818] px-5 text-sm font-medium text-white transition-colors hover:bg-[#303030]">
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#assistente" className="inline-flex h-12 items-center justify-center rounded-md border border-[#d8dcd7] bg-white px-5 text-sm font-medium text-[#3c413c] transition-colors hover:bg-[#f5f6f4]">
                Ver como funciona
              </a>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-[#777d77]">
              <span className="inline-flex items-center gap-2"><MessageSquareText className="h-3.5 w-3.5" /> ChatGPT</span>
              <span className="inline-flex items-center gap-2"><Bot className="h-3.5 w-3.5" /> Claude</span>
              <span className="inline-flex items-center gap-2"><LockKeyhole className="h-3.5 w-3.5" /> Dados e permissões protegidos</span>
            </div>
            <AnimatedHeroPrompt />
          </div>

        </div>
      </section>

      <FinancialBenefitsSection />

      <section id="integracoes" className="scroll-mt-24 border-y border-[#e4e7e3] bg-[#f7f8f6] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[330px]">
              <p className="text-sm font-medium text-[#303530]">ChatGPT e Claude na frente. A Otto como base.</p>
              <p className="mt-1 text-xs leading-5 text-[#747a74]">Reúna as fontes da empresa e use os assistentes com contexto, controle e dados confiáveis.</p>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#dde1dc] bg-[#dde1dc] sm:grid-cols-3 lg:max-w-[700px] lg:grid-cols-6">
              {integrations.map((integration) => {
                const Icon = integration.icon
                return (
                  <div key={integration.label} className="flex h-[74px] items-center justify-center gap-2 bg-white px-3 text-xs font-medium text-[#555b55]">
                    <Icon className="h-5 w-5" />
                    <span className="truncate">{integration.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1180px]">
          <SectionHeading
            align="center"
            eyebrow="Gestão por conversa"
            title="Peça, consulte e acompanhe sem procurar em várias telas."
            description="ChatGPT e Claude se tornam portas de entrada para a empresa, enquanto a Otto mantém cada informação organizada e rastreável."
          />

          <div className="mt-14 grid border-y border-[#e2e5e1] md:grid-cols-3">
            {outcomes.map((outcome, index) => {
              const Icon = outcome.icon
              return (
                <div key={outcome.title} className={`py-8 md:px-8 md:py-10 ${index > 0 ? 'border-t border-[#e2e5e1] md:border-l md:border-t-0' : ''}`}>
                  <Icon className="h-5 w-5 text-[#347848]" />
                  <h3 className="mt-5 text-lg font-medium text-[#202320]">{outcome.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#6a706a]">{outcome.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e4e7e3] bg-[#f6f7f5] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1180px]">
          <SectionHeading
            eyebrow="Como funciona"
            title="Da conversa ao registro, com controle."
            description="A integração aproxima a gestão da rotina da equipe sem abrir mão de revisão, permissões e histórico."
          />

          <div className="mt-14 grid gap-0 border-t border-[#dfe3de] lg:grid-cols-3">
            {operationSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.number} className={`relative py-8 lg:px-8 lg:py-10 ${index > 0 ? 'border-t border-[#dfe3de] lg:border-l lg:border-t-0' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#909590]">{step.number}</span>
                    <Icon className="h-5 w-5 text-[#347848]" />
                  </div>
                  <h3 className="mt-8 text-xl font-medium text-[#202320]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#686e68]">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="assistente" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="ChatGPT + Claude + Otto"
              title="Converse com a sua empresa, não apenas com um chatbot."
              description="A Otto fornece aos assistentes o contexto autorizado da empresa para responder com base em clientes, vendas, compras e informações financeiras reais."
            />
            <div className="mt-8 grid gap-4 text-sm text-[#4f554f]">
              <div className="flex items-start gap-3"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#317543]" /> Consulte saldos, vencimentos, vendas e compras.</div>
              <div className="flex items-start gap-3"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#317543]" /> Prepare operações e revise antes de confirmar.</div>
              <div className="flex items-start gap-3"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#317543]" /> Continue qualquer rotina pela aplicação web.</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#dfe3df] bg-white shadow-[0_24px_70px_-48px_rgba(30,50,34,0.42)]">
            <div className="flex h-14 items-center border-b border-[#e5e8e4] bg-[#fbfcfb] px-4">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-[#e8f3ea] text-[#2f7441]"><Bot className="h-4 w-4" /></span>
              <div className="ml-3"><p className="text-xs font-medium text-[#292d29]">Otto no ChatGPT e Claude</p><p className="mt-0.5 text-[10px] text-[#858b85]">Conectado aos dados autorizados</p></div>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-[#5e775f]"><span className="h-1.5 w-1.5 rounded-full bg-[#52a668]" /> Disponível</span>
            </div>
            <div className="bg-[#f8f9f7] p-4 sm:p-6">
              <div className="ml-auto max-w-[82%] rounded-lg bg-[#e9ece8] px-4 py-3 text-sm leading-6 text-[#333833]">
                Como está o financeiro desta semana?
              </div>
              <div className="mt-5 max-w-[92%]">
                <div className="flex items-center gap-2 text-xs font-medium text-[#303530]"><MessageSquareText className="h-4 w-4 text-[#347848]" /> Resumo financeiro</div>
                <p className="mt-3 text-sm leading-6 text-[#5e645e]">Você tem saldo positivo e quatro vencimentos importantes nos próximos sete dias.</p>
                <div className="mt-4 divide-y divide-[#e2e5e1] rounded-lg border border-[#dfe3df] bg-white px-4">
                  {assistantActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <div key={action.label} className="flex items-center gap-3 py-3.5">
                        <Icon className="h-4 w-4 text-[#347848]" />
                        <div className="min-w-0"><p className="truncate text-xs font-medium text-[#303530]">{action.label}</p><p className="mt-0.5 truncate text-[11px] text-[#7b817b]">{action.value}</p></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="flex h-14 items-center gap-3 border-t border-[#e5e8e4] px-4 text-xs text-[#929792]">
              Pergunte sobre sua empresa
              <span className="ml-auto grid h-8 w-8 place-items-center rounded-md bg-[#181818] text-white"><ArrowRight className="h-3.5 w-3.5" /></span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e7e2d7] bg-[#fbf8f1] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-[1180px] gap-8 md:grid-cols-[0.75fr_1.25fr] md:items-center">
          <div className="flex items-center gap-3 text-[#805d1f]">
            <FileText className="h-5 w-5" />
            <span className="text-xs font-medium uppercase">Fiscal e documentos</span>
          </div>
          <div>
            <h2 className="[--ui-title-font-size:40px] font-medium text-[#28251f] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>Documentos organizados hoje. Emissão fiscal preparada para evoluir.</h2>
            <p className="mt-4 max-w-[700px] text-[15px] text-[#70695c]" style={{ lineHeight: 1.5 }}>A Otto já importa e valida XMLs de compras, vincula documentos a fornecedores e mantém os totais fiscais. A emissão por API será adicionada em uma próxima etapa.</p>
          </div>
        </div>
      </section>

      <PricingSection />

      <section id="duvidas" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[900px]">
          <SectionHeading
            align="center"
            eyebrow="Dúvidas frequentes"
            title="O que você precisa saber antes de começar."
            description="Respostas diretas sobre implantação, integrações, segurança e uso do produto."
          />
          <div className="mt-12 border-t border-[#dfe3df]">
            {frequentlyAskedQuestions.map((item) => (
              <details key={item.question} className="group border-b border-[#dfe3df]">
                <summary className="flex cursor-pointer list-none items-center gap-4 py-5 text-left text-[15px] font-medium text-[#292d29] marker:hidden">
                  {item.question}
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-[#858b85] transition-transform group-open:rotate-180" />
                </summary>
                <p className="max-w-[760px] pb-6 pr-8 text-sm leading-7 text-[#686e68]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-10 sm:px-8 sm:pb-14">
        <div className="mx-auto max-w-[1180px] rounded-lg border border-[#d6e5d7] bg-[#edf7ef] px-6 py-14 text-center sm:px-10 sm:py-16">
          <h2 className="mx-auto max-w-[900px] [--ui-title-font-size:40px] font-medium text-[#18301e] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>Leve sua empresa para o ChatGPT e o Claude.</h2>
          <p className="mx-auto mt-5 max-w-[640px] text-[15px] text-[#526856]" style={{ lineHeight: 1.5 }}>Centralize a gestão na Otto e use os assistentes para consultar informações e preparar rotinas com muito menos atrito.</p>
          <Link href="/sign-up" className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#181818] px-5 text-sm font-medium text-white hover:bg-[#303030]">
            Criar minha conta
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#e4e7e3] bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/lp" className="inline-flex items-center gap-2.5" aria-label="Otto">
            <Image src="/logoOttoIcon.svg" alt="" width={20} height={20} />
            <span className="text-lg font-medium text-[#181818]">Otto</span>
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-[#727872]">
            <a href="#produto" className="hover:text-[#181818]">Produto</a>
            <a href="#integracoes" className="hover:text-[#181818]">Integrações</a>
            <a href="#preco" className="hover:text-[#181818]">Preço</a>
            <Link href="/sign-in" className="hover:text-[#181818]">Entrar</Link>
          </div>
          <p className="text-xs text-[#8a908a]">© {new Date().getFullYear()} Otto.</p>
        </div>
      </footer>
    </main>
  )
}
