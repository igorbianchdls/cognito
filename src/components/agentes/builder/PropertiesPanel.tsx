"use client"

import { useState, useEffect } from "react"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Block, AgentBlockConfig, ToolBlockConfig, ConditionBlockConfig, ResponseBlockConfig } from "@/types/agentes/builder"
import { Bot, Wrench, GitBranch, MessageSquareText } from "lucide-react"

type TabKey = 'geral' | 'config'

export default function PropertiesPanel({ block, onChange, onDelete }: { block: Block | null; onChange: (patch: Partial<Block>) => void; onDelete: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('geral')
  useEffect(() => setActiveTab('geral'), [block?.id])

  if (!block) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4">
          <div className="text-sm font-medium">Propriedades</div>
          <div className="text-xs text-muted-foreground">Selecione um bloco</div>
        </div>
        <Separator />
        <div className="p-6 text-sm text-muted-foreground">Selecione um bloco para ver as configurações.</div>
      </div>
    )
  }

  const icon = block.kind === 'agente' ? <Bot className="w-4 h-4" /> : block.kind === 'ferramenta' ? <Wrench className="w-4 h-4" /> : block.kind === 'condicao' ? <GitBranch className="w-4 h-4" /> : <MessageSquareText className="w-4 h-4" />
  const title = block.name || (block.kind.charAt(0).toUpperCase() + block.kind.slice(1))

  const cfgUnknown = (block.config || {}) as Record<string, unknown>

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 flex items-center gap-2">
        {icon}
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{block.kind}</div>
        </div>
      </div>
      <Separator />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList variant="underline">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
          </TabsList>
        </div>
        <Separator />

        <TabsContent value="geral" className="flex-1 overflow-auto p-4 space-y-4 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Nome</label>
            <Input className="h-8" value={block.name || ''} onChange={(e) => onChange({ name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-600">ID</label>
            <Input className="h-8" value={block.id} readOnly />
          </div>
        </TabsContent>

        <TabsContent value="config" className="flex-1 overflow-auto p-4 space-y-4 custom-scrollbar">
          {block.kind === 'agente' ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Modelo</label>
                <Select value={(cfgUnknown as Partial<AgentBlockConfig>).model || 'anthropic/claude-3-5-sonnet-latest'} onValueChange={(v) => onChange({ config: { ...(cfgUnknown as Partial<AgentBlockConfig>), model: v } })}>
                  <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic/claude-3-5-sonnet-latest">Anthropic · Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="anthropic/claude-3-haiku-latest">Anthropic · Claude 3 Haiku</SelectItem>
                    <SelectItem value="openai/gpt-4o-mini">OpenAI · GPT-4o mini</SelectItem>
                    <SelectItem value="openai/gpt-4o">OpenAI · GPT-4o</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Temperatura</label>
                <Select value={String((cfgUnknown as Partial<AgentBlockConfig>).temperature ?? 0.2)} onValueChange={(v) => onChange({ config: { ...(cfgUnknown as Partial<AgentBlockConfig>), temperature: Number(v) } })}>
                  <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.0">0.0 (determinístico)</SelectItem>
                    <SelectItem value="0.2">0.2</SelectItem>
                    <SelectItem value="0.5">0.5</SelectItem>
                    <SelectItem value="0.7">0.7</SelectItem>
                    <SelectItem value="1.0">1.0 (criativo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Instruções (system prompt)</label>
                <Textarea value={(cfgUnknown as Partial<AgentBlockConfig>).systemPrompt || ''} onChange={(e) => onChange({ config: { ...(cfgUnknown as Partial<AgentBlockConfig>), systemPrompt: e.target.value } })} rows={8} />
              </div>
            </>
          ) : null}
          {block.kind === 'ferramenta' ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Ferramentas (IDs)</label>
                <Input className="h-8" value={((cfgUnknown as Partial<ToolBlockConfig>).toolIds || []).join(', ')} onChange={(e) => onChange({ config: { ...(cfgUnknown as Partial<ToolBlockConfig>), toolIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} placeholder="ex: http, bigquery" />
              </div>
            </>
          ) : null}
          {block.kind === 'condicao' ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Expressão (MVP)</label>
                <Input className="h-8" value={(cfgUnknown as Partial<ConditionBlockConfig>).expression || ''} onChange={(e) => onChange({ config: { ...(cfgUnknown as Partial<ConditionBlockConfig>), expression: e.target.value } })} placeholder="ex: input.includes('ok')" />
              </div>
            </>
          ) : null}
          {block.kind === 'resposta' ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Template de resposta</label>
                <Textarea value={(cfgUnknown as Partial<ResponseBlockConfig>).template || ''} onChange={(e) => onChange({ config: { ...(cfgUnknown as Partial<ResponseBlockConfig>), template: e.target.value } })} rows={6} placeholder="ex: {{output}}" />
              </div>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
