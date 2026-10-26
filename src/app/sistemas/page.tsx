import type { Metadata } from 'next';
import SystemsDirectory from '@/assets/landingpages/diretorio/SystemsDirectory';

export const metadata: Metadata = {
  title: 'Cognito | Diretório de sistemas',
  description: 'Escolha uma categoria para explorar os sistemas de eventos, obras, marcenaria, assistência técnica, moda e oficina.',
  robots: { index: false, follow: false },
};

export default function DirectoryPage() {
  return <SystemsDirectory />;
}
