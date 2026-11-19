import { SocialSidebar } from '@/products/social/frontend/shell/SocialSidebar'
import { SocialAccountSync } from '@/products/social/frontend/shell/SocialAccountSync'
import { ottoFonts } from '@/products/editor/frontend/shell/fonts'
import s from '@/products/editor/frontend/shell/ui.module.css'
import '@/products/editor/frontend/shell/editor-base.css'

export const metadata = { title: 'Social · Otto' }

/** Social product: posting and scheduling, with the same look as the Editor it is built on. Not in the Otto menu yet. */
export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return <div className={`otto-editor ${ottoFonts}`}>
    <div className={s.shell}><SocialSidebar /><div className={s.main}>{children}</div></div>
    <SocialAccountSync />
  </div>
}
