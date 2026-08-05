'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { useState } from 'react'

const plans = [
  { cadence: 'Mensal', price: 'R$ 997', note: 'Cobrança mensal, sem compromisso longo.' },
  { cadence: 'Trimestral', price: 'R$ 897', note: 'Valor mensal no plano trimestral.' },
  { cadence: 'Anual', price: 'R$ 797', note: 'Valor mensal no plano anual.' },
]

const features = [
  'Cadastros, vendas, compras e financeiro',
  'Contas a pagar e contas a receber',
  'Importação e organização de documentos fiscais',
  'Histórico de alterações e isolamento por empresa',
  'Implantação guiada para configurar a operação',
]

export function PricingSection() {
  const [cadence, setCadence] = useState('Trimestral')
  const plan = plans.find((item) => item.cadence === cadence) ?? plans[1]

  return (
    <section id="preco" className="scroll-mt-24 border-y border-[#e3e6e2] bg-[#f6f7f5] px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-[1080px]">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="text-xs font-medium uppercase text-[#2f7441]">Preço</p>
            <h2 className="mt-4 text-[36px] font-medium leading-[1.16] text-[#181818] sm:text-[44px]">Comece com a operação essencial.</h2>
            <p className="mt-5 max-w-[430px] text-[15px] leading-7 text-[#646a64]">Escolha o ciclo que faz sentido para a empresa. A implantação inicial ajuda a organizar cadastros e rotinas.</p>

            <div className="mt-8 inline-grid grid-cols-3 rounded-md border border-[#d9ddd8] bg-white p-1">
              {plans.map((item) => (
                <button key={item.cadence} type="button" onClick={() => setCadence(item.cadence)} className={`h-9 rounded px-3 text-xs font-medium transition-colors sm:px-4 ${item.cadence === cadence ? 'bg-[#181818] text-white' : 'text-[#686e68] hover:bg-[#f3f4f2]'}`}>
                  {item.cadence}
                </button>
              ))}
            </div>
          </div>

          <div className="border-l-0 border-[#d9ddd8] lg:border-l lg:pl-16">
            <p className="text-sm font-medium text-[#626862]">Plano Otto ERP</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-[48px] font-medium leading-none text-[#181818] sm:text-[56px]">{plan.price}</span>
              <span className="pb-1.5 text-sm text-[#747a74]">por mês</span>
            </div>
            <p className="mt-3 text-sm text-[#747a74]">{plan.note}</p>

            <div className="mt-8 grid gap-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-[#454a45]">
                  <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#e2f2e5] text-[#28743d]"><Check className="h-3 w-3" /></span>
                  {feature}
                </div>
              ))}
            </div>

            <Link href="/sign-up" className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-[#181818] px-5 text-sm font-medium text-white transition-colors hover:bg-[#303030]">
              Começar agora
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
