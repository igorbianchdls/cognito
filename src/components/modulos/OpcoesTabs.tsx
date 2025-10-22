"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type Opcao = {
  value: string
  label: string
  icon?: React.ReactNode
  badge?: React.ReactNode
}

interface OpcoesTabsProps {
  options: Opcao[]
  value: string
  onValueChange: (value: string) => void
  className?: string
  // Typography overrides
  fontFamily?: string
  fontSize?: number
  fontWeight?: string
  color?: string
}

export default function OpcoesTabs({ options, value, onValueChange, className, fontFamily, fontSize, fontWeight, color }: OpcoesTabsProps) {
  return (
    <div className={`w-full px-4 md:px-6 ${className ?? ""}`}>
      <Tabs value={value} onValueChange={onValueChange} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          {options.map((opt) => (
            <TabsTrigger
              key={opt.value}
              value={opt.value}
              className="data-[state=active]:font-semibold"
              style={{
                fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
                fontSize: fontSize ? `${fontSize}px` : undefined,
                fontWeight: fontWeight && fontWeight !== '500' ? (fontWeight as React.CSSProperties['fontWeight']) : undefined,
                color: color || undefined,
              }}
            >
              <span className="flex items-center gap-2">
                {opt.icon ? <span className="inline-flex items-center">{opt.icon}</span> : null}
                <span>{opt.label}</span>
                {opt.badge ? <span className="text-xs text-muted-foreground">{opt.badge}</span> : null}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
