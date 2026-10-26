import type { Metadata } from 'next';
import App from '@/assets/landingpages/assistencia/NexoApp';
export const metadata: Metadata = { title: 'Nexo | Assistência Técnica', description: 'Demonstração frontend de gestão empresarial.', robots: { index: false, follow: false } };
export default function Page() { return <App />; }
