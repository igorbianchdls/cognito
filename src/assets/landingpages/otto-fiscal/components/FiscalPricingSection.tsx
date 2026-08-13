'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Copy, HelpCircle, MessageCircle, RotateCcw } from 'lucide-react'

import styles from '@/assets/landingpages/otto-fiscal/components/FiscalPricingSection.module.css'

export type GrowthPricingPlan = {
  name: string
  monthlyPrice: number | null
  annualPrice: number | null
  annualTotal: string | null
  monthlyVolume: string
  annualVolume: string
  additional: string
  featured: boolean
  features: string[]
}

const fiscalPlans: GrowthPricingPlan[] = [
  {
    name: 'Essencial',
    monthlyPrice: 89,
    annualPrice: 74,
    annualTotal: '890',
    monthlyVolume: '150 notas /mês',
    annualVolume: '1.800 notas /ano',
    additional: 'R$ 0,62 por nota adicional',
    featured: false,
    features: [
      'Taxa de adesão grátis',
      '+ de 70 integrações',
      'Emissão de NF-e ou NFS-e',
      'ChatGPT e Claude conectados à Otto',
      'Cadastro de CNPJ automático',
      'Importação retroativa (máx. 500)',
      'Suporte via WhatsApp, chat e e-mail',
    ],
  },
  {
    name: 'Avançado',
    monthlyPrice: 189,
    annualPrice: 157,
    annualTotal: '1.890',
    monthlyVolume: '600 notas /mês',
    annualVolume: '7.200 notas /ano',
    additional: 'R$ 0,44 por nota adicional',
    featured: true,
    features: [
      'Taxa de adesão grátis',
      '+ de 70 integrações',
      'Emissão de NF-e e NFS-e',
      'Notas pelo ChatGPT ou Claude',
      'Cancelamento e eventos fiscais',
      'Fechamento mensal automático',
      'Cadastro de CNPJ automático',
      'Importação retroativa (máx. 1.000)',
      'Suporte prioritário',
    ],
  },
  {
    name: 'Profissional',
    monthlyPrice: 249,
    annualPrice: 207,
    annualTotal: '2.490',
    monthlyVolume: '2.000 notas /mês',
    annualVolume: '24.000 notas /ano',
    additional: 'R$ 0,35 por nota adicional',
    featured: false,
    features: [
      'Taxa de adesão grátis',
      '+ de 70 integrações',
      'Tudo do plano Avançado',
      'ChatGPT e Claude com permissões',
      'Múltiplos CNPJs',
      'Importação retroativa ilimitada',
      'Onboarding assistido',
      'Atendimento com especialista',
      'Apoio técnico para integração',
    ],
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    annualTotal: null,
    monthlyVolume: '+ de 2.000 notas /mês',
    annualVolume: '+ de 24 mil notas /ano',
    additional: 'Planos sob medida',
    featured: false,
    features: [
      'Taxa de adesão grátis',
      '+ de 70 integrações',
      'Tudo do plano Profissional',
      'Volume personalizado',
      'Múltiplos CNPJs e equipes',
      'Implantação acompanhada',
      'SLA e suporte dedicado',
      'Apoio técnico para integração',
    ],
  },
]

type GrowthPricingSectionProps = {
  id: string
  plans: GrowthPricingPlan[]
  subtitle: string
}

export function GrowthPricingSection({ id, plans, subtitle }: GrowthPricingSectionProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const annual = billing === 'annual'

  return (
    <section id={id} className={styles.section}>
      <div className={styles.container}>
        <div className={styles.headingGroup}>
          <h2 className={styles.heading}>Planos que <span>crescem com você</span></h2>
          <p>{subtitle}</p>
        </div>

        <div className={styles.billingRow}>
          <div className={styles.billingToggle} aria-label="Período de cobrança">
            <button type="button" className={!annual ? styles.activeToggle : undefined} onClick={() => setBilling('monthly')}>Mensal</button>
            <button type="button" className={annual ? styles.activeToggle : undefined} onClick={() => setBilling('annual')}>Anual</button>
          </div>
          <span className={styles.savings}>2 meses grátis</span>
        </div>

        <div className={styles.plansGrid}>
          {plans.map((plan) => {
            const price = annual ? plan.annualPrice : plan.monthlyPrice
            const volume = annual ? plan.annualVolume : plan.monthlyVolume

            return (
              <article className={`${styles.planCard} ${plan.featured ? styles.featuredCard : ''}`} key={plan.name}>
                {plan.featured ? <span className={styles.popularBadge}>Mais popular</span> : null}
                <p className={styles.planEyebrow}>PLANO</p>
                <h3>{plan.name}</h3>

                {price ? (
                  <>
                    <div className={styles.price}><span>R$</span><strong>{price}</strong><small>/mês</small></div>
                    <p className={styles.billingDetail}>{annual ? `R$ ${plan.annualTotal}/ano · cobrado anualmente` : 'cobrado mensalmente'}</p>
                  </>
                ) : (
                  <div className={styles.customPrice}><small>Valor</small><strong>Sob Consulta</strong></div>
                )}

                <div className={styles.volumeBlock}>
                  <strong>{volume}</strong>
                  <span>{plan.additional}</span>
                </div>

                {price ? (
                  <div className={styles.offerBox}>{annual ? '2 MESES GRÁTIS' : 'SEM FIDELIDADE'}<Copy aria-hidden="true" /></div>
                ) : null}

                <Link className={`${styles.cta} ${!price ? styles.enterpriseCta : ''}`} href="/sign-up">
                  {!price ? <MessageCircle aria-hidden="true" /> : null}
                  {!price ? 'Falar com especialista' : 'Começar'}
                  {price ? <span>→</span> : null}
                </Link>

                <p className={styles.refund}><RotateCcw aria-hidden="true" />7 dias para pedir reembolso</p>

                <div className={styles.features}>
                  {plan.features.map((feature, index) => (
                    <div key={feature}>
                      <Check aria-hidden="true" className={index === 0 ? styles.greenCheck : undefined} />
                      <span>{feature}</span>
                      {feature.includes('integrações') || feature.includes('CNPJ') || feature.includes('ChatGPT') ? <HelpCircle aria-hidden="true" /> : null}
                    </div>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function FiscalPricingSection() {
  return <GrowthPricingSection id="planos" plans={fiscalPlans} subtitle="Quanto mais emite, menos paga por nota." />
}
