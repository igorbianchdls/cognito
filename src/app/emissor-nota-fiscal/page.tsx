import type { Metadata } from 'next'

import { FiscalLandingPage } from '@/assets/landingpages/otto-fiscal/FiscalLandingPage'

export const metadata: Metadata = {
  title: 'Otto | Emissão de nota fiscal integrada ao ChatGPT',
  description: 'Prepare notas a partir das vendas e consulte autorizações, rejeições, XML e DANFE pelo ChatGPT com a segurança da Otto.',
}

export default function InvoiceIssuerLandingPage() {
  return <FiscalLandingPage />
}
