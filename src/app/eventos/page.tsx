import type { Metadata } from 'next';
import EventsApp from '@/assets/landingpages/eventos/EventsApp';

export const metadata: Metadata = {
  title: 'Vélia | Casamentos & Eventos',
  description: 'Planejamento, fornecedores, convidados e financeiro de casamentos e eventos. Demonstração frontend da Vélia Eventos.',
  robots: { index: false, follow: false },
};

export default function EventsPage() {
  return <EventsApp />;
}
