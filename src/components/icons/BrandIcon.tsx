"use client"

import * as React from 'react'
import { Plug } from 'lucide-react'
import { Icon, addCollection } from '@iconify/react'
import { icons as simpleIcons } from '@iconify-json/simple-icons'
import {
  SiGmail,
  SiGithub,
  SiGooglecalendar,
  SiNotion,
  SiGooglesheets,
} from '@icons-pack/react-simple-icons'

// Register Simple Icons collection once
addCollection(simpleIcons as any)

type BrandIconProps = {
  brand: string
  size?: number
  className?: string
  title?: string
}

export default function BrandIcon({ brand, size = 16, className, title }: BrandIconProps) {
  const key = (brand || '').toLowerCase()
  // Prefer colored React components when available
  switch (key) {
    case 'gmail':
      return <SiGmail size={size} color="default" title={title || 'Gmail'} className={className} />
    case 'github':
      return <SiGithub size={size} color="default" title={title || 'GitHub'} className={className} />
    case 'gcal':
      return <SiGooglecalendar size={size} color="default" title={title || 'Google Calendar'} className={className} />
    case 'notion':
      return <SiNotion size={size} color="default" title={title || 'Notion'} className={className} />
    case 'gsheets':
      return <SiGooglesheets size={size} color="default" title={title || 'Google Sheets'} className={className} />
    default: {
      // Try Iconify (monochrome). Map a few common aliases.
      const alias: Record<string, string> = {
        gcal: 'googlecalendar',
        gsheets: 'googlesheets',
      }
      const iconKey = alias[key] || key
      if (iconKey) {
        return <Icon icon={`simple-icons:${iconKey}`} width={size} height={size} className={className} />
      }
      // Fallback: generic plug icon
      return <Plug size={size} className={className} />
    }
  }
}

