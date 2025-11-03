"use client"

import { useMemo, useState } from 'react'
import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import { List } from 'lucide-react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'

type FontWeight = '300' | '400' | '500' | '600' | '700' | '800' | '900'

const FONT_OPTIONS = [
  'PT Serif',
  'Noto Serif',
  'Libre Baskerville',
  'Crimson Text',
  'Amiri',
  'Radley',
  'Geist',
  'Inter',
  'Georgia',
] as const

function fontVar(name?: string) {
  if (!name) return undefined
  if (name === 'Inter') return 'var(--font-inter)'
  if (name === 'Geist') return 'var(--font-geist-sans)'
  if (name === 'PT Serif') return 'var(--font-pt-serif)'
  if (name === 'Noto Serif') return 'var(--font-noto-serif)'
  if (name === 'Libre Baskerville') return 'var(--font-libre-baskerville)'
  if (name === 'Crimson Text') return 'var(--font-crimson-text)'
  if (name === 'Amiri') return 'var(--font-amiri)'
  if (name === 'Radley') return 'var(--font-radley)'
  return name
}

export default function BigQueryEmpresaUILikePage() {
  const [selected, setSelected] = useState<string>('tab1')

  // Title controls
  const [titleFamily, setTitleFamily] = useState<typeof FONT_OPTIONS[number]>('Geist')
  const [titleSize, setTitleSize] = useState<number>(24)
  const [titleWeight, setTitleWeight] = useState<FontWeight>('600')
  const [titleColor, setTitleColor] = useState<string>('#111827')
  const [titleLSPercent, setTitleLSPercent] = useState<number>(0)

  // Subtitle controls
  const [subFamily, setSubFamily] = useState<typeof FONT_OPTIONS[number]>('Geist')
  const [subSize, setSubSize] = useState<number>(14)
  const [subWeight, setSubWeight] = useState<FontWeight>('400')
  const [subColor, setSubColor] = useState<string>('#6b7280')
  const [subLSPercent, setSubLSPercent] = useState<number>(0)

  // Tabs controls (títulos das tabs)
  const [tabsFamily, setTabsFamily] = useState<typeof FONT_OPTIONS[number]>('Geist')
  const [tabsSize, setTabsSize] = useState<number>(15)
  const [tabsWeight, setTabsWeight] = useState<FontWeight>('400')
  const [tabsColor, setTabsColor] = useState<string>('rgb(128, 128, 128)')
  const [tabsLSPercent, setTabsLSPercent] = useState<number>(0)

  const titleLSPx = Math.round((titleSize * titleLSPercent) / 100)
  const subLSPx = Math.round((subSize * subLSPercent) / 100)
  const tabsLSPx = Math.round((tabsSize * tabsLSPercent) / 100)

  const iconFor = () => <List className="h-4 w-4" />
  const tabs: Opcao[] = useMemo(
    () => [
      { value: 'tab1', label: 'Resumo', icon: iconFor() },
      { value: 'tab2', label: 'Filiais', icon: iconFor() },
      { value: 'tab3', label: 'Departamentos', icon: iconFor() },
      { value: 'tab4', label: 'Cargos', icon: iconFor() },
      { value: 'tab5', label: 'Outros', icon: iconFor() },
    ],
    []
  )

  // Cor de fundo geral igual ao módulo Empresa (cinza claro)
  const pageBg = 'rgb(253, 253, 253)'

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-y-auto" style={{ background: pageBg }}>
        {/* Topo: fundo branco com título/subtítulo e tabs com borda */}
        <div style={{ background: 'white' }}>
          <div style={{ marginBottom: 16 }}>
            <PageHeader
              title="Empresa"
              subtitle="Selecione uma opção para visualizar os dados"
              titleFontFamily={fontVar(titleFamily)}
              titleFontSize={titleSize}
              titleFontWeight={titleWeight}
              titleColor={titleColor}
              titleLetterSpacing={titleLSPx}
              subtitleFontFamily={fontVar(subFamily)}
              subtitleFontSize={subSize}
              subtitleFontWeight={subWeight}
              subtitleColor={subColor}
              subtitleLetterSpacing={subLSPx}
            />
          </div>
          <div style={{ marginBottom: 0 }}>
            <TabsNav
              options={tabs}
              value={selected}
              onValueChange={setSelected}
              fontFamily={fontVar(tabsFamily)}
              fontSize={tabsSize}
              fontWeight={tabsWeight}
              color={tabsColor}
              letterSpacing={tabsLSPx}
              iconSize={16}
              startOffset={20}
              labelOffsetY={6}
              activeColor="rgb(41, 41, 41)"
              activeFontWeight={tabsWeight}
              activeBorderColor="rgb(41, 41, 41)"
              className="px-0 md:px-0"
            />
          </div>
        </div>

        {/* Abaixo das tabs: área cinza clara com seletores tipográficos */}
        <div className="flex-1">
          <div className="px-4 md:px-6 py-4 space-y-6">
          {/* Título */}
          <div className="bg-white border rounded p-4">
            <div className="text-sm font-medium mb-3">Título</div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="text-xs text-gray-600">Fonte (família)</label>
                <select className="w-full border rounded px-2 py-1 text-sm" value={titleFamily} onChange={(e) => setTitleFamily(e.target.value as typeof FONT_OPTIONS[number])}>
                  {Array.from(FONT_OPTIONS).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Tamanho (px)</label>
                <input type="number" min={8} max={64} className="w-full border rounded px-2 py-1 text-sm" value={titleSize} onChange={(e) => setTitleSize(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Espaçamento (%)</label>
                <input type="number" min={-20} max={100} className="w-full border rounded px-2 py-1 text-sm" value={titleLSPercent} onChange={(e) => setTitleLSPercent(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Peso</label>
                <select className="w-full border rounded px-2 py-1 text-sm" value={titleWeight} onChange={(e) => setTitleWeight(e.target.value as FontWeight)}>
                  {['300','400','500','600','700','800','900'].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Cor</label>
                <input type="color" className="w-full border rounded h-9" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Subtítulo */}
          <div className="bg-white border rounded p-4">
            <div className="text-sm font-medium mb-3">Subtítulo</div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="text-xs text-gray-600">Fonte (família)</label>
                <select className="w-full border rounded px-2 py-1 text-sm" value={subFamily} onChange={(e) => setSubFamily(e.target.value as typeof FONT_OPTIONS[number])}>
                  {Array.from(FONT_OPTIONS).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Tamanho (px)</label>
                <input type="number" min={8} max={48} className="w-full border rounded px-2 py-1 text-sm" value={subSize} onChange={(e) => setSubSize(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Espaçamento (%)</label>
                <input type="number" min={-20} max={100} className="w-full border rounded px-2 py-1 text-sm" value={subLSPercent} onChange={(e) => setSubLSPercent(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Peso</label>
                <select className="w-full border rounded px-2 py-1 text-sm" value={subWeight} onChange={(e) => setSubWeight(e.target.value as FontWeight)}>
                  {['300','400','500','600','700','800','900'].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Cor</label>
                <input type="color" className="w-full border rounded h-9" value={subColor} onChange={(e) => setSubColor(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Títulos das Tabs */}
          <div className="bg-white border rounded p-4">
            <div className="text-sm font-medium mb-3">Títulos das Tabs</div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="text-xs text-gray-600">Fonte (família)</label>
                <select className="w-full border rounded px-2 py-1 text-sm" value={tabsFamily} onChange={(e) => setTabsFamily(e.target.value as typeof FONT_OPTIONS[number])}>
                  {Array.from(FONT_OPTIONS).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Tamanho (px)</label>
                <input type="number" min={8} max={32} className="w-full border rounded px-2 py-1 text-sm" value={tabsSize} onChange={(e) => setTabsSize(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Espaçamento (%)</label>
                <input type="number" min={-20} max={100} className="w-full border rounded px-2 py-1 text-sm" value={tabsLSPercent} onChange={(e) => setTabsLSPercent(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Peso</label>
                <select className="w-full border rounded px-2 py-1 text-sm" value={tabsWeight} onChange={(e) => setTabsWeight(e.target.value as FontWeight)}>
                  {['300','400','500','600','700','800','900'].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Cor</label>
                <input type="color" className="w-full border rounded h-9" value={tabsColor} onChange={(e) => setTabsColor(e.target.value)} />
              </div>
            </div>
          </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
