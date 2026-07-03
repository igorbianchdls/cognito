import type { Metadata } from 'next'
import { OttoLandingPageVariantA } from '@/assets/landingpages/otto/OttoLandingPageVariants'

export const metadata: Metadata = {
  title: 'Otto | Funcionarios de IA para financeiro e operacao',
  description: 'Contrate funcionarios de IA que conectam sistemas, documentos, plataformas e planilhas para cuidar do financeiro e da operacao.',
}

export default function LandingPageA() {
  return <OttoLandingPageVariantA />
}
