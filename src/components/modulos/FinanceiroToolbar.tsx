"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Calendar, Search } from "lucide-react"

type FinanceiroToolbarProps = {
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

export default function FinanceiroToolbar({
  className,
  searchPlaceholder = "Search",
  dateRangePlaceholder = "Date Range",
  from = 0,
  to = 0,
  total = 0,
  onPrev,
  onNext,
  actionLabel = "Sync (10)",
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
}: FinanceiroToolbarProps) {
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
        {/* Left group */}
        <div className="flex items-center gap-6 min-w-0">
          {/* Search underlined */}
          <div className="relative min-w-[160px] w-[240px]" style={{ width: searchWidth ? `${searchWidth}px` : undefined }}>
            <Input
              placeholder={searchPlaceholder}
              className="h-8 rounded-none border-0 border-b bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0 focus-visible:border-transparent"
              style={{
                borderBottomColor: underlineColor || undefined,
                borderBottomWidth: typeof underlineWidth === 'number' ? `${underlineWidth}px` : undefined,
                borderBottomStyle: underlineWidth ? 'solid' : undefined,
                paddingBottom: typeof underlineOffsetTop === 'number' ? `${underlineOffsetTop}px` : undefined,
              }}
            />
            <Search className="absolute right-0 top-1/2 -translate-y-1/2" style={{ color: iconColor || undefined, width: iconSize ? `${iconSize}px` : undefined, height: iconSize ? `${iconSize}px` : undefined }} />
          </div>

          {/* Date Range underlined */}
          <button
            type="button"
            className="h-8 inline-flex items-center gap-2 border-0 border-b px-0 text-sm"
            style={{
              borderBottomColor: underlineColor || undefined,
              borderBottomWidth: typeof underlineWidth === 'number' ? `${underlineWidth}px` : undefined,
              borderBottomStyle: underlineWidth ? 'solid' : undefined,
              paddingBottom: typeof underlineOffsetTop === 'number' ? `${underlineOffsetTop}px` : undefined,
              width: dateRangeWidth ? `${dateRangeWidth}px` : undefined,
            }}
          >
            <span>{dateRangePlaceholder}</span>
            <Calendar className="" style={{ color: iconColor || undefined, width: iconSize ? `${iconSize}px` : undefined, height: iconSize ? `${iconSize}px` : undefined, marginLeft: typeof iconGap === 'number' ? `${iconGap}px` : undefined }} />
          </button>
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

        <Button
          onClick={onAction}
          className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300"
          variant="secondary"
        >
          {actionLabel}
        </Button>
        </div>
      </div>
    </div>
  )
}
