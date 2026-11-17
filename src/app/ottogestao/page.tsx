import type { Metadata } from 'next'
import { OttoGestaoLanding } from '@/assets/landingpages/ottogestao/OttoGestaoLanding'

export const metadata: Metadata = {
  title: 'OttoGestão | O financeiro da sua empresa no automático, dentro do ChatGPT ou do Claude',
  description: 'ERP que junta vendas, compras e financeiro e automatiza a rotina: contas a pagar e a receber, conciliação, classificação de despesas e DRE, também pelo ChatGPT ou pelo Claude.',
  openGraph: {
    title: 'OttoGestão | O financeiro da sua empresa no automático',
    description: 'Contas a pagar e a receber, conciliação, classificação de despesas e DRE, pelo sistema ou conversando com o ChatGPT e o Claude.',
    images: ['/ottogestao/chatgpt-demo-poster.jpg'],
  },
}

export default function OttoGestaoPage() {
  return <OttoGestaoLanding />
}
