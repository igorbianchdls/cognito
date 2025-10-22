"use client"

import * as React from "react"
import { useStore } from "@nanostores/react"
import { $titulo, $tabs, $tabelaUI, $layout, financeiroUiActions } from "@/stores/modulos/financeiroUiStore"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function FinanceiroUiPanel() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabela = useStore($tabelaUI)
  const layout = useStore($layout)

  return (
    <div className="w-full px-4 pb-6 md:px-6">
      <div className="border rounded-md p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Configurações de UI</h2>
          <Button variant="secondary" size="sm" onClick={() => financeiroUiActions.resetAll()}>Reset</Button>
        </div>

        <Separator />

        {/* Título */}
        <div className="grid gap-3">
          <span className="text-xs font-medium text-muted-foreground">Título</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ui-title">Título</Label>
              <Input id="ui-title" value={titulo.title} onChange={(e) => financeiroUiActions.setTitulo({ title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="ui-subtitle">Subtítulo</Label>
              <Input id="ui-subtitle" value={titulo.subtitle ?? ''} onChange={(e) => financeiroUiActions.setTitulo({ subtitle: e.target.value })} />
            </div>
          </div>
        </div>

        <Separator />

        {/* Tabs */}
        <div className="grid gap-3">
          <span className="text-xs font-medium text-muted-foreground">Opções (Tabs)</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <Label>Selecionada</Label>
              <Select value={tabs.selected} onValueChange={(v) => financeiroUiActions.setTabs({ selected: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {tabs.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Tabela */}
        <div className="grid gap-3">
          <span className="text-xs font-medium text-muted-foreground">Tabela</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center justify-between gap-4 border rounded-md p-3">
              <div>
                <Label>Busca</Label>
                <div className="text-xs text-muted-foreground">Exibir campo de busca</div>
              </div>
              <Switch checked={tabela.enableSearch} onCheckedChange={(v) => financeiroUiActions.setTabelaUI({ enableSearch: v })} />
            </div>
            <div className="flex items-center justify-between gap-4 border rounded-md p-3">
              <div>
                <Label>Paginação</Label>
                <div className="text-xs text-muted-foreground">Exibir paginação</div>
              </div>
              <Switch checked={tabela.showPagination} onCheckedChange={(v) => financeiroUiActions.setTabelaUI({ showPagination: v })} />
            </div>
            <div className="flex items-center justify-between gap-4 border rounded-md p-3">
              <div>
                <Label>Colunas</Label>
                <div className="text-xs text-muted-foreground">Alternar visibilidade</div>
              </div>
              <Switch checked={tabela.enableColumnToggle} onCheckedChange={(v) => financeiroUiActions.setTabelaUI({ enableColumnToggle: v })} />
            </div>
            <div className="flex items-center justify-between gap-4 border rounded-md p-3">
              <div>
                <Label>Seleção</Label>
                <div className="text-xs text-muted-foreground">Permitir seleção de linhas</div>
              </div>
              <Switch checked={tabela.enableRowSelection} onCheckedChange={(v) => financeiroUiActions.setTabelaUI({ enableRowSelection: v })} />
            </div>
            <div>
              <Label>Modo de seleção</Label>
              <Select value={tabela.selectionMode} onValueChange={(v) => financeiroUiActions.setTabelaUI({ selectionMode: v as 'single' | 'multiple' })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="multiple">Multiple</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ui-pagesize">Page size</Label>
              <Input id="ui-pagesize" type="number" min={1} max={200}
                value={tabela.pageSize}
                onChange={(e) => financeiroUiActions.setTabelaUI({ pageSize: Math.max(1, Number(e.target.value || 1)) })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 border rounded-md p-3">
              <div>
                <Label>Cabeçalho fixo</Label>
                <div className="text-xs text-muted-foreground">Torna o header sticky</div>
              </div>
              <Switch checked={tabela.stickyHeader} onCheckedChange={(v) => financeiroUiActions.setTabelaUI({ stickyHeader: v })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="ui-headerbg">Header bg</Label>
              <Input id="ui-headerbg" value={tabela.headerBg} onChange={(e) => financeiroUiActions.setTabelaUI({ headerBg: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="ui-headertext">Header text</Label>
              <Input id="ui-headertext" value={tabela.headerText} onChange={(e) => financeiroUiActions.setTabelaUI({ headerText: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="ui-celltext">Cell text</Label>
              <Input id="ui-celltext" value={tabela.cellText} onChange={(e) => financeiroUiActions.setTabelaUI({ cellText: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="ui-headerfs">Header font size</Label>
              <Input id="ui-headerfs" type="number" min={10} max={24}
                value={tabela.headerFontSize}
                onChange={(e) => financeiroUiActions.setTabelaUI({ headerFontSize: Number(e.target.value || 13) })}
              />
            </div>
            <div>
              <Label htmlFor="ui-cellfs">Cell font size</Label>
              <Input id="ui-cellfs" type="number" min={10} max={24}
                value={tabela.cellFontSize}
                onChange={(e) => financeiroUiActions.setTabelaUI({ cellFontSize: Number(e.target.value || 13) })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Layout */}
        <div className="grid gap-3">
          <span className="text-xs font-medium text-muted-foreground">Layout (margens em px)</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="ui-mbtitle">Margem inferior do título</Label>
              <Input
                id="ui-mbtitle"
                type="number"
                min={0}
                value={layout.mbTitle}
                onChange={(e) => financeiroUiActions.setLayout({ mbTitle: Math.max(0, Number(e.target.value || 0)) })}
              />
            </div>
            <div>
              <Label htmlFor="ui-mbtabs">Margem inferior das opções</Label>
              <Input
                id="ui-mbtabs"
                type="number"
                min={0}
                value={layout.mbTabs}
                onChange={(e) => financeiroUiActions.setLayout({ mbTabs: Math.max(0, Number(e.target.value || 0)) })}
              />
            </div>
            <div>
              <Label htmlFor="ui-mbtable">Margem inferior da tabela</Label>
              <Input
                id="ui-mbtable"
                type="number"
                min={0}
                value={layout.mbTable}
                onChange={(e) => financeiroUiActions.setLayout({ mbTable: Math.max(0, Number(e.target.value || 0)) })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
