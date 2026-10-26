import type { Metadata } from 'next';
import App from '@/assets/landingpages/roupas/AlmaApp';
export const metadata: Metadata = { title: 'Alma | Moda & Gestão', description: 'Demonstração frontend de gestão empresarial.', robots: { index: false, follow: false } };
export default function Page() { return <App />; }
