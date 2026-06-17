import type { Metadata } from 'next'
import { OttoLandingPageVariantA } from '@/assets/landingpages/otto/OttoLandingPageVariants'

export const metadata: Metadata = {
  title: 'Otto | Funcionarios de IA para PMEs',
  description: 'Crie funcionarios de IA conectados aos sistemas, documentos, bancos e planilhas da sua empresa.',
}

export default function LandingPageA() {
  return <OttoLandingPageVariantA />
}
