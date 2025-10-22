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
}: FinanceiroToolbarProps) {
  return (
    <div className={`w-full ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-3">
        {/* Left group */}
        <div className="flex items-center gap-6 min-w-0">
          {/* Search underlined */}
          <div className="relative min-w-[200px] w-[240px]">
            <Input
              placeholder={searchPlaceholder}
              className="h-8 rounded-none border-0 border-b border-gray-300 bg-transparent px-0 focus-visible:ring-0 focus-visible:border-gray-500 text-sm"
            />
            <Search className="absolute right-0 top-1.5 h-4 w-4 text-gray-400" />
          </div>

          {/* Date Range underlined */}
          <button
            type="button"
            className="h-8 inline-flex items-center gap-2 border-0 border-b border-gray-300 px-0 text-sm text-gray-700 hover:border-gray-500"
          >
            <span className="text-gray-500">{dateRangePlaceholder}</span>
            <Calendar className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Right group */}
        <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="mx-1 min-w-[96px] text-center">
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
