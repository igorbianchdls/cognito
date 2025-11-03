"use client"

import { useState } from "react"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Step } from "@/app/workflows/builder/types"
import NodeHeader from "./properties/NodeHeader"
import NodeToolbar from "./properties/NodeToolbar"
import Section from "./properties/Section"
import Tag from "./properties/Tag"
import KeyValueRow from "./properties/KeyValueRow"
import { Database, Zap } from "lucide-react"

type TabKey = 'editor' | 'settings' | 'details' | 'executions'

export default function PropertiesPanel({ step, onChange: _onChange, onDelete: _onDelete }: { step: Step | null; onChange: (patch: Partial<Step>) => void; onDelete: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('settings')
  const handleTabChange = (v: string) => {
    const allowed = ['editor','settings','details','executions'] as const
    if ((allowed as readonly string[]).includes(v)) setActiveTab(v as TabKey)
  }

  if (!step) {
    return (
      <div className="h-full flex flex-col bg-white">
        <NodeHeader title="Propriedades" subtitle="Selecione um passo" icon={<Database className='w-4 h-4' />} />
        <NodeToolbar />
        <Separator />
        <div className="p-6 text-sm text-muted-foreground">Selecione um passo para ver as configurações.</div>
      </div>
    )
  }

  const icon = step.type === 'trigger' ? <Zap className="w-4 h-4" /> : <Database className="w-4 h-4" />
  const title = step.text || (step.type === 'trigger' ? 'Trigger' : step.type === 'action' ? 'Action' : step.type)
  const subtitle = step.type === 'trigger' ? 'Trigger' : step.type === 'action' ? 'Action' : step.type

  return (
    <div className="h-full flex flex-col bg-white">
      <NodeHeader icon={icon} title={title} subtitle={subtitle} />
      <NodeToolbar />
      <Separator />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList variant="underline">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="executions">Executions</TabsTrigger>
          </TabsList>
        </div>
        <Separator />

        <TabsContent value="settings" className="flex-1 overflow-auto p-4 space-y-6 custom-scrollbar">
          <Section title="Connections">
            <div className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>no parameters defined</div>
          </Section>

          <Section title="Parameters">
            <KeyValueRow label="period_discount_rate" type="input" placeholder="float" value="0.022" />
          </Section>

          <Section title="Inputs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag>dates</Tag>
                <Select defaultValue="dates">
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dates">dates</SelectItem>
                    <SelectItem value="calendar">calendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Tag>customer_activity</Tag>
                <Select defaultValue="activity_with_metadata">
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity_with_metadata">activity_with_metadata</SelectItem>
                    <SelectItem value="activity_raw">activity_raw</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          <Section title="Outputs">
            <div className="flex items-center gap-2">
              <Tag>output_table</Tag>
              <Select defaultValue="cohort_activity">
                <SelectTrigger className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cohort_activity">cohort_activity</SelectItem>
                  <SelectItem value="export_table">export_table</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          <Section title="Schedule">
            <div className="flex items-center gap-3 text-sm">
              <Switch /> <span className="text-gray-600">not scheduled</span>
            </div>
          </Section>

          <Section title="Appearance">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border" style={{ background: '#2C60F6' }} />
              <Input className="h-8" value="#2C60F6" readOnly />
            </div>
          </Section>

          <Section title="Node ID">
            <Input className="h-8" value={step.id} readOnly />
          </Section>

          <Section title="State">
            <div className="text-xs text-gray-500">no state available</div>
          </Section>
        </TabsContent>

        <TabsContent value="editor" className="flex-1 overflow-auto p-4 custom-scrollbar">
          <div className="text-sm text-gray-600">Editor UI (em breve)</div>
        </TabsContent>
        <TabsContent value="details" className="flex-1 overflow-auto p-4 custom-scrollbar">
          <div className="text-sm text-gray-600">Detalhes do nó (em breve)</div>
        </TabsContent>
        <TabsContent value="executions" className="flex-1 overflow-auto p-4 custom-scrollbar">
          <div className="text-sm text-gray-600">Lista de execuções (em breve)</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
