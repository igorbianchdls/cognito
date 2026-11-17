import { Bricolage_Grotesque } from 'next/font/google'
import styles from './OttoLogo.module.css'

// The Otto mark for the landing pages: a white tile tilted over a violet one, with a heavy "O", and the "otto"
// wordmark beside it.

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], weight: ['800'] })

export function OttoLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return <span className={`${styles.logo} ${size === 'sm' ? styles.sm : ''} ${bricolage.className}`} aria-label="Otto">
    <span className={styles.mark} aria-hidden>
      <span className={styles.back} />
      <span className={styles.front}>O</span>
    </span>
    <span className={styles.word}>otto</span>
  </span>
}
