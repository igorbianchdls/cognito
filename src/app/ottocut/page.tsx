import type { Metadata } from 'next'
import { OttoCutLanding } from '@/assets/landingpages/ottocut/OttoCutLanding'

export const metadata: Metadata = {
  title: 'OttoCut | Crie e edite seus Reels dentro do ChatGPT ou do Claude',
  description: 'O OttoCut transforma o seu ChatGPT ou Claude num editor de vídeo: mande a gravação, peça em português e receba o Reel cortado, legendado, com zoom e música.',
  openGraph: {
    title: 'OttoCut | Crie e edite seus Reels dentro do ChatGPT ou do Claude',
    description: 'Mande a gravação, peça em português e receba o Reel pronto, dentro do seu ChatGPT ou Claude.',
    images: ['/ottocut/chat-demo-poster.jpg'],
  },
}

export default function OttoCutPage() {
  return <OttoCutLanding />
}
