import { Bebas_Neue, Caveat, DM_Serif_Display, Geist, Geist_Mono, Instrument_Sans, Newsreader } from 'next/font/google'

// The type of the Editor and Social screens: a grotesque for the interface, an editorial serif for titles,
// and the fonts offered for video text.
const ui = Instrument_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-ui' })
const display = Newsreader({ subsets: ['latin', 'latin-ext'], style: ['normal', 'italic'], axes: ['opsz'], variable: '--font-display' })
const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-bebas' })
const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-dm-serif' })
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' })

/** Class names that define the font variables; put them on the .otto-editor wrapper. */
export const ottoFonts = [ui, display, geist, geistMono, bebas, dmSerif, caveat].map(f => f.variable).join(' ')
