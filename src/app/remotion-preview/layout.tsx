import '@/assets/remotion/result-preview/styles.css'

// Fonts of the Explainer components (condensed headlines, a serif for documents and quotes, handwriting for notes),
// loaded by the browser from Google Fonts. Not through next/font: its build-time download failed a production build.
// The family names match FONT in src/assets/remotion/explainer/theme.tsx; CLI renders load them via explainer/fonts.ts.
const EXPLAINER_FONTS = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Caveat:wght@500;700&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&display=swap'

export default function RemotionPreviewLayout({ children }: { children: React.ReactNode }) {
  return <>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link rel="stylesheet" href={EXPLAINER_FONTS} precedence="default" />
    {children}
  </>
}
