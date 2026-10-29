import type { Metadata } from 'next';
import EsteticaApp from '@/assets/landingpages/estetica/EsteticaApp';

export const metadata: Metadata = {
  title: 'Lumière | Estética Avançada',
  description: 'Agenda, clientes, procedimentos, produtos e financeiro de uma clínica de estética. Demonstração frontend da Lumière Estética Avançada.',
  robots: { index: false, follow: false },
};

export default function AestheticsPage() {
  return <EsteticaApp />;
}
