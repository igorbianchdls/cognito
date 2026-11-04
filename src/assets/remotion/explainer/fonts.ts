// Loads the Explainer fonts for renders outside the app (Remotion CLI / download-root).
// Inside the app, next/font in /remotion-preview provides them; the family names match, so FONT works in both.
import { loadFont as loadBarlow } from '@remotion/google-fonts/BarlowCondensed'
import { loadFont as loadCaveat } from '@remotion/google-fonts/Caveat'
import { loadFont as loadSerif } from '@remotion/google-fonts/SourceSerif4'
import { loadFont as loadAnton } from '@remotion/google-fonts/Anton'
import { loadFont as loadFranklin } from '@remotion/google-fonts/LibreFranklin'
import { loadFont as loadPlayfair } from '@remotion/google-fonts/PlayfairDisplay'
import { loadFont as loadGothic } from '@remotion/google-fonts/UnifrakturMaguntia'

export function loadExplainerFonts() {
  loadBarlow('normal', { weights: ['600', '700', '800'], subsets: ['latin', 'latin-ext'] })
  loadSerif('normal', { weights: ['400', '600', '700'], subsets: ['latin', 'latin-ext'] })
  loadSerif('italic', { weights: ['400'], subsets: ['latin', 'latin-ext'] })
  loadCaveat('normal', { weights: ['500', '700'], subsets: ['latin', 'latin-ext'] })
  loadGothic('normal', { weights: ['400'], subsets: ['latin'] })
  loadPlayfair('normal', { weights: ['700', '900'], subsets: ['latin', 'latin-ext'] })
  loadPlayfair('italic', { weights: ['700'], subsets: ['latin', 'latin-ext'] })
  loadAnton('normal', { weights: ['400'], subsets: ['latin', 'latin-ext'] })
  loadFranklin('normal', { weights: ['500', '800'], subsets: ['latin', 'latin-ext'] })
}
