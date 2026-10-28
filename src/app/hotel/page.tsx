import type { Metadata } from 'next';
import App from '@/assets/landingpages/hotel/HotelApp';
export const metadata: Metadata = { title: 'Lumen | Hotel & Pousada', description: 'Reservas, hóspedes, quartos, governança e financeiro de um hotel. Demonstração frontend.', robots: { index: false, follow: false } };
export default function Page() { return <App />; }
