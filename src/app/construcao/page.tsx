import type { Metadata } from 'next';
import AlvoradaApp from '@/assets/landingpages/construcao/AlvoradaApp';

export const metadata: Metadata = {
  title: 'Alvorada | Construção e Reforma',
  description: 'Obras, orçamentos, fornecedores e financeiro de uma construtora. Demonstração frontend da Alvorada Construção e Reforma.',
  robots: { index: false, follow: false },
};

export default function ConstructionPage() {
  return <AlvoradaApp />;
}
