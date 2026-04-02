'use client'

import type { CSSProperties, ReactNode } from 'react'

export function ArtifactPreviewStage({
  zoom,
  children,
  outerClassName = 'mx-auto flex min-h-full items-start justify-center p-0',
  scaledStyle,
  contentClassName = 'overflow-hidden rounded-none bg-white p-0 shadow-[0_2px_6px_rgba(15,23,42,0.05)]',
}: {
  zoom: number
  children: ReactNode
  outerClassName?: string
  scaledStyle?: CSSProperties
  contentClassName?: string
}) {
  return (
    <div className={outerClassName}>
      <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', ...scaledStyle }}>
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  )
}
