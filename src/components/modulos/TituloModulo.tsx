"use client"

import * as React from "react"

interface TituloModuloProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export default function TituloModulo({ title, subtitle, actions, className }: TituloModuloProps) {
  return (
    <div className={`w-full px-4 pt-4 md:px-6 md:pt-6 ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  )
}

