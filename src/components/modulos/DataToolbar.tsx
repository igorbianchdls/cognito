"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Search } from "lucide-react"
import CadastroFormSheet from "@/components/modulos/CadastroFormSheet"

type DataToolbarProps = {
  className?: string
  // Left side (no integration)
  searchPlaceholder?: string
  dateRangePlaceholder?: string
  // Right side only
  from?: number
  to?: number
  total?: number
  onPrev?: () => void
  onNext?: () => void
  actionLabel?: string
  onAction?: () => void
  // Styling
  fontFamily?: string
  fontSize?: number
  fontWeight?: string
  fontColor?: string
  letterSpacing?: number
  borderBottomWidth?: number
  borderBottomColor?: string
  borderDistanceTop?: number
  underlineColor?: string
  underlineWidth?: number
  underlineOffsetTop?: number
  iconGap?: number
  iconColor?: string
  iconSize?: number
  searchWidth?: number
  dateRangeWidth?: number
}

export default function DataToolbar({
  className,
  searchPlaceholder = "Search",
  dateRangePlaceholder = "Date Range",
  from = 0,
  to = 0,
  total = 0,
  onPrev,
  onNext,
  actionLabel = "Cadastrar",
  onAction,
  fontFamily,
  fontSize,
  fontWeight,
  fontColor,
  letterSpacing,
  borderBottomWidth,
  borderBottomColor,
  borderDistanceTop,
  underlineColor,
  underlineWidth,
  underlineOffsetTop,
  iconGap,
  iconColor,
  iconSize,
  searchWidth,
  dateRangeWidth,
}: DataToolbarProps) {
  return (
    <div
      className={`w-full ${className ?? ""}`}
      style={{
        fontFamily: fontFamily && fontFamily !== 'inherit' ? fontFamily : undefined,
        fontSize: fontSize ? `${fontSize}px` : undefined,
        fontWeight: fontWeight ? (fontWeight as React.CSSProperties['fontWeight']) : undefined,
        color: fontColor || undefined,
        letterSpacing: typeof letterSpacing === 'number' ? `${letterSpacing}px` : undefined,
        borderBottomWidth: borderBottomWidth ? `${borderBottomWidth}px` : undefined,
        borderBottomStyle: borderBottomWidth ? 'solid' : undefined,
        borderBottomColor: borderBottomColor || undefined,
        paddingBottom: typeof borderDistanceTop === 'number' ? `${borderDistanceTop}px` : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left group (shadcn look) */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Search Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 px-3 gap-2">
                <Search style={{ color: iconColor || undefined, width: iconSize ? `${iconSize}px` : undefined, height: iconSize ? `${iconSize}px` : undefined }} />
                <span style={{ color: fontColor || undefined }}>{searchPlaceholder}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={6} className="p-2" style={{ width: searchWidth ? `${searchWidth}px` : undefined }}>
              <Input placeholder={searchPlaceholder} className="h-8" />
            </PopoverContent>
          </Popover>

          {/* Date Range Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 px-3 gap-2">
                <span style={{ color: fontColor || undefined }}>{dateRangePlaceholder}</span>
                <CalendarIcon style={{ color: iconColor || undefined, width: iconSize ? `${iconSize}px` : undefined, height: iconSize ? `${iconSize}px` : undefined, marginLeft: typeof iconGap === 'number' ? `${iconGap}px` : undefined }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={6} className="p-2" style={{ width: dateRangeWidth ? `${dateRangeWidth}px` : undefined }}>
              <Calendar mode="range" numberOfMonths={2} buttonVariant="ghost" />
            </PopoverContent>
          </Popover>
        </div>

        {/* Right group */}
        <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm">
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="mx-1 min-w-[96px] text-center text-sm">
            {from}–{to} of {total}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <CadastroFormSheet triggerLabel={actionLabel} />
        </div>
      </div>
    </div>
  )
}

