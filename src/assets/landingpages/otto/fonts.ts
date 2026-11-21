import localFont from 'next/font/local'
import type { CSSProperties } from 'react'

export const instrumentSerif = localFont({ src: [{ path: '../../../fonts/instrument-serif-400.woff2', weight: '400', style: 'normal' }], variable: '--font-instrument-serif', display: 'swap' })

export const montserrat = localFont({ src: [{ path: '../../../fonts/montserrat.woff2', weight: '100 900', style: 'normal' }], variable: '--font-montserrat', display: 'swap' })

export const sfPro = localFont({
  variable: '--font-sf-pro',
  src: [
    {
      path: '../../../../public/remotion/fonts/sf-pro/SF-Pro-Text-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../../public/remotion/fonts/sf-pro/SF-Pro-Text-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../../../public/remotion/fonts/sf-pro/SF-Pro-Text-Semibold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../../../public/remotion/fonts/sf-pro/SF-Pro-Text-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../../../public/remotion/fonts/sf-pro/SF-Pro-Display-Heavy.otf',
      weight: '800',
      style: 'normal',
    },
  ],
})

export const sfProLandingStyle: CSSProperties & Record<'--ui-font-family', string> = {
  '--ui-font-family': 'var(--font-sf-pro), -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  letterSpacing: '-0.02em',
}
