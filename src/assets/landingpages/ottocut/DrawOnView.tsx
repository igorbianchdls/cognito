'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './OttoCutLanding.module.css'

/** A word with a hand-drawn circle around it; the circle draws itself when the word scrolls into view. */
export function CircledWord({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect() } }, { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <span ref={ref} className={`${styles.circled} ${on ? styles.circledOn : ''}`}>
    {children}
    <svg viewBox="0 0 120 70" preserveAspectRatio="none" aria-hidden>
      <path d="M86 12 C 70 2, 28 4, 12 20 C -2 36, 14 60, 52 64 C 90 68, 116 52, 112 32 C 109 16, 84 6, 56 8" pathLength={1} />
    </svg>
  </span>
}
