"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dot } from "lucide-react"

export type Opcao = {
  value: string
  label: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  rightIcon?: React.ReactNode
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
  letterSpacing?: number
}

export default function OpcoesTabs({ options, value, onValueChange, className, fontFamily, fontSize, fontWeight, color, letterSpacing }: OpcoesTabsProps) {
  return (
    <div className={`w-full px-4 md:px-6 ${className ?? ""}`}>
      <Tabs value={value} onValueChange={onValueChange} className="w-full">
        <TabsList className="w-full" variant="underline">
          {options.map((opt) => (
            <TabsTrigger
              key={opt.value}
              value={opt.value}
              className=""
              variant="underline"
            >
              <span
                className="flex items-center gap-2"
                style={{
                  fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
                  fontSize: fontSize ? `${fontSize}px` : undefined,
                  fontWeight: fontWeight && fontWeight !== '500' ? (fontWeight as React.CSSProperties['fontWeight']) : undefined,
                  color: color || undefined,
                  letterSpacing: typeof letterSpacing === 'number' ? `${letterSpacing}px` : undefined,
                }}
              >
                {opt.icon ? <span className="inline-flex items-center">{opt.icon}</span> : null}
                <span>{opt.label}</span>
                <span className="inline-flex items-center ml-1 text-gray-400">
                  {opt.rightIcon ? opt.rightIcon : <Dot className="h-3 w-3" />}
                </span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
