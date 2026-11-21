import localFont from 'next/font/local'

// The access screens' type: an editorial serif for titles and a clean grotesque for the rest.
const display = localFont({ src: [{ path: '../../../../fonts/newsreader.woff2', weight: '200 800', style: 'normal' }, { path: '../../../../fonts/newsreader-italic.woff2', weight: '200 800', style: 'italic' }], variable: '--font-auth-display', display: 'swap' })
const ui = localFont({ src: [{ path: '../../../../fonts/instrument-sans.woff2', weight: '400 700', style: 'normal' }], variable: '--font-auth-ui', display: 'swap' })

/** Class names that define --font-auth-display and --font-auth-ui; put them on the layout root. */
export const authFonts = `${display.variable} ${ui.variable}`
