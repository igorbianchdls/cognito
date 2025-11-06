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
  backgroundColor?: string
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
  backgroundColor = '#f8f9fa',
  contentClassName = 'flex-1 p-6',
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset
        className="min-h-screen flex flex-col overflow-y-auto"
        style={{ background: backgroundColor }}
      >
        <div style={{ background: 'white', paddingBottom: 8 }}>
          <DashboardHeader
            title={title}
            subtitle={subtitle}
            avatarUrl={userAvatarUrl}
            onSearch={onSearch}
            onNotifications={onNotifications}
            secondaryCta={secondaryCta}
            primaryCta={primaryCta}
            actionsRight={headerActions}
          />
        </div>

        <div className={contentClassName}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
