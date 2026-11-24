import localFont from 'next/font/local'

// The type of the Marketing screens (Editor, Drive and posts): one sans serif for the whole interface,
// and the fonts offered for video text.
const ui = localFont({ src: [{ path: '../../../../fonts/instrument-sans.woff2', weight: '400 700', style: 'normal' }], variable: '--font-ui', display: 'swap' })
const geist = localFont({ src: [{ path: '../../../../fonts/geist.woff2', weight: '100 900', style: 'normal' }], variable: '--font-geist-sans', display: 'swap' })
const geistMono = localFont({ src: [{ path: '../../../../fonts/geist-mono.woff2', weight: '100 900', style: 'normal' }], variable: '--font-geist-mono', display: 'swap' })
const bebas = localFont({ src: [{ path: '../../../../fonts/bebas-neue-400.woff2', weight: '400', style: 'normal' }], variable: '--font-bebas', display: 'swap' })
const dmSerif = localFont({ src: [{ path: '../../../../fonts/dm-serif-display-400.woff2', weight: '400', style: 'normal' }], variable: '--font-dm-serif', display: 'swap' })
const caveat = localFont({ src: [{ path: '../../../../fonts/caveat.woff2', weight: '400 700', style: 'normal' }], variable: '--font-caveat', display: 'swap' })

/** Class names that define the font variables; put them on the .otto-editor wrapper. */
export const ottoFonts = [ui, geist, geistMono, bebas, dmSerif, caveat].map(f => f.variable).join(' ')
