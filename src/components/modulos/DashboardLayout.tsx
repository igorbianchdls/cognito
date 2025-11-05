'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import PageHeader from '@/components/modulos/PageHeader'
import * as React from 'react'

interface DashboardLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  headerActions?: React.ReactNode
  titleFontFamily?: string
  titleFontSize?: number
  titleFontWeight?: string
  titleColor?: string
  titleLetterSpacing?: number
  subtitleFontFamily?: string
  subtitleFontSize?: number
  subtitleFontWeight?: string
  subtitleColor?: string
  subtitleLetterSpacing?: number
  backgroundColor?: string
  contentClassName?: string
}

export default function DashboardLayout({
  title,
  subtitle,
  children,
  headerActions,
  titleFontFamily = 'var(--font-crimson-text)',
  backgroundColor = '#f8f9fa',
  contentClassName = 'flex-1 p-6',
  titleFontSize,
  titleFontWeight,
  titleColor,
  titleLetterSpacing,
  subtitleFontFamily,
  subtitleFontSize,
  subtitleFontWeight,
  subtitleColor,
  subtitleLetterSpacing,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset
        className="min-h-screen flex flex-col overflow-y-auto"
        style={{ background: backgroundColor }}
      >
        <div style={{ background: 'white', paddingBottom: 16 }}>
          <PageHeader
            title={title}
            subtitle={subtitle}
            actions={headerActions}
            titleFontFamily={titleFontFamily}
            titleFontSize={titleFontSize}
            titleFontWeight={titleFontWeight}
            titleColor={titleColor}
            titleLetterSpacing={titleLetterSpacing}
            subtitleFontFamily={subtitleFontFamily}
            subtitleFontSize={subtitleFontSize}
            subtitleFontWeight={subtitleFontWeight}
            subtitleColor={subtitleColor}
            subtitleLetterSpacing={subtitleLetterSpacing}
          />
        </div>

        <div className={contentClassName}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
