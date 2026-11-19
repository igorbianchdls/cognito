import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { ottoFonts } from './fonts'
import s from './ui.module.css'
import './editor-base.css'

/**
 * The Marketing screens (Editor, Spaces and Social) inside Otto: the same menu as the ERP on the left,
 * and the screens' own look (scoped to .otto-editor) on the right.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>
    <SidebarShadcn />
    <SidebarInset className="min-w-0">
      <div className={`otto-editor ${ottoFonts}`}>
        <SidebarTrigger className="m-2 md:hidden" />
        <div className={s.main}>{children}</div>
      </div>
    </SidebarInset>
  </SidebarProvider>
}
