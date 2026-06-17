import type { Metadata } from 'next'
import { OttoLandingPage } from '@/assets/landingpages/otto/OttoLandingPage'

export const metadata: Metadata = {
  title: 'Otto | Camada de inteligencia para PMEs',
  description: 'Conecte sistemas, documentos, bancos e planilhas para criar funcionarios de IA que automatizam tarefas, analisam dados e geram relatorios.',
}

export default function LandingPage() {
  return <OttoLandingPage />
}
