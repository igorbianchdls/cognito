import type { Metadata } from 'next'

import { FiscalLandingPage } from '@/assets/landingpages/otto-fiscal/FiscalLandingPage'

export const metadata: Metadata = {
  title: 'Otto | Emissor de nota fiscal simples e conectado',
  description: 'Emita NF-e e NFS-e, acompanhe autorizações e mantenha XML e DANFE organizados em um só lugar.',
}

export default function InvoiceIssuerLandingPage() {
  return <FiscalLandingPage />
}
