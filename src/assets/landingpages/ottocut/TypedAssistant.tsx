'use client'

import { IconBrandOpenai } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import styles from './OttoCutLanding.module.css'

// The last words of the hero title: types "ChatGPT", holds, erases, swaps the icon and types "Claude", in a loop.
// Server render and reduced motion show "ChatGPT" fully typed.

const WORDS = [{ text: 'ChatGPT', icon: 'gpt' }, { text: 'Claude', icon: 'claude' }] as const
const LONGEST = WORDS.reduce((a, w) => (w.text.length > a.length ? w.text : a), '')
const TYPE_MS = 110, ERASE_MS = 60, HOLD_MS = 2200, GAP_MS = 350

function Icon({ kind }: { kind: (typeof WORDS)[number]['icon'] }) {
  return <span key={kind} className={styles.gptIcon} aria-hidden>
    {kind === 'gpt'
      ? <IconBrandOpenai size={42} stroke={1.7} />
      // eslint-disable-next-line @next/next/no-img-element
      : <img src="/claudeLogo.svg" alt="" className={styles.claudeMark} />}
  </span>
}

export function TypedAssistant() {
  const [word, setWord] = useState(0)
  const [len, setLen] = useState<number>(WORDS[0].text.length)
  const [phase, setPhase] = useState<'hold' | 'erase' | 'type'>('hold')

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const full = WORDS[word].text.length
    let t: ReturnType<typeof setTimeout>
    if (phase === 'hold') t = setTimeout(() => setPhase('erase'), HOLD_MS)
    else if (phase === 'erase') {
      if (len > 0) t = setTimeout(() => setLen(len - 1), ERASE_MS)
      else t = setTimeout(() => { setWord((word + 1) % WORDS.length); setPhase('type') }, GAP_MS)
    } else if (len < full) t = setTimeout(() => setLen(len + 1), TYPE_MS)
    else t = setTimeout(() => setPhase('hold'), 0)
    return () => clearTimeout(t)
  }, [word, len, phase])

  const current = WORDS[word]
  return <span className={styles.gptWord}>
    <span className={styles.srOnly}>ChatGPT ou Claude</span>
    <Icon kind={current.icon} />
    <span className={styles.typed} aria-hidden>
      <span className={styles.typedGhost}>{LONGEST}</span>
      <span className={styles.typedText}>{current.text.slice(0, len)}<i className={phase === 'hold' ? styles.caretBlink : styles.caret} /></span>
    </span>
  </span>
}
