"use client"

import { useMemo, useState } from 'react'
import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import { List } from 'lucide-react'

export default function BigQueryEmpresaUILikePage() {
  const [selected, setSelected] = useState<string>('tab1')

  const iconFor = () => <List className="h-4 w-4" />
  const tabs: Opcao[] = useMemo(() => (
    [
      { value: 'tab1', label: 'Resumo', icon: iconFor() },
      { value: 'tab2', label: 'Filiais', icon: iconFor() },
      { value: 'tab3', label: 'Departamentos', icon: iconFor() },
      { value: 'tab4', label: 'Cargos', icon: iconFor() },
      { value: 'tab5', label: 'Outros', icon: iconFor() },
    ]
  ), [])

  // Cor de fundo geral igual ao módulo Empresa (cinza claro)
  const pageBg = 'rgb(253, 253, 253)'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: pageBg }}>
      {/* Topo: fundo branco com título/subtítulo e tabs com borda */}
      <div style={{ background: 'white' }}>
        <div style={{ marginBottom: 16 }}>
          <PageHeader
            title="Empresa"
            subtitle="Selecione uma opção para visualizar os dados"
            titleFontFamily="Geist"
            titleFontSize={24}
            titleFontWeight="600"
            titleColor="#111827"
            titleLetterSpacing={0}
          />
        </div>
        <div style={{ marginBottom: 0 }}>
          <TabsNav
            options={tabs}
            value={selected}
            onValueChange={setSelected}
            fontFamily="Geist"
            fontSize={15}
            fontWeight="400"
            color="rgb(128, 128, 128)"
            letterSpacing={0}
            iconSize={16}
            startOffset={20}
            labelOffsetY={6}
            activeColor="rgb(41, 41, 41)"
            activeFontWeight="500"
            activeBorderColor="rgb(41, 41, 41)"
            className="px-0 md:px-0"
          />
        </div>
      </div>

      {/* Abaixo das tabs: área cinza clara, sem conteúdo por enquanto */}
      <div className="flex-1" />
    </div>
  )
}

