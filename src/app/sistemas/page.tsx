import type { Metadata } from 'next';
import SystemsDirectory from '@/assets/landingpages/diretorio/SystemsDirectory';

export const metadata: Metadata = {
  title: 'Cognito | Diretório de sistemas',
  description: 'Explore onze sistemas para eventos, obras, marcenaria, assistência, moda, oficina, beleza, pets, imóveis, cursos e limpeza.',
  robots: { index: false, follow: false },
};

export default function DirectoryPage() {
  return <SystemsDirectory />;
}
