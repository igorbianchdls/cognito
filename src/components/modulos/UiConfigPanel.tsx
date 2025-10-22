"use client"

import * as React from "react"
import { useStore } from "@nanostores/react"
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, financeiroUiActions } from "@/stores/modulos/financeiroUiStore"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

export default function UiConfigPanel() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabela = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbar = useStore($toolbarUI)
  const [openTitle, setOpenTitle] = React.useState(false)
  const [openTabs, setOpenTabs] = React.useState(false)
  const [openTable, setOpenTable] = React.useState(false)
  const [openLayout, setOpenLayout] = React.useState(false)
  const [openToolbar, setOpenToolbar] = React.useState(false)

  return (
    <div className="w-full px-4 pb-6 md:px-6">
      <div className="border rounded-md p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Configurações de UI</h2>
          <Button variant="secondary" size="sm" onClick={() => financeiroUiActions.resetAll()}>Reset</Button>
        </div>

        <Separator />

        {/* Toolbar */}
        <Collapsible open={openToolbar} onOpenChange={setOpenToolbar}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Toolbar</span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <ChevronDown className={`h-4 w-4 transition-transform ${openToolbar ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="mt-3 space-y-3">
            <h4 className="text-xs font-semibold">Tipografia</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <Label>Fonte</Label>
                <Select value={(toolbar.fontFamily ?? 'Geist')} onValueChange={(v) => financeiroUiActions.setToolbarUI({ fontFamily: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geist">Geist</SelectItem>
                    <SelectItem value="Inter">Inter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ui-toolbar-size">Tamanho</Label>
                <Input id="ui-toolbar-size" type="number" min={10} max={24}
                  value={toolbar.fontSize ?? 14}
                  onChange={(e) => financeiroUiActions.setToolbarUI({ fontSize: Number(e.target.value || 14) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-toolbar-weight">Peso</Label>
                <Select value={(toolbar.fontWeight ?? '500').toString()} onValueChange={(v) => financeiroUiActions.setToolbarUI({ fontWeight: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Normal (400)</SelectItem>
                    <SelectItem value="500">Médio (500)</SelectItem>
                    <SelectItem value="600">Semibold (600)</SelectItem>
                    <SelectItem value="700">Bold (700)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ui-toolbar-color">Cor</Label>
                <Input id="ui-toolbar-color" type="color" value={toolbar.fontColor ?? '#6b7280'}
                  onChange={(e) => financeiroUiActions.setToolbarUI({ fontColor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ui-toolbar-tracking">Espaçamento</Label>
                <Input id="ui-toolbar-tracking" type="number" step={0.5} min={-5} max={20}
                  value={toolbar.letterSpacing ?? 0}
                  onChange={(e) => financeiroUiActions.setToolbarUI({ letterSpacing: Number(e.target.value || 0) })}
                />
              </div>
            </div>

            <h4 className="text-xs font-semibold mt-4">Borda Inferior</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="ui-toolbar-border-width">Largura da Borda (px)</Label>
                <Input id="ui-toolbar-border-width" type="number" min={0} max={10}
                  value={toolbar.borderBottomWidth ?? 1}
                  onChange={(e) => financeiroUiActions.setToolbarUI({ borderBottomWidth: Number(e.target.value || 0) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-toolbar-border-color">Cor da Borda</Label>
                <Input id="ui-toolbar-border-color" type="color" value={toolbar.borderBottomColor ?? '#e5e7eb'}
                  onChange={(e) => financeiroUiActions.setToolbarUI({ borderBottomColor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ui-toolbar-border-distance">Distância até Borda (px)</Label>
                <Input id="ui-toolbar-border-distance" type="number" min={0} max={50}
                  value={toolbar.borderDistanceTop ?? 8}
                  onChange={(e) => financeiroUiActions.setToolbarUI({ borderDistanceTop: Number(e.target.value || 8) })}
                />
              </div>
            </div>

            <h4 className="text-xs font-semibold mt-4">Ícones</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="ui-toolbar-icon-color">Cor dos Ícones</Label>
                <Input id="ui-toolbar-icon-color" type="color" value={toolbar.iconColor ?? '#9ca3af'}
                  onChange={(e) => financeiroUiActions.setToolbarUI({ iconColor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ui-toolbar-icon-size">Tamanho dos Ícones (px)</Label>
                <Input id="ui-toolbar-icon-size" type="number" min={12} max={32}
                  value={toolbar.iconSize ?? 16}
                  onChange={(e) => financeiroUiActions.setToolbarUI({ iconSize: Number(e.target.value || 16) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-toolbar-icon-gap">Gap entre Ícones (px)</Label>
                <Input id="ui-toolbar-icon-gap" type="number" min={0} max={20}
                  value={toolbar.iconGap ?? 8}
                  onChange={(e) => financeiroUiActions.setToolbarUI({ iconGap: Number(e.target.value || 8) })}
                />
              </div>
            </div>

            <h4 className="text-xs font-semibold mt-4">Popovers</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ui-toolbar-search-width">Largura Busca (px)</Label>
                <Input id="ui-toolbar-search-width" type="number" min={150} max={400}
                  value={toolbar.searchWidth ?? 240}
                  onChange={(e) => financeiroUiActions.setToolbarUI({ searchWidth: Number(e.target.value || 240) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-toolbar-daterange-width">Largura Date Range (px)</Label>
                <Input id="ui-toolbar-daterange-width" type="number" min={100} max={300}
                  value={toolbar.dateRangeWidth ?? 160}
                  onChange={(e) => financeiroUiActions.setToolbarUI({ dateRangeWidth: Number(e.target.value || 160) })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Título */}
        <Collapsible open={openTitle} onOpenChange={setOpenTitle}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Título</span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <ChevronDown className={`h-4 w-4 transition-transform ${openTitle ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="mt-3 space-y-3">
            <div>
              <Label htmlFor="ui-title-text">Título</Label>
              <Input id="ui-title-text" type="text"
                value={titulo.title}
                onChange={(e) => financeiroUiActions.setTitulo({ title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ui-title-subtitle">Subtítulo</Label>
              <Input id="ui-title-subtitle" type="text"
                value={titulo.subtitle ?? ''}
                onChange={(e) => financeiroUiActions.setTitulo({ subtitle: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label>Fonte</Label>
                <Select value={(titulo.titleFontFamily ?? 'Geist')} onValueChange={(v) => financeiroUiActions.setTitulo({ titleFontFamily: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geist">Geist</SelectItem>
                    <SelectItem value="Inter">Inter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ui-title-size">Tamanho</Label>
                <Input id="ui-title-size" type="number" min={12} max={48}
                  value={titulo.titleFontSize ?? 24}
                  onChange={(e) => financeiroUiActions.setTitulo({ titleFontSize: Number(e.target.value || 24) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-title-weight">Peso</Label>
                <Select value={(titulo.titleFontWeight ?? '600').toString()} onValueChange={(v) => financeiroUiActions.setTitulo({ titleFontWeight: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Normal (400)</SelectItem>
                    <SelectItem value="500">Médio (500)</SelectItem>
                    <SelectItem value="600">Semibold (600)</SelectItem>
                    <SelectItem value="700">Bold (700)</SelectItem>
                    <SelectItem value="800">Extrabold (800)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ui-title-color">Cor</Label>
                <Input id="ui-title-color" type="color" value={titulo.titleColor ?? '#111827'}
                  onChange={(e) => financeiroUiActions.setTitulo({ titleColor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ui-title-tracking">Espaçamento</Label>
                <Input id="ui-title-tracking" type="number" step={0.5} min={-5} max={20}
                  value={titulo.titleLetterSpacing ?? 0}
                  onChange={(e) => financeiroUiActions.setTitulo({ titleLetterSpacing: Number(e.target.value || 0) })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Tabs */}
        <Collapsible open={openTabs} onOpenChange={setOpenTabs}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tabs</span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <ChevronDown className={`h-4 w-4 transition-transform ${openTabs ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="mt-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label>Fonte</Label>
                <Select value={(tabs.fontFamily ?? 'Geist')} onValueChange={(v) => financeiroUiActions.setTabs({ fontFamily: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geist">Geist</SelectItem>
                    <SelectItem value="Inter">Inter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ui-tabs-size">Tamanho</Label>
                <Input id="ui-tabs-size" type="number" min={10} max={24}
                  value={tabs.fontSize ?? 14}
                  onChange={(e) => financeiroUiActions.setTabs({ fontSize: Number(e.target.value || 14) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-tabs-weight">Peso</Label>
                <Select value={(tabs.fontWeight ?? '500').toString()} onValueChange={(v) => financeiroUiActions.setTabs({ fontWeight: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Normal (400)</SelectItem>
                    <SelectItem value="500">Médio (500)</SelectItem>
                    <SelectItem value="600">Semibold (600)</SelectItem>
                    <SelectItem value="700">Bold (700)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ui-tabs-color">Cor</Label>
                <Input id="ui-tabs-color" type="color" value={tabs.color ?? '#111827'}
                  onChange={(e) => financeiroUiActions.setTabs({ color: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ui-tabs-active-color">Cor Ativa</Label>
                <Input id="ui-tabs-active-color" type="color" value={tabs.activeColor ?? '#111827'}
                  onChange={(e) => financeiroUiActions.setTabs({ activeColor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ui-tabs-active-weight">Peso Ativo</Label>
                <Select value={(tabs.activeFontWeight ?? '500').toString()} onValueChange={(v) => financeiroUiActions.setTabs({ activeFontWeight: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Normal (400)</SelectItem>
                    <SelectItem value="500">Médio (500)</SelectItem>
                    <SelectItem value="600">Semibold (600)</SelectItem>
                    <SelectItem value="700">Bold (700)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ui-tabs-active-border-color">Cor da Borda Ativa</Label>
                <Input id="ui-tabs-active-border-color" type="color" value={tabs.activeBorderColor ?? 'rgb(41, 41, 41)'}
                  onChange={(e) => financeiroUiActions.setTabs({ activeBorderColor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ui-tabs-tracking">Espaçamento</Label>
                <Input id="ui-tabs-tracking" type="number" step={0.01} min={-0.05} max={0.05}
                  value={tabs.letterSpacing ?? 0}
                  onChange={(e) => financeiroUiActions.setTabs({ letterSpacing: Number(e.target.value || 0) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-tabs-icon-size">Tamanho Ícone</Label>
                <Input id="ui-tabs-icon-size" type="number" min={12} max={32}
                  value={tabs.iconSize ?? 16}
                  onChange={(e) => financeiroUiActions.setTabs({ iconSize: Number(e.target.value || 16) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-tabs-left-offset">Offset Esquerda</Label>
                <Input id="ui-tabs-left-offset" type="number" min={0} max={100}
                  value={tabs.leftOffset ?? 0}
                  onChange={(e) => financeiroUiActions.setTabs({ leftOffset: Number(e.target.value || 0) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-tabs-label-offset-y">Offset Label Y</Label>
                <Input id="ui-tabs-label-offset-y" type="number" min={-10} max={10}
                  value={tabs.labelOffsetY ?? 0}
                  onChange={(e) => financeiroUiActions.setTabs({ labelOffsetY: Number(e.target.value || 0) })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Tabela */}
        <Collapsible open={openTable} onOpenChange={setOpenTable}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tabela</span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <ChevronDown className={`h-4 w-4 transition-transform ${openTable ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="mt-3 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <Switch id="ui-table-search" checked={tabela.enableSearch}
                  onCheckedChange={(v) => financeiroUiActions.setTabelaUI({ enableSearch: v })}
                />
                <Label htmlFor="ui-table-search">Busca</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="ui-table-column-toggle" checked={tabela.enableColumnToggle}
                  onCheckedChange={(v) => financeiroUiActions.setTabelaUI({ enableColumnToggle: v })}
                />
                <Label htmlFor="ui-table-column-toggle">Toggle Colunas</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="ui-table-pagination" checked={tabela.showPagination}
                  onCheckedChange={(v) => financeiroUiActions.setTabelaUI({ showPagination: v })}
                />
                <Label htmlFor="ui-table-pagination">Paginação</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="ui-table-row-selection" checked={tabela.enableRowSelection}
                  onCheckedChange={(v) => financeiroUiActions.setTabelaUI({ enableRowSelection: v })}
                />
                <Label htmlFor="ui-table-row-selection">Seleção de Linhas</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="ui-table-zebra" checked={tabela.enableZebraStripes}
                  onCheckedChange={(v) => financeiroUiActions.setTabelaUI({ enableZebraStripes: v })}
                />
                <Label htmlFor="ui-table-zebra">Zebra Stripes</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="ui-table-page-size">Itens por Página</Label>
                <Input id="ui-table-page-size" type="number" min={5} max={100}
                  value={tabela.pageSize}
                  onChange={(e) => financeiroUiActions.setTabelaUI({ pageSize: Number(e.target.value || 10) })}
                />
              </div>
              <div>
                <Label>Modo de Seleção</Label>
                <Select value={tabela.selectionMode} onValueChange={(v: 'single' | 'multiple') => financeiroUiActions.setTabelaUI({ selectionMode: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Única</SelectItem>
                    <SelectItem value="multiple">Múltipla</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ui-table-selection-width">Largura Coluna Seleção</Label>
                <Input id="ui-table-selection-width" type="number" min={30} max={100}
                  value={tabela.selectionColumnWidth ?? 48}
                  onChange={(e) => financeiroUiActions.setTabelaUI({ selectionColumnWidth: Number(e.target.value || 48) })}
                />
              </div>
            </div>

            <h4 className="text-xs font-semibold mt-4">Cabeçalho</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <Label>Fonte</Label>
                <Select value={(tabela.headerFontFamily ?? 'Geist')} onValueChange={(v) => financeiroUiActions.setTabelaUI({ headerFontFamily: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geist">Geist</SelectItem>
                    <SelectItem value="Inter">Inter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ui-table-header-size">Tamanho</Label>
                <Input id="ui-table-header-size" type="number" min={10} max={20}
                  value={tabela.headerFontSize}
                  onChange={(e) => financeiroUiActions.setTabelaUI({ headerFontSize: Number(e.target.value || 13) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-table-header-weight">Peso</Label>
                <Select value={(tabela.headerFontWeight ?? '600').toString()} onValueChange={(v) => financeiroUiActions.setTabelaUI({ headerFontWeight: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Normal (400)</SelectItem>
                    <SelectItem value="500">Médio (500)</SelectItem>
                    <SelectItem value="600">Semibold (600)</SelectItem>
                    <SelectItem value="700">Bold (700)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ui-table-header-bg">Cor Fundo</Label>
                <Input id="ui-table-header-bg" type="color" value={tabela.headerBg}
                  onChange={(e) => financeiroUiActions.setTabelaUI({ headerBg: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ui-table-header-text">Cor Texto</Label>
                <Input id="ui-table-header-text" type="color" value={tabela.headerText}
                  onChange={(e) => financeiroUiActions.setTabelaUI({ headerText: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ui-table-header-tracking">Espaçamento</Label>
                <Input id="ui-table-header-tracking" type="number" step={0.5} min={-5} max={20}
                  value={tabela.headerLetterSpacing ?? 0}
                  onChange={(e) => financeiroUiActions.setTabelaUI({ headerLetterSpacing: Number(e.target.value || 0) })}
                />
              </div>
            </div>

            <h4 className="text-xs font-semibold mt-4">Células</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <Label>Fonte</Label>
                <Select value={(tabela.cellFontFamily ?? 'Geist')} onValueChange={(v) => financeiroUiActions.setTabelaUI({ cellFontFamily: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geist">Geist</SelectItem>
                    <SelectItem value="Inter">Inter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ui-table-cell-size">Tamanho</Label>
                <Input id="ui-table-cell-size" type="number" min={10} max={20}
                  value={tabela.cellFontSize}
                  onChange={(e) => financeiroUiActions.setTabelaUI({ cellFontSize: Number(e.target.value || 13) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-table-cell-weight">Peso</Label>
                <Select value={(tabela.cellFontWeight ?? '400').toString()} onValueChange={(v) => financeiroUiActions.setTabelaUI({ cellFontWeight: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Normal (400)</SelectItem>
                    <SelectItem value="500">Médio (500)</SelectItem>
                    <SelectItem value="600">Semibold (600)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ui-table-cell-text">Cor Texto</Label>
                <Input id="ui-table-cell-text" type="color" value={tabela.cellText}
                  onChange={(e) => financeiroUiActions.setTabelaUI({ cellText: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ui-table-cell-tracking">Espaçamento</Label>
                <Input id="ui-table-cell-tracking" type="number" step={0.5} min={-5} max={20}
                  value={tabela.cellLetterSpacing ?? 0}
                  onChange={(e) => financeiroUiActions.setTabelaUI({ cellLetterSpacing: Number(e.target.value || 0) })}
                />
              </div>
            </div>

            <h4 className="text-xs font-semibold mt-4">Bordas e Cores</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="ui-table-border-color">Cor da Borda</Label>
                <Input id="ui-table-border-color" type="color" value={tabela.borderColor ?? '#e5e7eb'}
                  onChange={(e) => financeiroUiActions.setTabelaUI({ borderColor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ui-table-border-width">Largura da Borda</Label>
                <Input id="ui-table-border-width" type="number" min={0} max={5}
                  value={tabela.borderWidth ?? 1}
                  onChange={(e) => financeiroUiActions.setTabelaUI({ borderWidth: Number(e.target.value || 1) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-table-alternate-bg">Cor Linhas Alternadas</Label>
                <Input id="ui-table-alternate-bg" type="color" value={tabela.rowAlternateBgColor ?? '#fafafa'}
                  onChange={(e) => financeiroUiActions.setTabelaUI({ rowAlternateBgColor: e.target.value })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Layout */}
        <Collapsible open={openLayout} onOpenChange={setOpenLayout}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Layout</span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <ChevronDown className={`h-4 w-4 transition-transform ${openLayout ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="mt-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="ui-layout-mb-title">Margem Título (px)</Label>
                <Input id="ui-layout-mb-title" type="number" min={0} max={100}
                  value={layout.mbTitle}
                  onChange={(e) => financeiroUiActions.setLayout({ mbTitle: Number(e.target.value || 16) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-layout-mb-tabs">Margem Tabs (px)</Label>
                <Input id="ui-layout-mb-tabs" type="number" min={0} max={100}
                  value={layout.mbTabs}
                  onChange={(e) => financeiroUiActions.setLayout({ mbTabs: Number(e.target.value || 16) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-layout-mb-table">Margem Tabela (px)</Label>
                <Input id="ui-layout-mb-table" type="number" min={0} max={100}
                  value={layout.mbTable}
                  onChange={(e) => financeiroUiActions.setLayout({ mbTable: Number(e.target.value || 24) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-layout-content-gap">Gap Topo Conteúdo (px)</Label>
                <Input id="ui-layout-content-gap" type="number" min={0} max={100}
                  value={layout.contentTopGap ?? 8}
                  onChange={(e) => financeiroUiActions.setLayout({ contentTopGap: Number(e.target.value || 8) })}
                />
              </div>
              <div>
                <Label htmlFor="ui-layout-content-bg">Cor Fundo Conteúdo</Label>
                <Input id="ui-layout-content-bg" type="color" value={layout.contentBg ?? '#f9fafb'}
                  onChange={(e) => financeiroUiActions.setLayout({ contentBg: e.target.value })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}

