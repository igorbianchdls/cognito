import type { Metadata } from 'next';
import ConstructionApp from '@/assets/landingpages/obras/ConstructionApp';

export const metadata: Metadata = {
  title: 'Átio | Construtora & Incorporadora',
  description: 'Obras em kanban, cronograma, orçamento, compras, estoque e equipe de uma construtora. Demonstração frontend.',
  robots: { index: false, follow: false },
};

export default function ConstructionPage() {
  return <ConstructionApp />;
}
