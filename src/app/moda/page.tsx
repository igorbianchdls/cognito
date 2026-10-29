import type { Metadata } from 'next';
import LumiereApp from '@/assets/landingpages/moda/LumiereApp';

export const metadata: Metadata = {
  title: 'Lumière | Moda Feminina',
  description: 'Produtos, clientes, estoque, marketing e financeiro de uma loja de moda feminina. Demonstração frontend da Lumière.',
  robots: { index: false, follow: false },
};

export default function FashionPage() {
  return <LumiereApp />;
}
