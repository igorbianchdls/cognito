import type { Metadata } from 'next'
import { OttoLandingPage } from '@/assets/landingpages/otto/OttoLandingPage'

export const metadata: Metadata = {
  title: 'Otto | Opere sua empresa pelo ChatGPT ou Claude',
  description: 'Conecte o ChatGPT e o Claude ao financeiro, às vendas, às compras e aos documentos da sua empresa com a gestão segura da Otto.',
}

export default function LandingPage() {
  return <OttoLandingPage />
}
