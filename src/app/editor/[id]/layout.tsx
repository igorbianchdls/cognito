import { EditorFullScreen } from '@/products/editor/frontend/shell/EditorFullScreen'

/** A project open in the editor: full screen, without the Otto menu or top bar. */
export default function EditorProjectLayout({ children }: { children: React.ReactNode }) {
  return <EditorFullScreen>{children}</EditorFullScreen>
}
