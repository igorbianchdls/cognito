import localFont from 'next/font/local'
import styles from './OttoLogo.module.css'

// The Otto mark for the landing pages: a white tile tilted over a violet one, with a heavy "O", and the "otto"
// wordmark beside it.

const bricolage = localFont({ src: [{ path: '../../../fonts/bricolage-grotesque.woff2', weight: '200 800', style: 'normal' }], display: 'swap' })

export function OttoLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return <span className={`${styles.logo} ${size === 'sm' ? styles.sm : ''} ${bricolage.className}`} aria-label="Otto">
    <span className={styles.mark} aria-hidden>
      <span className={styles.back} />
      <span className={styles.front}>O</span>
    </span>
    <span className={styles.word}>otto</span>
  </span>
}
