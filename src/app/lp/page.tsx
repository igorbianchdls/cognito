import type { Metadata } from 'next'
import { OttoLandingPage } from '@/assets/landingpages/otto/OttoLandingPage'

export const metadata: Metadata = {
  title: 'Otto | Dados operacionais para agentes',
  description: 'Conecte ferramentas, organize datasets no warehouse e use ChatGPT e Claude com permissoes claras.',
}

export default function LandingPage() {
  return <OttoLandingPage />
}
