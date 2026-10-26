import type { Metadata } from 'next';
import JoineryApp from '@/assets/landingpages/marcenaria/JoineryApp';

export const metadata: Metadata = {
  title: 'Cerne | Marcenaria & Planejados',
  description: 'Projetos, produção, materiais e montagem de móveis planejados. Demonstração frontend.',
  robots: { index: false, follow: false },
};

export default function JoineryPage() {
  return <JoineryApp />;
}
