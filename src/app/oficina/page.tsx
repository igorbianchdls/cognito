import type { Metadata } from 'next';
import App from '@/assets/landingpages/oficina/TorqueApp';
export const metadata: Metadata = { title: 'Torque | Gestão Automotiva', description: 'Demonstração frontend de gestão empresarial.', robots: { index: false, follow: false } };
export default function Page() { return <App />; }
