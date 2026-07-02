import localFont from 'next/font/local'
import type { CSSProperties } from 'react'

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
