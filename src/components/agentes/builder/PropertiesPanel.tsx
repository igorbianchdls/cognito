"use client"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Block, AgentBlockConfig, ToolBlockConfig, ConditionBlockConfig, ResponseBlockConfig, StepBlockConfig, PrepareStepBlockConfig, StopWhenBlockConfig } from "@/types/agentes/builder"
import { Bot, Wrench, GitBranch, MessageSquareText } from "lucide-react"
import AgentConfigPanel from "@/components/workflows/agent/AgentConfigPanel"
import { Button } from "@/components/ui/button"

export default function PropertiesPanel({ block, onChange, onDelete: _onDelete, onOpenTools }: { block: Block | null; onChange: (patch: Partial<Block>) => void; onDelete: () => void; onOpenTools?: () => void }) {

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

      <div className="flex-1 overflow-auto p-4 space-y-4 custom-scrollbar">
        {block.kind === 'agente' ? (
          <AgentConfigPanel
            name={block.name || ''}
            onChangeName={(v) => onChange({ name: v })}
            config={cfgUnknown as Partial<AgentBlockConfig>}
            onChange={(patch) => onChange({ config: { ...(cfgUnknown as Partial<AgentBlockConfig>), ...patch } })}
            onSave={() => { /* TODO: persist */ }}
            onOpenTools={onOpenTools}
          />
        ) : null}

        {block.kind !== 'agente' ? (
          <>
            <div className="space-y-2">
              <label className="text-xs text-gray-600">Nome</label>
              <Input className="h-8" value={block.name || ''} onChange={(e) => onChange({ name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-600">ID</label>
              <Input className="h-8" value={block.id} readOnly />
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
          {block.kind === 'stopWhen' ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Step limit</label>
                <Input type="number" min={1} className="h-8" value={String((cfgUnknown as Partial<StopWhenBlockConfig>).stepLimit ?? '')} onChange={(e) => onChange({ config: { ...(cfgUnknown as Partial<StopWhenBlockConfig>), stepLimit: e.currentTarget.value ? Number(e.currentTarget.value) : undefined } })} placeholder="ex: 2" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Stop when tools called (IDs, separado por vírgula)</label>
                <Input className="h-8" value={((cfgUnknown as Partial<StopWhenBlockConfig>).stopOnTools || []).join(', ')} onChange={(e) => onChange({ config: { ...(cfgUnknown as Partial<StopWhenBlockConfig>), stopOnTools: e.currentTarget.value.split(',').map(s => s.trim()).filter(Boolean) } })} placeholder="ex: finalize,save" />
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
          {block.kind === 'step' ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Model (override)</label>
                <Select value={(cfgUnknown as Partial<StepBlockConfig>).modelOverride || 'anthropic/claude-3-5-sonnet-latest'} onValueChange={(v) => onChange({ config: { ...(cfgUnknown as Partial<StepBlockConfig>), modelOverride: v } })}>
                  <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic/claude-sonnet-4-20250514">Anthropic · Claude 4 Sonnet (20250514)</SelectItem>
                    <SelectItem value="anthropic/claude-3-5-sonnet-latest">Anthropic · Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="anthropic/claude-3-haiku-latest">Anthropic · Claude 3 Haiku</SelectItem>
                    <SelectItem value="openai/gpt-4o-mini">OpenAI · GPT-4o mini</SelectItem>
                    <SelectItem value="openai/gpt-4o">OpenAI · GPT-4o</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Max steps</label>
                <Input type="number" min={1} max={20} className="h-8" value={String((cfgUnknown as Partial<StepBlockConfig>).maxSteps ?? '')} onChange={(e) => onChange({ config: { ...(cfgUnknown as Partial<StepBlockConfig>), maxSteps: e.currentTarget.value ? Number(e.currentTarget.value) : undefined } })} placeholder="ex: 3" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Tool choice</label>
                <Select value={(cfgUnknown as Partial<StepBlockConfig>).toolChoice || 'auto'} onValueChange={(v) => onChange({ config: { ...(cfgUnknown as Partial<StepBlockConfig>), toolChoice: v as StepBlockConfig['toolChoice'] } })}>
                  <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">auto</SelectItem>
                    <SelectItem value="none">none</SelectItem>
                    <SelectItem value="required">required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Force tool (name)</label>
                <Input className="h-8" value={(cfgUnknown as Partial<StepBlockConfig>).forcedToolName || ''} onChange={(e) => onChange({ config: { ...(cfgUnknown as Partial<StepBlockConfig>), forcedToolName: e.currentTarget.value || undefined } })} placeholder="ex: getTime" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Ferramentas (apenas este step)</label>
                <Button variant="outline" className="h-8" onClick={onOpenTools}>Configurar ferramentas</Button>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">prepareStep</label>
                <Select value={String((cfgUnknown as Partial<StepBlockConfig>).prepareStepEnabled ?? false)} onValueChange={(v) => onChange({ config: { ...(cfgUnknown as Partial<StepBlockConfig>), prepareStepEnabled: v === 'true' } })}>
                  <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">desativado</SelectItem>
                    <SelectItem value="true">ativado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">System mode</label>
                <Select value={(cfgUnknown as Partial<StepBlockConfig>).systemMode || 'append'} onValueChange={(v) => onChange({ config: { ...(cfgUnknown as Partial<StepBlockConfig>), systemMode: v as StepBlockConfig['systemMode'] } })}>
                  <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="append">append</SelectItem>
                    <SelectItem value="replace">replace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">System text (override per step)</label>
                <Textarea rows={5} value={(cfgUnknown as Partial<StepBlockConfig>).systemText || ''} onChange={(e) => onChange({ config: { ...(cfgUnknown as Partial<StepBlockConfig>), systemText: e.currentTarget.value || undefined } })} placeholder="Instruções específicas para este passo" />
              </div>
            </>
          ) : null}
          {block.kind === 'prepareStep' ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Compress after messages</label>
                <Input type="number" min={0} className="h-8" value={String((cfgUnknown as Partial<PrepareStepBlockConfig>).compressAfterMessages ?? '')} onChange={(e) => onChange({ config: { ...(cfgUnknown as Partial<PrepareStepBlockConfig>), compressAfterMessages: e.currentTarget.value ? Number(e.currentTarget.value) : undefined } })} placeholder="ex: 10" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Keep last messages</label>
                <Input type="number" min={0} className="h-8" value={String((cfgUnknown as Partial<PrepareStepBlockConfig>).keepLastMessages ?? '')} onChange={(e) => onChange({ config: { ...(cfgUnknown as Partial<PrepareStepBlockConfig>), keepLastMessages: e.currentTarget.value ? Number(e.currentTarget.value) : undefined } })} placeholder="ex: 10" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Stop when tools called (IDs, separado por vírgula)</label>
                <Input className="h-8" value={((cfgUnknown as Partial<PrepareStepBlockConfig>).stopOnTools || []).join(', ')} onChange={(e) => onChange({ config: { ...(cfgUnknown as Partial<PrepareStepBlockConfig>), stopOnTools: e.currentTarget.value.split(',').map(s => s.trim()).filter(Boolean) } })} placeholder="ex: finalize,save" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Default tool choice</label>
                <Select value={(cfgUnknown as Partial<PrepareStepBlockConfig>).defaultToolChoice || 'auto'} onValueChange={(v) => onChange({ config: { ...(cfgUnknown as Partial<PrepareStepBlockConfig>), defaultToolChoice: v as PrepareStepBlockConfig['defaultToolChoice'] } })}>
                  <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">auto</SelectItem>
                    <SelectItem value="none">none</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}
      </div>
    </div>
  )
}
