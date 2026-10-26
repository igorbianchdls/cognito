import type { Metadata } from 'next';
import ConstructionApp from '@/assets/landingpages/obras/ConstructionApp';

export const metadata: Metadata = {
  title: 'Átio | Obras & Reformas',
  description: 'Gestão de obras, reformas, equipes, compras e resultados. Demonstração frontend.',
  robots: { index: false, follow: false },
};

export default function ConstructionPage() {
  return <ConstructionApp />;
}
