import { AppShell } from '@/products/plataforma/frontend/shell/AppShell'
import { NotasApp } from '@/products/notas/frontend/NotasApp'

/** Notas: páginas e (nas próximas etapas) bases de dados, no estilo do Notion. O menu do Otto começa recolhido. */
export default function NotasLayout({ children }: { children: React.ReactNode }) {
  return <AppShell defaultOpen={false}><NotasApp>{children}</NotasApp></AppShell>
}
