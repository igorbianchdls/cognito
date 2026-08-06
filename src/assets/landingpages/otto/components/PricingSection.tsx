import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Essencial',
    price: '69',
    description: 'Para organizar os primeiros processos da empresa.',
    features: [
      '1 usuário',
      'Clientes, fornecedores, produtos e serviços',
      'Vendas e compras',
      'Contas a pagar e contas a receber',
      'Consultas pelo ChatGPT e Claude',
      'Suporte por e-mail',
    ],
    featured: false,
  },
  {
    name: 'Gestão',
    price: '129',
    description: 'Para empresas que precisam de mais controle no dia a dia.',
    features: [
      'Até 3 usuários',
      'Tudo do plano Essencial',
      'Contas financeiras e centros de custo',
      'Baixas parciais, totais e estornos',
      'Preparação de operações por conversa',
      'Organização de documentos fiscais',
      'Suporte prioritário',
    ],
    featured: true,
  },
  {
    name: 'Pro',
    price: '199',
    description: 'Para operações com mais pessoas e rotinas financeiras.',
    features: [
      'Até 10 usuários',
      'Tudo do plano Gestão',
      'Histórico de alterações',
      'Permissões e contexto para a equipe',
      'Compras e pagamentos recorrentes',
      'Implantação guiada',
      'Atendimento prioritário',
    ],
    featured: false,
  },
]

export function PricingSection() {
  return (
    <section id="preco" className="scroll-mt-24 border-y border-[#e3e6e2] bg-[#f6f7f5] px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-[1180px]">
        <div className="mx-auto max-w-[660px] text-center">
          <p className="text-xs font-medium uppercase text-[#2f7441]">Planos</p>
          <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181818] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>
            Escolha o plano da sua empresa.
          </h2>
          <p className="mt-5 text-[15px] leading-7 text-[#646a64]">
            Use a Otto pela aplicação web, ChatGPT ou Claude e evolua conforme sua operação cresce. Todos os planos têm cobrança mensal.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex min-h-full flex-col rounded-lg border bg-white p-6 sm:p-7 ${
                plan.featured ? 'border-[#4b8d5b] shadow-[0_12px_36px_rgba(37,76,47,0.10)]' : 'border-[#dfe3de]'
              }`}
            >
              {plan.featured ? (
                <span className="absolute right-5 top-5 rounded-md bg-[#e7f3e9] px-2.5 py-1 text-[11px] font-medium text-[#2f7441]">
                  Recomendado
                </span>
              ) : null}

              <p className="text-sm font-semibold text-[#202420]">{plan.name}</p>
              <p className="mt-3 min-h-12 text-sm leading-6 text-[#6b716b]">{plan.description}</p>

              <div className="mt-6 flex items-end gap-1.5">
                <span className="pb-1 text-sm text-[#737973]">R$</span>
                <span className="text-[48px] font-medium leading-none text-[#181818]">{plan.price}</span>
                <span className="pb-1 text-sm text-[#737973]">/mês</span>
              </div>

              <div className="my-7 h-px bg-[#e7e9e6]" />

              <div className="grid flex-1 gap-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-[#454a45]">
                    <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#e2f2e5] text-[#28743d]">
                      <Check className="h-3 w-3" />
                    </span>
                    {feature}
                  </div>
                ))}
              </div>

              <Link
                href="/sign-up"
                className={`mt-8 inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors ${
                  plan.featured
                    ? 'bg-[#181818] text-white hover:bg-[#303030]'
                    : 'border border-[#ccd1cc] bg-white text-[#202420] hover:bg-[#f4f5f3]'
                }`}
              >
                Começar agora
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-[#777d77]">
          Planos mensais. Altere ou cancele conforme as necessidades da sua empresa.
        </p>
      </div>
    </section>
  )
}
