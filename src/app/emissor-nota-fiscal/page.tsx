import type { Metadata } from 'next'

import { FiscalLandingPage } from '@/assets/landingpages/otto-fiscal/FiscalLandingPage'

export const metadata: Metadata = {
  title: 'Otto | Emita notas fiscais pelo ChatGPT ou Claude',
  description: 'Peça uma nota pelo ChatGPT ou Claude. A Otto encontra a venda, preenche os dados fiscais e prepara tudo para sua confirmação.',
}

export default function InvoiceIssuerLandingPage() {
  return <FiscalLandingPage />
}
