import { ottoFonts } from './fonts'
import './editor-base.css'

/**
 * The editor of a project fills the window: no Otto menu and no top bar of the app. The screens' own look (.otto-editor)
 * still applies; --app-header-h is 0 here, so the editor takes the whole height.
 */
export function EditorFullScreen({ children }: { children: React.ReactNode }) {
  return <div className={`otto-editor ${ottoFonts}`} style={{ '--app-header-h': '0px' } as React.CSSProperties}>{children}</div>
}
