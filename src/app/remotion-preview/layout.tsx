import { Barlow_Condensed, Caveat, Source_Serif_4 } from 'next/font/google'
import '@/assets/remotion/result-preview/styles.css'

// Fonts of the Explainer components: condensed headlines, a serif for documents and quotes, and handwriting for notes.
const head = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-explainer-head' })
const serif = Source_Serif_4({ subsets: ['latin'], weight: ['400', '600', '700'], style: ['normal', 'italic'], variable: '--font-explainer-serif' })
const hand = Caveat({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-explainer-hand' })

export default function RemotionPreviewLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${head.variable} ${serif.variable} ${hand.variable}`} style={{ display: 'contents' }}>{children}</div>
}
