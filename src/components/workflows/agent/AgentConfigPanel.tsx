"use client"

import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info, RefreshCw, ChevronRight, Bot } from 'lucide-react'
import type { AgentBlockConfig } from '@/types/agentes/builder'
import { useMemo } from 'react'

type Props = {
  name: string
  onChangeName: (name: string) => void
  config: Partial<AgentBlockConfig>
  onChange: (patch: Partial<AgentBlockConfig>) => void
  onSave?: () => void
}

export default function AgentConfigPanel({ name, onChangeName, config, onChange, onSave }: Props) {
  const temperature = typeof config.temperature === 'number' ? config.temperature : 0.2
  const isTrained = useMemo(() => !!(config.model && (config.systemPrompt || '').trim().length > 0), [config.model, config.systemPrompt])

  return (
    <div className="p-4 space-y-4">
      {/* Title */}
      <div className="text-xl font-semibold">Playground</div>

      {/* Name */}
      <div className="space-y-2">
        <div className="text-xs text-gray-600">Nome</div>
        <Input className="h-8" value={name} onChange={(e) => onChangeName(e.target.value)} />
      </div>
      <Separator />
      {/* Status + Save */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 flex items-center gap-2">
            <span className="font-medium">AI Agent status</span>
            <span className="inline-flex items-center gap-1 text-xs">
              <span className={`w-2 h-2 rounded-full ${isTrained ? 'bg-green-500' : 'bg-gray-400'}`} />
              {isTrained ? 'Trained' : 'Not trained'}
            </span>
          </div>
          <Button onClick={onSave} className="h-8">Save to agent</Button>
        </div>
      </div>

      {/* Model */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <span>Model</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>Choose the model used by this agent</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button variant="outline" className="h-7 px-3 text-xs">Compare</Button>
        </div>
        <Select value={config.model || 'anthropic/claude-3-5-sonnet-latest'} onValueChange={(v) => onChange({ model: v })}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="anthropic/claude-sonnet-4-20250514">Anthropic · Claude 4 Sonnet (20250514)</SelectItem>
            <SelectItem value="anthropic/claude-3-5-sonnet-latest">Anthropic · Claude 3.5 Sonnet</SelectItem>
            <SelectItem value="anthropic/claude-3-haiku-latest">Anthropic · Claude 3 Haiku</SelectItem>
            <SelectItem value="openai/gpt-4o-mini">OpenAI · GPT-4o mini</SelectItem>
            <SelectItem value="openai/gpt-4o">OpenAI · GPT-4o</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Temperature */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">Temperature</div>
          <div className="text-xs text-gray-700">{temperature.toFixed(1)}</div>
        </div>
        <Slider value={[temperature]} min={0} max={1} step={0.1} onValueChange={(vals) => onChange({ temperature: Number(vals[0]) })} />
      </div>

      <Separator />

      {/* AI Actions */}
      <div className="space-y-2">
        <div className="text-xs text-gray-600">AI Actions</div>
        <Button variant="outline" className="h-10 w-full justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Bot className="w-4 h-4" />
            <span>0 actions enabled</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </Button>
      </div>

      <Separator />

      {/* System prompt selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">System prompt</div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-600" onClick={() => onChange({ systemPrompt: '' })}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <Select value="custom" onValueChange={() => {}}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Instructions (textarea) */}
      <div className="space-y-2">
        <div className="text-xs text-gray-600">Instructions</div>
        <Textarea rows={8} value={config.systemPrompt || ''} onChange={(e) => onChange({ systemPrompt: e.target.value })} />
      </div>
    </div>
  )
}
