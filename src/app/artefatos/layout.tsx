import { AppShell } from '@/products/plataforma/frontend/shell/AppShell'
import { NotasApp } from '@/products/notas/frontend/NotasApp'

/** Artefatos: a galeria dos artefatos (páginas em HTML criadas pelo Claude ou pelo ChatGPT), sem a barra das Notas. */
export default function ArtefatosLayout({ children }: { children: React.ReactNode }) {
  return <AppShell defaultOpen={false}><NotasApp semBarraLateral>{children}</NotasApp></AppShell>
}
