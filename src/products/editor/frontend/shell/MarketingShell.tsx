import { AppShell } from '@/products/plataforma/frontend/shell/AppShell'
import { ottoFonts } from './fonts'
import s from './ui.module.css'
import './editor-base.css'

/**
 * The Marketing screens (Editor, Drive and Social) inside Otto: the same menu as the ERP on the left,
 * and the screens' own look (scoped to .otto-editor) on the right.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return <AppShell>
    <div className={`otto-editor ${ottoFonts}`}>
      <div className={s.main}>{children}</div>
    </div>
  </AppShell>
}
