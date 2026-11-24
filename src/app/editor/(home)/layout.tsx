import { MarketingShell } from '@/products/editor/frontend/shell/MarketingShell'

/** The Editor's home, in the Marketing section of the Otto menu (with the menu and the top bar). */
export default function EditorHomeLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>
}
