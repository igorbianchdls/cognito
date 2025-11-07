'use client'

import { useState } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import {
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  Package,
  Users,
  Wrench,
  Megaphone,
  Settings,
  TrendingUp,
  BarChart3,
  List,
  Landmark,
  Wallet,
  Activity,
  CheckCheck,
  Plus,
  Trash2
} from 'lucide-react'

// Ícones disponíveis para seleção
const AVAILABLE_ICONS = {
  CreditCard: { component: CreditCard, name: 'CreditCard' },
  ArrowUpCircle: { component: ArrowUpCircle, name: 'ArrowUpCircle' },
  ArrowDownCircle: { component: ArrowDownCircle, name: 'ArrowDownCircle' },
  Package: { component: Package, name: 'Package' },
  Users: { component: Users, name: 'Users' },
  Wrench: { component: Wrench, name: 'Wrench' },
  Megaphone: { component: Megaphone, name: 'Megaphone' },
  Settings: { component: Settings, name: 'Settings' },
  TrendingUp: { component: TrendingUp, name: 'TrendingUp' },
  BarChart3: { component: BarChart3, name: 'BarChart3' },
  List: { component: List, name: 'List' },
  Landmark: { component: Landmark, name: 'Landmark' },
  Wallet: { component: Wallet, name: 'Wallet' },
  Activity: { component: Activity, name: 'Activity' },
  CheckCheck: { component: CheckCheck, name: 'CheckCheck' },
}

type IconName = keyof typeof AVAILABLE_ICONS

interface TabConfig {
  id: string
  label: string
  iconName: IconName
}

export default function UIEditorPage() {
  // PageHeader states
  const [title, setTitle] = useState('Título de Exemplo')
  const [subtitle, setSubtitle] = useState('Descrição do módulo')
  const [titleFontFamily, setTitleFontFamily] = useState('geist')
  const [titleFontSize, setTitleFontSize] = useState(24)
  const [titleFontWeight, setTitleFontWeight] = useState('600')
  const [titleColor, setTitleColor] = useState('#111827')
  const [titleLetterSpacing, setTitleLetterSpacing] = useState(0)
  const [subtitleFontFamily, setSubtitleFontFamily] = useState('default')
  const [subtitleFontSize, setSubtitleFontSize] = useState(14)
  const [subtitleFontWeight, setSubtitleFontWeight] = useState('400')
  const [subtitleColor, setSubtitleColor] = useState('#6b7280')
  const [subtitleLetterSpacing, setSubtitleLetterSpacing] = useState(0)

  // TabsNav states
  const [tabs, setTabs] = useState<TabConfig[]>([
    { id: '1', label: 'Tab 1', iconName: 'CreditCard' },
    { id: '2', label: 'Tab 2', iconName: 'Package' },
    { id: '3', label: 'Tab 3', iconName: 'Users' },
  ])
  const [selectedTab, setSelectedTab] = useState('1')
  const [tabsFontFamily, setTabsFontFamily] = useState('geist')
  const [tabsFontSize, setTabsFontSize] = useState(14)
  const [tabsFontWeight, setTabsFontWeight] = useState('400')
  const [tabsColor, setTabsColor] = useState('#b4b4b4')
  const [tabsLetterSpacing, setTabsLetterSpacing] = useState(0)
  const [tabsIconSize, setTabsIconSize] = useState(16)
  const [tabsActiveColor, setTabsActiveColor] = useState('#111827')
  const [tabsActiveFontWeight, setTabsActiveFontWeight] = useState('400')
  const [tabsActiveBorderColor, setTabsActiveBorderColor] = useState('#111827')

  // Converter tabs para formato Opcao
  const tabsOptions: Opcao[] = tabs.map((tab) => {
    const IconComponent = AVAILABLE_ICONS[tab.iconName].component
    return {
      value: tab.id,
      label: tab.label,
      icon: <IconComponent className="h-4 w-4" />,
    }
  })

  const addTab = () => {
    const newId = String(tabs.length + 1)
    setTabs([...tabs, { id: newId, label: `Tab ${newId}`, iconName: 'List' }])
  }

  const removeTab = (id: string) => {
    if (tabs.length <= 1) return
    setTabs(tabs.filter((t) => t.id !== id))
    if (selectedTab === id) {
      setSelectedTab(tabs[0].id)
    }
  }

  const updateTab = (id: string, field: 'label' | 'iconName', value: string) => {
    setTabs(tabs.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
  }

  // Converter seleção de fonte para variável CSS
  const getFontFamilyVar = (font: string): string | undefined => {
    switch (font) {
      case 'geist':
        return 'var(--font-geist-sans)'
      case 'inter':
        return 'var(--font-inter)'
      case 'geist-mono':
        return 'var(--font-geist-mono)'
      case 'space-mono':
        return 'var(--font-space-mono)'
      case 'georgia':
        return 'Georgia, serif'
      case 'default':
      default:
        return undefined
    }
  }

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-y-auto bg-gray-50">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-2">UI Editor</h1>
            <p className="text-sm text-gray-600">Editor visual para PageHeader e TabsNav</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">Preview</h2>
                <Separator className="mb-6" />

                <div className="border rounded-lg overflow-hidden">
                  <div style={{ background: 'white' }}>
                    <PageHeader
                      title={title}
                      subtitle={subtitle}
                      titleFontFamily={getFontFamilyVar(titleFontFamily)}
                      titleFontSize={titleFontSize}
                      titleFontWeight={titleFontWeight}
                      titleColor={titleColor}
                      titleLetterSpacing={titleLetterSpacing}
                      subtitleFontFamily={getFontFamilyVar(subtitleFontFamily)}
                      subtitleFontSize={subtitleFontSize}
                      subtitleFontWeight={subtitleFontWeight}
                      subtitleColor={subtitleColor}
                      subtitleLetterSpacing={subtitleLetterSpacing}
                    />
                    <TabsNav
                      options={tabsOptions}
                      value={selectedTab}
                      onValueChange={setSelectedTab}
                      fontFamily={getFontFamilyVar(tabsFontFamily)}
                      fontSize={tabsFontSize}
                      fontWeight={tabsFontWeight}
                      color={tabsColor}
                      letterSpacing={tabsLetterSpacing}
                      iconSize={tabsIconSize}
                      activeColor={tabsActiveColor}
                      activeFontWeight={tabsActiveFontWeight}
                      activeBorderColor={tabsActiveBorderColor}
                    />
                  </div>
                  <div className="p-6 bg-gray-50 min-h-[200px] flex items-center justify-center text-gray-500">
                    Conteúdo da tab selecionada: <strong className="ml-2">{tabs.find(t => t.id === selectedTab)?.label}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">Controles</h2>
                <Separator className="mb-6" />

                <Accordion type="multiple" defaultValue={['pageheader', 'tabs', 'tabsstyles']} className="w-full">
                  {/* PageHeader Controls */}
                  <AccordionItem value="pageheader">
                    <AccordionTrigger className="text-sm font-semibold">PageHeader - Título & Subtítulo</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {/* Title */}
                      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase">Título</h4>

                        <div className="space-y-2">
                          <Label className="text-xs">Texto</Label>
                          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Font Family</Label>
                          <Select value={titleFontFamily} onValueChange={setTitleFontFamily}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Padrão</SelectItem>
                              <SelectItem value="geist">Geist</SelectItem>
                              <SelectItem value="inter">Inter</SelectItem>
                              <SelectItem value="geist-mono">Geist Mono</SelectItem>
                              <SelectItem value="space-mono">Space Mono</SelectItem>
                              <SelectItem value="georgia">Georgia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Font Size: {titleFontSize}px</Label>
                          <Slider
                            value={[titleFontSize]}
                            onValueChange={(v) => setTitleFontSize(v[0])}
                            min={10}
                            max={72}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Font Weight</Label>
                          <Select value={titleFontWeight} onValueChange={setTitleFontWeight}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="400">400 (Normal)</SelectItem>
                              <SelectItem value="500">500 (Medium)</SelectItem>
                              <SelectItem value="600">600 (Semibold)</SelectItem>
                              <SelectItem value="700">700 (Bold)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Cor</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={titleColor}
                              onChange={(e) => setTitleColor(e.target.value)}
                              className="w-20 h-10 p-1"
                            />
                            <Input
                              value={titleColor}
                              onChange={(e) => setTitleColor(e.target.value)}
                              placeholder="#111827"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Letter Spacing: {titleLetterSpacing}px</Label>
                          <Slider
                            value={[titleLetterSpacing]}
                            onValueChange={(v) => setTitleLetterSpacing(v[0])}
                            min={-2}
                            max={5}
                            step={0.1}
                          />
                        </div>
                      </div>

                      {/* Subtitle */}
                      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase">Subtítulo</h4>

                        <div className="space-y-2">
                          <Label className="text-xs">Texto</Label>
                          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Font Family</Label>
                          <Select value={subtitleFontFamily} onValueChange={setSubtitleFontFamily}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Padrão</SelectItem>
                              <SelectItem value="geist">Geist</SelectItem>
                              <SelectItem value="inter">Inter</SelectItem>
                              <SelectItem value="geist-mono">Geist Mono</SelectItem>
                              <SelectItem value="space-mono">Space Mono</SelectItem>
                              <SelectItem value="georgia">Georgia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Font Size: {subtitleFontSize}px</Label>
                          <Slider
                            value={[subtitleFontSize]}
                            onValueChange={(v) => setSubtitleFontSize(v[0])}
                            min={10}
                            max={32}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Font Weight</Label>
                          <Select value={subtitleFontWeight} onValueChange={setSubtitleFontWeight}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="400">400 (Normal)</SelectItem>
                              <SelectItem value="500">500 (Medium)</SelectItem>
                              <SelectItem value="600">600 (Semibold)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Cor</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={subtitleColor}
                              onChange={(e) => setSubtitleColor(e.target.value)}
                              className="w-20 h-10 p-1"
                            />
                            <Input
                              value={subtitleColor}
                              onChange={(e) => setSubtitleColor(e.target.value)}
                              placeholder="#6b7280"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Letter Spacing: {subtitleLetterSpacing}px</Label>
                          <Slider
                            value={[subtitleLetterSpacing]}
                            onValueChange={(v) => setSubtitleLetterSpacing(v[0])}
                            min={-2}
                            max={5}
                            step={0.1}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Tabs List */}
                  <AccordionItem value="tabs">
                    <AccordionTrigger className="text-sm font-semibold">TabsNav - Lista de Tabs</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <Button onClick={addTab} disabled={tabs.length >= 8} size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Tab {tabs.length >= 8 && '(máx 8)'}
                      </Button>

                      <div className="space-y-3">
                        {tabs.map((tab, idx) => (
                          <div key={tab.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-gray-700">Tab {idx + 1}</h4>
                              {tabs.length > 1 && (
                                <Button
                                  onClick={() => removeTab(tab.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Label</Label>
                              <Input
                                value={tab.label}
                                onChange={(e) => updateTab(tab.id, 'label', e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Ícone</Label>
                              <Select
                                value={tab.iconName}
                                onValueChange={(v) => updateTab(tab.id, 'iconName', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(AVAILABLE_ICONS).map(([name, { component: Icon }]) => (
                                    <SelectItem key={name} value={name}>
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        <span>{name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* TabsNav Styles */}
                  <AccordionItem value="tabsstyles">
                    <AccordionTrigger className="text-sm font-semibold">TabsNav - Estilos Globais</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-2">
                          <Label className="text-xs">Font Family</Label>
                          <Select value={tabsFontFamily} onValueChange={setTabsFontFamily}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Padrão</SelectItem>
                              <SelectItem value="geist">Geist</SelectItem>
                              <SelectItem value="inter">Inter</SelectItem>
                              <SelectItem value="geist-mono">Geist Mono</SelectItem>
                              <SelectItem value="space-mono">Space Mono</SelectItem>
                              <SelectItem value="georgia">Georgia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Font Size: {tabsFontSize}px</Label>
                          <Slider
                            value={[tabsFontSize]}
                            onValueChange={(v) => setTabsFontSize(v[0])}
                            min={10}
                            max={24}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Font Weight</Label>
                          <Select value={tabsFontWeight} onValueChange={setTabsFontWeight}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="400">400 (Normal)</SelectItem>
                              <SelectItem value="500">500 (Medium)</SelectItem>
                              <SelectItem value="600">600 (Semibold)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Cor (Inativa)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={tabsColor}
                              onChange={(e) => setTabsColor(e.target.value)}
                              className="w-20 h-10 p-1"
                            />
                            <Input
                              value={tabsColor}
                              onChange={(e) => setTabsColor(e.target.value)}
                              placeholder="#6b7280"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Letter Spacing: {tabsLetterSpacing}px</Label>
                          <Slider
                            value={[tabsLetterSpacing]}
                            onValueChange={(v) => setTabsLetterSpacing(v[0])}
                            min={-2}
                            max={5}
                            step={0.1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Icon Size: {tabsIconSize}px</Label>
                          <Slider
                            value={[tabsIconSize]}
                            onValueChange={(v) => setTabsIconSize(v[0])}
                            min={12}
                            max={32}
                            step={1}
                          />
                        </div>

                        <Separator className="my-4" />
                        <h5 className="text-xs font-semibold text-gray-700">Estado Ativo</h5>

                        <div className="space-y-2">
                          <Label className="text-xs">Cor (Ativa)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={tabsActiveColor}
                              onChange={(e) => setTabsActiveColor(e.target.value)}
                              className="w-20 h-10 p-1"
                            />
                            <Input
                              value={tabsActiveColor}
                              onChange={(e) => setTabsActiveColor(e.target.value)}
                              placeholder="#111827"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Font Weight (Ativa)</Label>
                          <Select value={tabsActiveFontWeight} onValueChange={setTabsActiveFontWeight}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="500">500 (Medium)</SelectItem>
                              <SelectItem value="600">600 (Semibold)</SelectItem>
                              <SelectItem value="700">700 (Bold)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Cor da Borda (Ativa)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={tabsActiveBorderColor}
                              onChange={(e) => setTabsActiveBorderColor(e.target.value)}
                              className="w-20 h-10 p-1"
                            />
                            <Input
                              value={tabsActiveBorderColor}
                              onChange={(e) => setTabsActiveBorderColor(e.target.value)}
                              placeholder="#111827"
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
