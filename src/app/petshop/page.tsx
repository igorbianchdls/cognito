import type { Metadata } from 'next';
import App from '@/assets/landingpages/petshop/PataApp';
export const metadata: Metadata = { title: 'Pata | Pet Shop', description: 'Atendimentos de banho e tosa, consultas, vacinas, pets, estoque e vendas de um pet shop. Demonstração frontend.', robots: { index: false, follow: false } };
export default function Page() { return <App />; }
