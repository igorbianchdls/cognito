'use client'

import { useEffect, useMemo } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav from '@/components/modulos/TabsNav'
import DataTable, { type TableData } from '@/components/widgets/Table'
import DataToolbar from '@/components/modulos/DataToolbar'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, financeiroUiActions } from '@/stores/modulos/financeiroUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { Target, Megaphone, User, UserPlus, ListChecks, Building } from 'lucide-react'

type Row = TableData

export default function ModulosCrmPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    financeiroUiActions.setTitulo({
      title: 'CRM',
      subtitle: 'Selecione uma opção para visualizar os dados',
    })
    financeiroUiActions.setTabs({
      options: [
        { value: 'oportunidades', label: 'Oportunidades' },
        { value: 'campanhas', label: 'Campanhas' },
        { value: 'contatos', label: 'Contatos' },
        { value: 'leads', label: 'Leads' },
        { value: 'atividades', label: 'Atividades' },
        { value: 'contas', label: 'Contas' },
      ],
      selected: 'oportunidades',
    })
  }, [])

  const fontVar = (name?: string) => {
    if (!name) return undefined
    if (name === 'Inter') return 'var(--font-inter)'
    if (name === 'Geist') return 'var(--font-geist-sans)'
    return name
  }

  const { columns, data } = useMemo((): { columns: ColumnDef<Row>[]; data: Row[] } => {
    switch (tabs.selected) {
      case 'oportunidades':
      default:
        return {
          columns: [
            { accessorKey: 'titulo', header: 'Título' },
            { accessorKey: 'conta', header: 'Conta' },
            { accessorKey: 'valor', header: 'Valor (R$)' },
            { accessorKey: 'fase', header: 'Fase' },
            { accessorKey: 'fechamento', header: 'Fechamento Previsto' },
          ],
          data: [
            { titulo: 'Upgrade plano Enterprise', conta: 'ACME', valor: 85000, fase: 'Proposta', fechamento: '2025-11-10' },
            { titulo: 'Implantação CRM', conta: 'Beta Ltda', valor: 32000, fase: 'Qualificação', fechamento: '2025-11-22' },
          ],
        }
      case 'campanhas':
        return {
          columns: [
            { accessorKey: 'nome', header: 'Nome' },
            { accessorKey: 'canal', header: 'Canal' },
            { accessorKey: 'inicio', header: 'Início' },
            { accessorKey: 'fim', header: 'Fim' },
            { accessorKey: 'status', header: 'Status' },
            { accessorKey: 'orcamento', header: 'Orçamento (R$)' },
          ],
          data: [
            { nome: 'Q4 Leads B2B', canal: 'Email', inicio: '2025-10-01', fim: '2025-12-31', status: 'Ativa', orcamento: 15000 },
            { nome: 'Webinar CRM', canal: 'Social', inicio: '2025-11-05', fim: '2025-11-10', status: 'Planejada', orcamento: 3000 },
          ],
        }
      case 'contatos':
        return {
          columns: [
            { accessorKey: 'nome', header: 'Nome' },
            { accessorKey: 'email', header: 'Email' },
            { accessorKey: 'telefone', header: 'Telefone' },
            { accessorKey: 'conta', header: 'Conta' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { nome: 'Paulo Nogueira', email: 'paulo@acme.com', telefone: '(11) 99999-0001', conta: 'ACME', status: 'Ativo' },
            { nome: 'Renata Lima', email: 'renata@beta.com', telefone: '(21) 98888-2222', conta: 'Beta Ltda', status: 'Ativo' },
          ],
        }
      case 'leads':
        return {
          columns: [
            { accessorKey: 'nome', header: 'Nome' },
            { accessorKey: 'email', header: 'Email' },
            { accessorKey: 'origem', header: 'Origem' },
            { accessorKey: 'status', header: 'Status' },
            { accessorKey: 'score', header: 'Score' },
          ],
          data: [
            { nome: 'João Silva', email: 'joao@exemplo.com', origem: 'Landing', status: 'Novo', score: 62 },
            { nome: 'Maria Souza', email: 'maria@exemplo.com', origem: 'Indicação', status: 'Em qualificação', score: 75 },
          ],
        }
      case 'atividades':
        return {
          columns: [
            { accessorKey: 'tipo', header: 'Tipo' },
            { accessorKey: 'assunto', header: 'Assunto' },
            { accessorKey: 'responsavel', header: 'Responsável' },
            { accessorKey: 'data', header: 'Data' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { tipo: 'Ligação', assunto: 'Follow-up proposta', responsavel: 'Ana', data: '2025-10-23', status: 'Concluída' },
            { tipo: 'Reunião', assunto: 'Descoberta', responsavel: 'Carlos', data: '2025-10-24', status: 'Pendente' },
          ],
        }
      case 'contas':
        return {
          columns: [
            { accessorKey: 'conta', header: 'Conta' },
            { accessorKey: 'segmento', header: 'Segmento' },
            { accessorKey: 'cidade', header: 'Cidade' },
            { accessorKey: 'pipeline', header: 'Pipeline (R$)' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { conta: 'ACME', segmento: 'Software', cidade: 'São Paulo', pipeline: 220000, status: 'Ativa' },
            { conta: 'Beta Ltda', segmento: 'Serviços', cidade: 'Curitiba', pipeline: 95000, status: 'Ativa' },
          ],
        }
    }
  }, [tabs.selected])

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'oportunidades':
          return <Target className="h-4 w-4" />
        case 'campanhas':
          return <Megaphone className="h-4 w-4" />
        case 'contatos':
          return <User className="h-4 w-4" />
        case 'leads':
          return <UserPlus className="h-4 w-4" />
        case 'atividades':
          return <ListChecks className="h-4 w-4" />
        case 'contas':
          return <Building className="h-4 w-4" />
        default:
          return null
      }
    }
    return tabs.options.map((opt) => ({ ...opt, icon: iconFor(opt.value) })) as Opcao[]
  }, [tabs.options])

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-y-auto">
        <div style={{ marginBottom: layout.mbTitle }}>
          <PageHeader
            title={titulo.title}
            subtitle={titulo.subtitle}
            titleFontFamily={fontVar(titulo.titleFontFamily)}
            titleFontSize={titulo.titleFontSize}
            titleFontWeight={titulo.titleFontWeight}
            titleColor={titulo.titleColor}
            titleLetterSpacing={titulo.titleLetterSpacing}
          />
        </div>
        <div style={{ marginBottom: 0 }}>
          <TabsNav
            options={tabOptions}
            value={tabs.selected}
            onValueChange={(v) => financeiroUiActions.setTabs({ selected: v })}
            fontFamily={fontVar(tabs.fontFamily)}
            fontSize={tabs.fontSize}
            fontWeight={tabs.fontWeight}
            color={tabs.color}
            letterSpacing={tabs.letterSpacing}
            iconSize={tabs.iconSize}
            labelOffsetY={tabs.labelOffsetY}
            startOffset={tabs.leftOffset}
            activeColor={tabs.activeColor}
            activeFontWeight={tabs.activeFontWeight}
            activeBorderColor={tabs.activeBorderColor}
            className="px-0 md:px-0"
          />
        </div>
        <div style={{ background: layout.contentBg, paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
          <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
            <DataToolbar
              from={data.length === 0 ? 0 : 1}
              to={Math.min(tabelaUI.pageSize, data.length)}
              total={data.length}
              fontFamily={fontVar(toolbarUI.fontFamily)}
              fontSize={toolbarUI.fontSize}
              fontWeight={toolbarUI.fontWeight}
              fontColor={toolbarUI.fontColor}
              letterSpacing={toolbarUI.letterSpacing}
              borderBottomWidth={toolbarUI.borderBottomWidth}
              borderBottomColor={toolbarUI.borderBottomColor}
              borderDistanceTop={toolbarUI.borderDistanceTop}
              underlineColor={toolbarUI.underlineColor}
              underlineWidth={toolbarUI.underlineWidth}
              underlineOffsetTop={toolbarUI.underlineOffsetTop}
              iconGap={toolbarUI.iconGap}
              iconColor={toolbarUI.iconColor}
              iconSize={toolbarUI.iconSize}
              searchWidth={toolbarUI.searchWidth}
              dateRangeWidth={toolbarUI.dateRangeWidth}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-auto" style={{ marginBottom: layout.mbTable }}>
            <div className="border-y bg-background" style={{ borderColor: tabelaUI.borderColor }}>
              <DataTable
                columns={columns}
                data={data}
                enableSearch={tabelaUI.enableSearch}
                showColumnToggle={tabelaUI.enableColumnToggle}
                showPagination={tabelaUI.showPagination}
                pageSize={tabelaUI.pageSize}
                headerBackground={tabelaUI.headerBg}
                headerTextColor={tabelaUI.headerText}
                cellTextColor={tabelaUI.cellText}
                headerFontSize={tabelaUI.headerFontSize}
                headerFontFamily={fontVar(tabelaUI.headerFontFamily)}
                headerFontWeight={tabelaUI.headerFontWeight}
                headerLetterSpacing={tabelaUI.headerLetterSpacing}
                cellFontSize={tabelaUI.cellFontSize}
                cellFontFamily={fontVar(tabelaUI.cellFontFamily)}
                cellFontWeight={tabelaUI.cellFontWeight}
                cellLetterSpacing={tabelaUI.cellLetterSpacing}
                enableZebraStripes={tabelaUI.enableZebraStripes}
                rowAlternateBgColor={tabelaUI.rowAlternateBgColor}
                borderColor={tabelaUI.borderColor}
                borderWidth={tabelaUI.borderWidth}
                selectionColumnWidth={tabelaUI.selectionColumnWidth}
                enableRowSelection={tabelaUI.enableRowSelection}
                selectionMode={tabelaUI.selectionMode}
                defaultSortColumn={tabelaUI.defaultSortColumn}
                defaultSortDirection={tabelaUI.defaultSortDirection}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
