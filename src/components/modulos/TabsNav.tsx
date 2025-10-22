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

interface TabsNavProps {
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
  // Icons and spacing
  iconSize?: number
  startOffset?: number
  labelOffsetY?: number
  activeColor?: string
  activeFontWeight?: string
}

export default function TabsNav({ options, value, onValueChange, className, fontFamily, fontSize, fontWeight, color, letterSpacing, iconSize, startOffset = 0, labelOffsetY = 0, activeColor, activeFontWeight }: TabsNavProps) {
  const renderIcon = (node?: React.ReactNode) => {
    if (!node) return null
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<{ style?: React.CSSProperties }>
      const prevStyle: React.CSSProperties = element.props?.style || {}
      return React.cloneElement(element, {
        style: {
          ...prevStyle,
          width: iconSize ? `${iconSize}px` : prevStyle.width,
          height: iconSize ? `${iconSize}px` : prevStyle.height,
        },
      })
    }
    return <span>{node as React.ReactNode}</span>
  }
  return (
    <div className={`w-full ${className ?? ""}`}>
      <Tabs value={value} onValueChange={onValueChange} className="w-full">
        <TabsList className="w-full" variant="underline" style={{ paddingLeft: startOffset }}>
          {options.map((opt) => (
            <TabsTrigger
              key={opt.value}
              value={opt.value}
              className=""
              variant="underline"
              activeColor={activeColor}
              inactiveColor={color}
            >
              <span
                className="flex items-center gap-2"
                style={{
                  fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
                  fontSize: fontSize ? `${fontSize}px` : undefined,
                  fontWeight: (opt.value === value && activeFontWeight ? activeFontWeight : fontWeight) as React.CSSProperties['fontWeight'],
                  letterSpacing: typeof letterSpacing === 'number' ? `${letterSpacing}px` : undefined,
                  paddingBottom: labelOffsetY,
                }}
              >
                {opt.icon ? <span className="inline-flex items-center">{renderIcon(opt.icon)}</span> : null}
                <span>{opt.label}</span>
                <span className="inline-flex items-center ml-1">
                  {opt.rightIcon ? renderIcon(opt.rightIcon) : <Dot style={{ width: (iconSize ? iconSize - 4 : 12), height: (iconSize ? iconSize - 4 : 12) }} />}
                </span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}

