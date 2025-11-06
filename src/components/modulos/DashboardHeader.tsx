"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Search, Bell, CalendarPlus, Plus } from "lucide-react"

type CTA = { label: string; onClick?: () => void; icon?: React.ReactNode }

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  avatarUrl?: string
  className?: string
  // Actions (optional)
  onSearch?: () => void
  onNotifications?: () => void
  secondaryCta?: CTA // e.g., Schedule
  primaryCta?: CTA // e.g., Create Request
  actionsLeft?: React.ReactNode
  actionsRight?: React.ReactNode
  // Typography styles
  titleStyle?: React.CSSProperties
  subtitleStyle?: React.CSSProperties
}

export default function DashboardHeader({ title, subtitle, avatarUrl, className, onSearch, onNotifications, secondaryCta, primaryCta, actionsLeft, actionsRight, titleStyle, subtitleStyle }: DashboardHeaderProps) {
  return (
    <div className={`w-full px-4 pt-4 md:px-6 md:pt-6 ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
            {avatarUrl ? (
              // biome-ignore lint/a11y/useAltText: decorative avatar
              <img src={avatarUrl} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-purple-700 font-semibold">{(title || "").slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="text-base md:text-lg font-semibold text-gray-900 leading-tight" style={titleStyle}>{title}</div>
            {subtitle ? (
              <div className="text-xs md:text-sm text-gray-500 mt-0.5" style={subtitleStyle}>{subtitle}</div>
            ) : null}
            {actionsLeft ? <div className="mt-1">{actionsLeft}</div> : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Search" onClick={onSearch}>
            <Search />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications" onClick={onNotifications}>
            <Bell />
          </Button>
          {secondaryCta ? (
            <Button variant="outline" onClick={secondaryCta.onClick}>
              <CalendarPlus />
              {secondaryCta.label}
            </Button>
          ) : null}
          {primaryCta ? (
            <Button onClick={primaryCta.onClick}>
              {primaryCta.icon ?? <Plus />}
              {primaryCta.label}
            </Button>
          ) : null}
          {actionsRight}
        </div>
      </div>
    </div>
  )
}
