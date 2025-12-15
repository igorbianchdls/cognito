"use client"

import React from 'react'
import type { Block, ToolBlockConfig } from '@/types/agentes/builder'
import {
  Bot,
  CircleStop,
  FileText,
  FileSearch,
  ShieldCheck,
  Settings2,
  GitBranch,
  RefreshCw,
  UserCheck,
  Wand2,
  ToggleLeft,
  ListChecks,
  Wrench,
  Clock,
} from 'lucide-react'

export function getVisualForBlock(block: Block): {
  icon: React.ReactNode
  badgeBg: string
  badgeColor: string
} {
  const baseGray = { badgeBg: '#F3F4F6', badgeColor: '#6B7280' }

  switch (block.kind) {
    case 'agente':
      return { icon: <Bot className="w-3 h-3" />, badgeBg: '#EEF2FF', badgeColor: '#1D4ED8' }
    case 'resposta':
      return { icon: <CircleStop className="w-3 h-3" />, badgeBg: '#EAF7EC', badgeColor: '#059669' }
    case 'condicao':
      return { icon: <GitBranch className="w-3 h-3" />, badgeBg: '#FFEDD5', badgeColor: '#C2410C' }
    case 'ferramenta': {
      const cfg = (block.config || {}) as Partial<ToolBlockConfig>
      const toolId = Array.isArray(cfg.toolIds) ? cfg.toolIds[0] : undefined
      if (toolId === 'file-search') return { icon: <FileSearch className="w-3 h-3" />, badgeBg: '#FEF3C7', badgeColor: '#B45309' }
      if (toolId === 'guardrails') return { icon: <ShieldCheck className="w-3 h-3" />, badgeBg: '#FEF3C7', badgeColor: '#B45309' }
      if (toolId === 'mcp') return { icon: <Settings2 className="w-3 h-3" />, badgeBg: '#FEF3C7', badgeColor: '#B45309' }
      // default ferramenta
      return { icon: <Wrench className="w-3 h-3" />, badgeBg: '#FEF3C7', badgeColor: '#B45309' }
    }
    case 'nota':
      return { icon: <FileText className="w-3 h-3" />, ...baseGray }
    case 'loop':
      return { icon: <RefreshCw className="w-3 h-3" />, badgeBg: '#FFEDD5', badgeColor: '#C2410C' }
    case 'aprovacao':
      return { icon: <UserCheck className="w-3 h-3" />, badgeBg: '#FFEDD5', badgeColor: '#C2410C' }
    case 'transform':
      return { icon: <Wand2 className="w-3 h-3" />, badgeBg: '#F3E8FF', badgeColor: '#7E22CE' }
    case 'setstate':
      return { icon: <ToggleLeft className="w-3 h-3" />, badgeBg: '#F3E8FF', badgeColor: '#7E22CE' }
    case 'step':
      return { icon: <ListChecks className="w-3 h-3" />, badgeBg: '#FFEDD5', badgeColor: '#C2410C' }
    case 'prepareStep':
      return { icon: <Settings2 className="w-4 h-4" />, badgeBg: '#E0F2FE', badgeColor: '#0369A1' }
    case 'stopWhen':
      return { icon: <Clock className="w-4 h-4" />, badgeBg: '#FFF7ED', badgeColor: '#9A3412' }
    default:
      return { icon: <FileText className="w-3 h-3" />, ...baseGray }
  }
}
