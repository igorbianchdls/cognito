import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { AppHeader } from '@/components/navigation/AppHeader'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ottoFonts } from './fonts'
import s from './ui.module.css'
import './editor-base.css'

/**
 * The Marketing screens (Editor, Drive and Social) inside Otto: the same menu as the ERP on the left,
 * and the screens' own look (scoped to .otto-editor) on the right.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>
    <SidebarShadcn />
    <SidebarInset className="min-w-0">
      <AppHeader />
      <div className={`otto-editor ${ottoFonts}`}>
        <div className={s.main}>{children}</div>
      </div>
    </SidebarInset>
  </SidebarProvider>
}
