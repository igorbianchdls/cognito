import { Instrument_Sans, Newsreader } from 'next/font/google'

// The access screens' type: an editorial serif for titles and a clean grotesque for the rest.
const display = Newsreader({ subsets: ['latin', 'latin-ext'], style: ['normal', 'italic'], axes: ['opsz'], variable: '--font-auth-display' })
const ui = Instrument_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-auth-ui' })

/** Class names that define --font-auth-display and --font-auth-ui; put them on the layout root. */
export const authFonts = `${display.variable} ${ui.variable}`
