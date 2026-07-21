import { staticFile } from 'remotion'

export const IOS_REMOTION_FONT_STACK = '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
export const IOS_REMOTION_DISPLAY_FONT_STACK = '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'

type FontDefinition = {
  family: 'SF Pro Text' | 'SF Pro Display'
  file: string
  style?: 'normal' | 'italic'
  weight: number
}

const SF_PRO_FONTS: FontDefinition[] = [
  { family: 'SF Pro Text', file: 'SF-Pro-Text-Regular.otf', weight: 400 },
  { family: 'SF Pro Text', file: 'SF-Pro-Text-Medium.otf', weight: 500 },
  { family: 'SF Pro Text', file: 'SF-Pro-Text-Semibold.otf', weight: 600 },
  { family: 'SF Pro Text', file: 'SF-Pro-Text-Bold.otf', weight: 700 },
  { family: 'SF Pro Display', file: 'SF-Pro-Display-Regular.otf', weight: 400 },
  { family: 'SF Pro Display', file: 'SF-Pro-Display-Semibold.otf', weight: 600 },
  { family: 'SF Pro Display', file: 'SF-Pro-Display-Bold.otf', weight: 700 },
  { family: 'SF Pro Display', file: 'SF-Pro-Display-Heavy.otf', weight: 800 },
]

let fontLoadPromise: Promise<void> | null = null

function withFontTimeout(promise: Promise<unknown>, timeoutMs = 3500) {
  return Promise.race([
    promise,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, timeoutMs)
    }),
  ])
}

export function loadSfProFonts() {
  if (fontLoadPromise || typeof document === 'undefined' || typeof FontFace === 'undefined') {
    return fontLoadPromise
  }

  fontLoadPromise = Promise.all(
    SF_PRO_FONTS.map(async (definition) => {
      const font = new FontFace(
        definition.family,
        `url("${staticFile(`remotion/fonts/sf-pro/${definition.file}`)}") format("opentype")`,
        {
          style: definition.style || 'normal',
          weight: String(definition.weight),
        },
      )
      document.fonts.add(font)
      await withFontTimeout(font.load())
    }),
  )
    .then(() => undefined)
    .catch(() => undefined)

  return fontLoadPromise
}
