"use client"

import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { GitBranch, Clock4, Network, Code, Database, Settings, Webhook, Zap, Slack, Github, Gitlab, Plug } from "lucide-react"

const SectionList = ({ items }: { items: { icon: React.ReactNode; label: string; hint?: string }[] }) => (
  <div className="grid grid-cols-2 gap-2">
    {items.map((it, i) => (
      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-sm cursor-default select-none min-h-[64px]">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 text-gray-700">
          {it.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="truncate text-gray-800 font-semibold" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>{it.label}</div>
          {it.hint ? <div className="text-[11px] text-gray-500 truncate" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>{it.hint}</div> : null}
        </div>
      </div>
    ))}
  </div>
)

export default function ConnectorsPanel() {
  return (
    <aside className="h-full w-full bg-white flex flex-col">
      <div className="p-3">
        <div className="text-xs font-medium text-gray-500 mb-2" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>Conectores</div>
        <Input placeholder="Buscar conectores..." className="h-8" />
      </div>
      <Separator />
      <div className="p-2 flex-1 overflow-auto sidebar-scrollbar">
        <Accordion type="multiple" defaultValue={["core","helpers","triggers","apps"]}>
          <AccordionItem value="core" className="border-none">
            <AccordionTrigger className="text-sm px-2" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>Core</AccordionTrigger>
            <AccordionContent className="px-1 pb-2">
              <SectionList items={[
                { icon: <GitBranch className="w-4 h-4" />, label: 'Branch', hint: 'Fluxo condicional' },
                { icon: <Clock4 className="w-4 h-4" />, label: 'Delay', hint: 'Aguardar intervalo' },
                { icon: <Network className="w-4 h-4" />, label: 'HTTP client', hint: 'Chamar API' },
                { icon: <Code className="w-4 h-4" />, label: 'Script', hint: 'JavaScript customizado' },
                { icon: <Database className="w-4 h-4" />, label: 'Data storage', hint: 'Guardar/ler dados' },
              ]} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="helpers" className="border-none">
            <AccordionTrigger className="text-sm px-2" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>Helpers</AccordionTrigger>
            <AccordionContent className="px-1 pb-2">
              <SectionList items={[
                { icon: <Settings className="w-4 h-4" />, label: 'Data mapper', hint: 'Transformar dados' },
                { icon: <Settings className="w-4 h-4" />, label: 'CSV reader', hint: 'Ler CSV' },
                { icon: <Settings className="w-4 h-4" />, label: 'CSV editor', hint: 'Editar CSV' },
              ]} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="triggers" className="border-none">
            <AccordionTrigger className="text-sm px-2" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>Triggers</AccordionTrigger>
            <AccordionContent className="px-1 pb-2">
              <SectionList items={[
                { icon: <Webhook className="w-4 h-4" />, label: 'Webhook trigger', hint: 'Receber eventos HTTP' },
                { icon: <Zap className="w-4 h-4" />, label: 'Schedule trigger', hint: 'Executar por agenda' },
              ]} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="apps" className="border-none">
            <AccordionTrigger className="text-sm px-2" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>Apps</AccordionTrigger>
            <AccordionContent className="px-1 pb-3">
              <SectionList items={[
                { icon: <Github className="w-4 h-4" />, label: 'GitHub' },
                { icon: <Slack className="w-4 h-4" />, label: 'Slack' },
                { icon: <Gitlab className="w-4 h-4" />, label: 'GitLab' },
                { icon: <Plug className="w-4 h-4" />, label: 'Webhook' },
              ]} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </aside>
  )
}
