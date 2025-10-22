"use client"

import * as React from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
  // Typography overrides
  titleFontFamily?: string
  titleFontSize?: number
  titleFontWeight?: string
  titleColor?: string
  titleLetterSpacing?: number
}

export default function PageHeader({ title, subtitle, actions, className, titleFontFamily, titleFontSize, titleFontWeight, titleColor, titleLetterSpacing }: PageHeaderProps) {
  return (
    <div className={`w-full px-4 pt-4 md:px-6 md:pt-6 ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="text-xl md:text-2xl font-semibold tracking-tight"
            style={{
              fontFamily: titleFontFamily && titleFontFamily !== 'inherit' ? titleFontFamily : undefined,
              fontSize: titleFontSize ? `${titleFontSize}px` : undefined,
              fontWeight: titleFontWeight && titleFontWeight !== '600' ? (titleFontWeight as React.CSSProperties['fontWeight']) : undefined,
              color: titleColor || undefined,
              letterSpacing: typeof titleLetterSpacing === 'number' ? `${titleLetterSpacing}px` : undefined,
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  )
}
