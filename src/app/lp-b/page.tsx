import type { Metadata } from 'next'
import { OttoLandingPageVariantB } from '@/assets/landingpages/otto/OttoLandingPageVariants'

export const metadata: Metadata = {
  title: 'Otto | Central de inteligencia operacional',
  description: 'Centralize sistemas, documentos, bancos e planilhas para responder perguntas, criar relatorios e automatizar decisoes.',
}

export default function LandingPageB() {
  return <OttoLandingPageVariantB />
}
