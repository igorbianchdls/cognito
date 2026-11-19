import { EditorSidebar } from '@/products/editor/frontend/shell/EditorSidebar'
import { EditorAccountSync } from '@/products/editor/frontend/shell/EditorAccountSync'
import { ottoFonts } from '@/products/editor/frontend/shell/fonts'
import s from '@/products/editor/frontend/shell/ui.module.css'
import '@/products/editor/frontend/shell/editor-base.css'

export const metadata = { title: 'Editor · Otto' }

/** Editor product: video editor and Spaces, with their own menu and look. Not in the Otto menu yet. */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <div className={`otto-editor ${ottoFonts}`}>
    <div className={s.shell}><EditorSidebar /><div className={s.main}>{children}</div></div>
    <EditorAccountSync />
  </div>
}
