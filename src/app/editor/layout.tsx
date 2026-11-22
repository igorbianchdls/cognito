import { MarketingShell } from '@/products/editor/frontend/shell/MarketingShell'
import { EditorAccountSync } from '@/products/editor/frontend/shell/EditorAccountSync'

export const metadata = { title: 'Editor · Otto' }

/** Editor product: video editor, in the Marketing section of the Otto menu. */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}<EditorAccountSync /></MarketingShell>
}
