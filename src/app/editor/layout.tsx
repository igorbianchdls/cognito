import { Bebas_Neue, Caveat, DM_Serif_Display, Geist, Geist_Mono, Instrument_Sans, Newsreader } from 'next/font/google'
import { EditorSidebar } from '@/products/editor/frontend/shell/EditorSidebar'
import { EditorAccountSync } from '@/products/editor/frontend/shell/EditorAccountSync'
import s from '@/products/editor/frontend/shell/ui.module.css'
import '@/products/editor/frontend/shell/editor-base.css'

// The editor's type: a grotesque for the interface, an editorial serif for titles, and the fonts offered for video text.
const ui = Instrument_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-ui' })
const display = Newsreader({ subsets: ['latin', 'latin-ext'], style: ['normal', 'italic'], axes: ['opsz'], variable: '--font-display' })
const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-bebas' })
const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-dm-serif' })
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' })
const fonts = [ui, display, geist, geistMono, bebas, dmSerif, caveat].map(f => f.variable).join(' ')

export const metadata = { title: 'Editor · Otto' }

/** Editor product: video editor and Spaces, with their own menu and look. Not in the Otto menu yet. */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <div className={`otto-editor ${fonts}`}>
    <div className={s.shell}><EditorSidebar /><div className={s.main}>{children}</div></div>
    <EditorAccountSync />
  </div>
}
