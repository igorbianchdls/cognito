// Loads the Explainer fonts for renders outside the app (Remotion CLI / download-root).
// Inside the app, next/font in /remotion-preview provides them; the family names match, so FONT works in both.
import { loadFont as loadBarlow } from '@remotion/google-fonts/BarlowCondensed'
import { loadFont as loadCaveat } from '@remotion/google-fonts/Caveat'
import { loadFont as loadSerif } from '@remotion/google-fonts/SourceSerif4'

export function loadExplainerFonts() {
  loadBarlow('normal', { weights: ['600', '700', '800'], subsets: ['latin', 'latin-ext'] })
  loadSerif('normal', { weights: ['400', '600', '700'], subsets: ['latin', 'latin-ext'] })
  loadSerif('italic', { weights: ['400'], subsets: ['latin', 'latin-ext'] })
  loadCaveat('normal', { weights: ['500', '700'], subsets: ['latin', 'latin-ext'] })
}
