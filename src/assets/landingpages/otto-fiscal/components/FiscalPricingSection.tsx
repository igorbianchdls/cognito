import Link from 'next/link'
import { Check } from 'lucide-react'

const fiscalPlans = [
  {
    name: 'Inicial',
    price: '69',
    description: 'Para começar a emitir com organização e segurança.',
    features: ['1 CNPJ', 'Emissão de NF-e ou NFS-e', 'XML e documento auxiliar organizados', 'Acompanhamento de situação', 'Suporte por e-mail'],
    featured: false,
  },
  {
    name: 'Negócios',
    price: '129',
    description: 'Para quem emite com frequência e quer ganhar tempo.',
    features: ['1 CNPJ', 'Emissão de NF-e e NFS-e', 'Notas a partir de vendas', 'Cancelamento e eventos fiscais', 'Histórico completo', 'Suporte prioritário'],
    featured: true,
  },
  {
    name: 'Pro',
    price: '199',
    description: 'Para equipes e operações fiscais mais estruturadas.',
    features: ['Até 3 CNPJs', 'Tudo do plano Negócios', 'Acesso para a equipe', 'Configurações fiscais por empresa', 'Implantação guiada', 'Atendimento prioritário'],
    featured: false,
  },
]

export function FiscalPricingSection() {
  return (
    <section id="planos" className="scroll-mt-24 border-y border-[#e2e7e3] bg-[#f6f8f6] px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-[1180px]">
        <div className="mx-auto max-w-[650px] text-center">
          <p className="text-xs font-medium uppercase text-[#17653a]">Planos</p>
          <h2 className="mt-4 text-[42px] font-medium leading-[1.1] text-[#181b19] sm:text-[54px]">Emissão fiscal que cabe na empresa.</h2>
          <p className="mt-5 text-[15px] leading-7 text-[#646c66]">Escolha a estrutura adequada para sua rotina. Os planos têm cobrança mensal e podem acompanhar o crescimento da operação.</p>
        </div>

        <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-3">
          {fiscalPlans.map((plan) => (
            <article key={plan.name} className={`relative flex min-h-full flex-col rounded-lg border bg-white p-6 sm:p-7 ${plan.featured ? 'border-[#4d9563] shadow-[0_12px_36px_rgba(31,86,51,0.10)]' : 'border-[#dde3de]'}`}>
              {plan.featured ? <span className="absolute right-5 top-5 rounded-md bg-[#e6f2e9] px-2.5 py-1 text-[11px] font-medium text-[#17653a]">Mais escolhido</span> : null}
              <p className="text-sm font-semibold text-[#202521]">{plan.name}</p>
              <p className="mt-3 min-h-12 text-sm leading-6 text-[#69716b]">{plan.description}</p>
              <div className="mt-6 flex items-end gap-1.5">
                <span className="pb-1 text-sm text-[#747c76]">R$</span>
                <span className="text-[48px] font-medium leading-none text-[#181b19]">{plan.price}</span>
                <span className="pb-1 text-sm text-[#747c76]">/mês</span>
              </div>
              <div className="my-7 h-px bg-[#e6e9e6]" />
              <div className="grid flex-1 gap-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-[#454c47]">
                    <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#e2f2e6] text-[#287442]"><Check className="h-3 w-3" /></span>
                    {feature}
                  </div>
                ))}
              </div>
              <Link href="/sign-up" className={`mt-8 inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors ${plan.featured ? 'bg-[#17653a] text-white hover:bg-[#11542f]' : 'border border-[#ccd3cd] bg-white text-[#242a25] hover:bg-[#f3f5f3]'}`}>
                Começar a emitir
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
