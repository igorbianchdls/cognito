import type { Metadata } from 'next'
import { OttoLandingPage } from '@/assets/landingpages/otto/OttoLandingPage'

export const metadata: Metadata = {
  title: 'Otto | Sistema de gestão integrado ao Claude e ChatGPT',
  description: 'Conecte vendas, compras, financeiro, clientes e documentos ao Claude e ChatGPT com dados organizados, permissões e histórico.',
}

export default function LandingPage() {
  return <OttoLandingPage />
}
