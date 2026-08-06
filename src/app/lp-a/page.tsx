import type { Metadata } from 'next'
import { OttoLandingPageVariantA } from '@/assets/landingpages/otto/OttoLandingPageVariants'

export const metadata: Metadata = {
  title: 'Otto | Sistema de gestão integrado ao Claude e ChatGPT',
  description: 'Conecte os dados reais da empresa ao Claude e ChatGPT para consultar informações, preparar operações e acompanhar o financeiro.',
}

export default function LandingPageA() {
  return <OttoLandingPageVariantA />
}
