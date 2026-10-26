import type { Metadata } from 'next';
import EventsApp from '@/assets/landingpages/eventos/EventsApp';

export const metadata: Metadata = {
  title: 'Lumière Eventos | Gestão de casamentos',
  description: 'Planejamento, produção e gestão de casamentos. Demonstração frontend da Lumière Eventos.',
  robots: { index: false, follow: false },
};

export default function EventsPage() {
  return <EventsApp />;
}
