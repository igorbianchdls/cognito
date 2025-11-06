'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import DashboardHeader from '@/components/modulos/DashboardHeader'
import * as React from 'react'

interface DashboardLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  headerActions?: React.ReactNode
  // New header (compact) extras
  userAvatarUrl?: string
  onSearch?: () => void
  onNotifications?: () => void
  secondaryCta?: { label: string; onClick?: () => void; icon?: React.ReactNode }
  primaryCta?: { label: string; onClick?: () => void; icon?: React.ReactNode }
  headerTitleStyle?: React.CSSProperties
  headerSubtitleStyle?: React.CSSProperties
  backgroundColor?: string
  headerBackground?: string
  sidebarBgColor?: string
  sidebarTextColor?: string
  sidebarItemTextColor?: string
  contentClassName?: string
}

export default function DashboardLayout({
  title,
  subtitle,
  children,
  headerActions,
  userAvatarUrl,
  onSearch,
  onNotifications,
  secondaryCta,
  primaryCta,
  headerTitleStyle,
  headerSubtitleStyle,
  backgroundColor = '#f8f9fa',
  headerBackground = 'white',
  sidebarBgColor,
  sidebarTextColor,
  sidebarItemTextColor,
  contentClassName = 'flex-1 p-6',
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <SidebarShadcn bgColor={sidebarBgColor} textColor={sidebarTextColor} itemTextColor={sidebarItemTextColor} />
      <SidebarInset
        className="min-h-screen flex flex-col overflow-y-auto"
        style={{ background: backgroundColor }}
      >
        <div style={{ background: headerBackground, paddingBottom: 8 }}>
          <DashboardHeader
            title={title}
            subtitle={subtitle}
            avatarUrl={userAvatarUrl}
            onSearch={onSearch}
            onNotifications={onNotifications}
            secondaryCta={secondaryCta}
            primaryCta={primaryCta}
            actionsRight={headerActions}
            titleStyle={headerTitleStyle}
            subtitleStyle={headerSubtitleStyle}
          />
        </div>

        <div className={contentClassName}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
