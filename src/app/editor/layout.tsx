import { EditorAccountSync } from '@/products/editor/frontend/shell/EditorAccountSync'

export const metadata = { title: 'Editor · Otto' }

/** Editor product: the home (with the Otto menu) and the editor itself (full screen). */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<EditorAccountSync /></>
}
