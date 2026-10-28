import type { Metadata } from 'next';
import App from '@/assets/landingpages/oficina/TorqueApp';
export const metadata: Metadata = { title: 'Torque | Oficina & Centro Automotivo', description: 'Quadro de ordens de serviço, orçamentos, peças e entregas para oficinas. Demonstração frontend.', robots: { index: false, follow: false } };
export default function Page() { return <App />; }
