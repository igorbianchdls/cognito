'use client'

import { useEffect, useRef } from 'react'

/** The real player (public/videohosting.js) for a public code, as a page would show it. `version` remounts it. */
export function PlayerPreview({ code, version }: { code: string; version: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const box = ref.current
    if (!box) return
    box.innerHTML = ''
    const s = document.createElement('script')
    s.src = '/videohosting.js'
    s.async = true
    s.dataset.video = code
    s.dataset.api = window.location.origin
    box.appendChild(s)
    return () => { box.innerHTML = '' }
  }, [code, version])
  return <div ref={ref} className="w-full" />
}

export const embedCode = (origin: string, code: string) => `<script async src="${origin}/videohosting.js" data-video="${code}"></script>`
