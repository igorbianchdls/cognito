import type { Metadata } from 'next'
import { OttoLandingPage } from '@/assets/landingpages/otto/OttoLandingPage'

export const metadata: Metadata = {
  title: 'Otto | ERP financeiro para pequenas empresas',
  description: 'Organize vendas, compras, contas a pagar, contas a receber e documentos em um sistema simples e conectado.',
}

export default function LandingPage() {
  return <OttoLandingPage />
}
