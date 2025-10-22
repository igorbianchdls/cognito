'use client'

import { useMemo } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav from '@/components/modulos/TabsNav'
import DataTable, { type TableData } from '@/components/widgets/Table'
import DataToolbar from '@/components/modulos/DataToolbar'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, $catalogUI, financeiroUiActions } from '@/stores/modulos/financeiroUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { LayoutDashboard, Banknote, CreditCard, ArrowDownCircle } from 'lucide-react'
import OmieIcon from '@/components/icons/OmieIcon'
import BlingIcon from '@/components/icons/BlingIcon'
import TinyIcon from '@/components/icons/TinyIcon'
import TotvsIcon from '@/components/icons/TotvsIcon'
import RdStationIcon from '@/components/icons/RdStationIcon'
import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon'
import MetaIcon from '@/components/icons/MetaIcon'
import GoogleAnalyticsIcon from '@/components/icons/GoogleAnalyticsIcon'
import PipedriveIcon from '@/components/icons/PipedriveIcon'
import SalesforceIcon from '@/components/icons/SalesforceIcon'
import HubspotIcon from '@/components/icons/HubspotIcon'
import ContaAzulIcon from '@/components/icons/ContaAzulIcon'
import MercadoLivreIcon from '@/components/icons/MercadoLivreIcon'
import ShopeeIcon from '@/components/icons/ShopeeIcon'
import MagaluIcon from '@/components/icons/MagaluIcon'
import AmazonIcon from '@/components/icons/AmazonIcon'

type Row = TableData

export default function ModulosFinanceiroPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)
  const catalogUI = useStore($catalogUI)

  const fontVar = (name?: string) => {
    if (!name) return undefined
    if (name === 'Inter') return 'var(--font-inter)'
    if (name === 'Geist') return 'var(--font-geist-sans)'
    return name
  }

  const { columns, data } = useMemo((): { columns: ColumnDef<Row>[]; data: Row[] } => {
    switch (tabs.selected) {
      case 'contas':
        return {
          columns: [
            { accessorKey: 'banco', header: 'Banco' },
            { accessorKey: 'agencia', header: 'Agência' },
            { accessorKey: 'conta', header: 'Conta' },
            { accessorKey: 'saldo', header: 'Saldo' },
          ],
          data: [
            { banco: 'Banco A', agencia: '0001', conta: '12345-6', saldo: 15234.9 },
            { banco: 'Banco B', agencia: '0002', conta: '98765-4', saldo: 834.12 },
          ],
        }
      case 'pagamentos':
        return {
          columns: [
            { accessorKey: 'fornecedor', header: 'Fornecedor' },
            { accessorKey: 'documento', header: 'Documento' },
            { accessorKey: 'vencimento', header: 'Vencimento' },
            { accessorKey: 'valor', header: 'Valor' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { fornecedor: 'ACME Ltda', documento: 'NF 123', vencimento: '2025-10-30', valor: 1200.5, status: 'Pendente' },
            { fornecedor: 'Supply Co', documento: 'NF 456', vencimento: '2025-11-05', valor: 349.9, status: 'Pago' },
          ],
        }
      case 'recebimentos':
        return {
          columns: [
            { accessorKey: 'cliente', header: 'Cliente' },
            { accessorKey: 'pedido', header: 'Pedido' },
            { accessorKey: 'data', header: 'Data' },
            { accessorKey: 'valor', header: 'Valor' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { cliente: 'Cliente X', pedido: 'PO-1001', data: '2025-10-20', valor: 899.0, status: 'Recebido' },
            { cliente: 'Cliente Y', pedido: 'PO-1002', data: '2025-10-21', valor: 120.0, status: 'Em aberto' },
          ],
        }
      case 'visao':
      default:
        // Catálogos (4 itens por coluna)
        const colA = [
          { Icon: OmieIcon, name: 'Omie', category: 'Assinatura' },
          { Icon: BlingIcon, name: 'Bling', category: 'Assinatura' },
          { Icon: TinyIcon, name: 'Tiny', category: 'Assinatura' },
          { Icon: TotvsIcon, name: 'Totvs', category: 'Licenças' },
        ]
        const colB = [
          { Icon: RdStationIcon, name: 'RD Station', category: 'Assinatura' },
          { Icon: GoogleAdsIcon, name: 'Google Ads', category: 'Mídia Paga - Pesquisa' },
          { Icon: MetaIcon, name: 'Meta Ads', category: 'Mídia Paga - Social' },
          { Icon: GoogleAnalyticsIcon, name: 'Google Analytics', category: 'Analytics' },
        ]
        const colC = [
          { Icon: PipedriveIcon, name: 'Pipedrive', category: 'Assinatura' },
          { Icon: SalesforceIcon, name: 'Salesforce', category: 'Licenças' },
          { Icon: HubspotIcon, name: 'HubSpot', category: 'Assinatura' },
          { Icon: ContaAzulIcon, name: 'ContaAzul', category: 'Assinatura' },
        ]
        const colD = [
          { Icon: MercadoLivreIcon, name: 'Mercado Livre', category: 'Taxas de Venda' },
          { Icon: ShopeeIcon, name: 'Shopee', category: 'Taxas de Venda' },
          { Icon: MagaluIcon, name: 'Magalu', category: 'Taxas de Venda' },
          { Icon: AmazonIcon, name: 'Amazon', category: 'Taxas de Venda' },
        ]

        return {
          columns: [
            {
              accessorKey: 'colA',
              header: 'Omie',
              cell: ({ row }) => {
                const item = colA[row.index]
                const Icon = item.Icon
                const iconSize = catalogUI.iconSize ?? 40
                const gap = catalogUI.iconTextGap ?? 12
                return (
                  <div className="flex items-center">
                    <div
                      className="flex items-center justify-center mr-3"
                      style={{
                        width: iconSize,
                        height: iconSize,
                        borderRadius: (catalogUI.iconBorderRadius ?? 8),
                        overflow: 'hidden',
                      }}
                    >
                      <Icon className="w-full h-full" />
                    </div>
                    <div style={{ marginLeft: Math.max(0, gap - 12) }}>
                      <div
                        style={{
                          fontFamily: catalogUI.itemTitleFontFamily && catalogUI.itemTitleFontFamily !== 'inherit' ? fontVar(catalogUI.itemTitleFontFamily) : undefined,
                          fontSize: (catalogUI.itemTitleFontSize ?? 15),
                          fontWeight: (catalogUI.itemTitleFontWeight as React.CSSProperties['fontWeight']) ?? '600',
                          color: catalogUI.itemTitleColor ?? '#111827',
                          letterSpacing: typeof catalogUI.itemTitleLetterSpacing === 'number' ? `${catalogUI.itemTitleLetterSpacing}px` : undefined,
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontFamily: catalogUI.itemSubtitleFontFamily && catalogUI.itemSubtitleFontFamily !== 'inherit' ? fontVar(catalogUI.itemSubtitleFontFamily) : undefined,
                          fontSize: (catalogUI.itemSubtitleFontSize ?? 12),
                          fontWeight: (catalogUI.itemSubtitleFontWeight as React.CSSProperties['fontWeight']) ?? '400',
                          color: catalogUI.itemSubtitleColor ?? '#6b7280',
                          letterSpacing: typeof catalogUI.itemSubtitleLetterSpacing === 'number' ? `${catalogUI.itemSubtitleLetterSpacing}px` : undefined,
                        }}
                      >
                        {item.category}
                      </div>
                    </div>
                  </div>
                )
              },
            },
            {
              accessorKey: 'colB',
              header: 'RD Station',
              cell: ({ row }) => {
                const item = colB[row.index]
                const Icon = item.Icon
                const iconSize = catalogUI.iconSize ?? 40
                const gap = catalogUI.iconTextGap ?? 12
                return (
                  <div className="flex items-center">
                    <div
                      className="flex items-center justify-center mr-3"
                      style={{
                        width: iconSize,
                        height: iconSize,
                        borderRadius: (catalogUI.iconBorderRadius ?? 8),
                        overflow: 'hidden',
                      }}
                    >
                      <Icon className="w-full h-full" />
                    </div>
                    <div style={{ marginLeft: Math.max(0, gap - 12) }}>
                      <div
                        style={{
                          fontFamily: catalogUI.itemTitleFontFamily && catalogUI.itemTitleFontFamily !== 'inherit' ? fontVar(catalogUI.itemTitleFontFamily) : undefined,
                          fontSize: (catalogUI.itemTitleFontSize ?? 15),
                          fontWeight: (catalogUI.itemTitleFontWeight as React.CSSProperties['fontWeight']) ?? '600',
                          color: catalogUI.itemTitleColor ?? '#111827',
                          letterSpacing: typeof catalogUI.itemTitleLetterSpacing === 'number' ? `${catalogUI.itemTitleLetterSpacing}px` : undefined,
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontFamily: catalogUI.itemSubtitleFontFamily && catalogUI.itemSubtitleFontFamily !== 'inherit' ? fontVar(catalogUI.itemSubtitleFontFamily) : undefined,
                          fontSize: (catalogUI.itemSubtitleFontSize ?? 12),
                          fontWeight: (catalogUI.itemSubtitleFontWeight as React.CSSProperties['fontWeight']) ?? '400',
                          color: catalogUI.itemSubtitleColor ?? '#6b7280',
                          letterSpacing: typeof catalogUI.itemSubtitleLetterSpacing === 'number' ? `${catalogUI.itemSubtitleLetterSpacing}px` : undefined,
                        }}
                      >
                        {item.category}
                      </div>
                    </div>
                  </div>
                )
              },
            },
            {
              accessorKey: 'colC',
              header: 'Pipedrive',
              cell: ({ row }) => {
                const item = colC[row.index]
                const Icon = item.Icon
                const iconSize = catalogUI.iconSize ?? 40
                const gap = catalogUI.iconTextGap ?? 12
                return (
                  <div className="flex items-center">
                    <div
                      className="flex items-center justify-center mr-3"
                      style={{
                        width: iconSize,
                        height: iconSize,
                        borderRadius: (catalogUI.iconBorderRadius ?? 8),
                        overflow: 'hidden',
                      }}
                    >
                      <Icon className="w-full h-full" />
                    </div>
                    <div style={{ marginLeft: Math.max(0, gap - 12) }}>
                      <div
                        style={{
                          fontFamily: catalogUI.itemTitleFontFamily && catalogUI.itemTitleFontFamily !== 'inherit' ? fontVar(catalogUI.itemTitleFontFamily) : undefined,
                          fontSize: (catalogUI.itemTitleFontSize ?? 15),
                          fontWeight: (catalogUI.itemTitleFontWeight as React.CSSProperties['fontWeight']) ?? '600',
                          color: catalogUI.itemTitleColor ?? '#111827',
                          letterSpacing: typeof catalogUI.itemTitleLetterSpacing === 'number' ? `${catalogUI.itemTitleLetterSpacing}px` : undefined,
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontFamily: catalogUI.itemSubtitleFontFamily && catalogUI.itemSubtitleFontFamily !== 'inherit' ? fontVar(catalogUI.itemSubtitleFontFamily) : undefined,
                          fontSize: (catalogUI.itemSubtitleFontSize ?? 12),
                          fontWeight: (catalogUI.itemSubtitleFontWeight as React.CSSProperties['fontWeight']) ?? '400',
                          color: catalogUI.itemSubtitleColor ?? '#6b7280',
                          letterSpacing: typeof catalogUI.itemSubtitleLetterSpacing === 'number' ? `${catalogUI.itemSubtitleLetterSpacing}px` : undefined,
                        }}
                      >
                        {item.category}
                      </div>
                    </div>
                  </div>
                )
              },
            },
            {
              accessorKey: 'colD',
              header: 'Mercado Livre',
              cell: ({ row }) => {
                const item = colD[row.index]
                const Icon = item.Icon
                const iconSize = catalogUI.iconSize ?? 40
                const gap = catalogUI.iconTextGap ?? 12
                return (
                  <div className="flex items-center">
                    <div
                      className="flex items-center justify-center mr-3"
                      style={{
                        width: iconSize,
                        height: iconSize,
                        borderRadius: (catalogUI.iconBorderRadius ?? 8),
                        overflow: 'hidden',
                      }}
                    >
                      <Icon className="w-full h-full" />
                    </div>
                    <div style={{ marginLeft: Math.max(0, gap - 12) }}>
                      <div
                        style={{
                          fontFamily: catalogUI.itemTitleFontFamily && catalogUI.itemTitleFontFamily !== 'inherit' ? fontVar(catalogUI.itemTitleFontFamily) : undefined,
                          fontSize: (catalogUI.itemTitleFontSize ?? 15),
                          fontWeight: (catalogUI.itemTitleFontWeight as React.CSSProperties['fontWeight']) ?? '600',
                          color: catalogUI.itemTitleColor ?? '#111827',
                          letterSpacing: typeof catalogUI.itemTitleLetterSpacing === 'number' ? `${catalogUI.itemTitleLetterSpacing}px` : undefined,
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontFamily: catalogUI.itemSubtitleFontFamily && catalogUI.itemSubtitleFontFamily !== 'inherit' ? fontVar(catalogUI.itemSubtitleFontFamily) : undefined,
                          fontSize: (catalogUI.itemSubtitleFontSize ?? 12),
                          fontWeight: (catalogUI.itemSubtitleFontWeight as React.CSSProperties['fontWeight']) ?? '400',
                          color: catalogUI.itemSubtitleColor ?? '#6b7280',
                          letterSpacing: typeof catalogUI.itemSubtitleLetterSpacing === 'number' ? `${catalogUI.itemSubtitleLetterSpacing}px` : undefined,
                        }}
                      >
                        {item.category}
                      </div>
                    </div>
                  </div>
                )
              },
            },
          ],
          data: Array.from({ length: 4 }).map((_, i) => ({ colA: i, colB: i, colC: i, colD: i })),
        }
    }
  }, [tabs.selected, catalogUI])

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'visao':
          return <LayoutDashboard className="h-4 w-4" />
        case 'contas':
          return <Banknote className="h-4 w-4" />
        case 'pagamentos':
          return <CreditCard className="h-4 w-4" />
        case 'recebimentos':
          return <ArrowDownCircle className="h-4 w-4" />
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
        {/* Conteúdo abaixo das tabs com cor de fundo */}
        <div style={{ background: layout.contentBg, paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
          {/* Toolbar direita (paginador + botão) */}
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
