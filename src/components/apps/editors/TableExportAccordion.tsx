'use client'

import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TableConfig } from '@/types/apps/tableWidgets'

interface TableExportAccordionProps {
  styling: TableConfig
  onConfigChange: (field: string, value: unknown) => void
}

export default function TableExportAccordion({ 
  styling, 
  onConfigChange 
}: TableExportAccordionProps) {

  const exportFormats = styling?.exportFormats || []

  const handleExportFormatChange = (format: 'csv' | 'excel' | 'pdf', checked: boolean) => {
    const current = styling?.exportFormats || []
    if (checked) {
      if (!current.includes(format)) {
        onConfigChange('exportFormats', [...current, format])
      }
    } else {
      onConfigChange('exportFormats', current.filter(f => f !== format))
    }
  }

  return (
    <AccordionItem value="table-export" className="border rounded-lg px-3">
      <AccordionTrigger className="text-xs font-medium hover:no-underline">
        📤 Exportação
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        
        {/* Enable Export */}
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-gray-700">Habilitar Exportação</div>
          <Switch
            checked={styling?.enableExport !== false}
            onCheckedChange={(checked) => onConfigChange('enableExport', checked)}
          />
        </div>

        {styling?.enableExport !== false && (
          <>
            {/* Export Formats */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-gray-700">Formatos de Exportação</div>
              
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={exportFormats.includes('csv')}
                    onCheckedChange={(checked) => handleExportFormatChange('csv', !!checked)}
                  />
                  <span className="text-gray-600">CSV (Comma-separated values)</span>
                </label>
                
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={exportFormats.includes('excel')}
                    onCheckedChange={(checked) => handleExportFormatChange('excel', !!checked)}
                  />
                  <span className="text-gray-600">Excel (.xlsx)</span>
                </label>
                
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={exportFormats.includes('pdf')}
                    onCheckedChange={(checked) => handleExportFormatChange('pdf', !!checked)}
                  />
                  <span className="text-gray-600">PDF</span>
                </label>
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-gray-700">Opções de Exportação</div>
              
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={styling?.exportSelectedOnly !== false}
                    onCheckedChange={(checked) => onConfigChange('exportSelectedOnly', checked)}
                  />
                  <span className="text-gray-600">Exportar apenas linhas selecionadas</span>
                </label>
                
                <label className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={styling?.exportWithHeaders !== false}
                    onCheckedChange={(checked) => onConfigChange('exportWithHeaders', checked)}
                  />
                  <span className="text-gray-600">Incluir cabeçalhos</span>
                </label>
                
                <label className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={styling?.exportFilteredData !== false}
                    onCheckedChange={(checked) => onConfigChange('exportFilteredData', checked)}
                  />
                  <span className="text-gray-600">Exportar apenas dados filtrados</span>
                </label>
              </div>
            </div>

            {/* Export Button Position */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">Posição do Botão</div>
              <Select
                value={styling?.exportButtonPosition || 'top-right'}
                onValueChange={(value) => onConfigChange('exportButtonPosition', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Superior Esquerda</SelectItem>
                  <SelectItem value="top-right">Superior Direita</SelectItem>
                  <SelectItem value="bottom-left">Inferior Esquerda</SelectItem>
                  <SelectItem value="bottom-right">Inferior Direita</SelectItem>
                  <SelectItem value="custom">Customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* CSV Specific Options */}
            {exportFormats.includes('csv') && (
              <div className="space-y-3">
                <div className="text-xs font-medium text-gray-700">Opções CSV</div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Separador</div>
                    <Select
                      value={styling?.csvSeparator || ','}
                      onValueChange={(value) => onConfigChange('csvSeparator', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=",">Vírgula (,)</SelectItem>
                        <SelectItem value=";">Ponto e vírgula (;)</SelectItem>
                        <SelectItem value="\t">Tab</SelectItem>
                        <SelectItem value="|">Pipe (|)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Encoding</div>
                    <Select
                      value={styling?.csvEncoding || 'utf-8'}
                      onValueChange={(value) => onConfigChange('csvEncoding', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utf-8">UTF-8</SelectItem>
                        <SelectItem value="utf-16">UTF-16</SelectItem>
                        <SelectItem value="iso-8859-1">ISO-8859-1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* PDF Specific Options */}
            {exportFormats.includes('pdf') && (
              <div className="space-y-3">
                <div className="text-xs font-medium text-gray-700">Opções PDF</div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Orientação</div>
                    <Select
                      value={styling?.pdfOrientation || 'landscape'}
                      onValueChange={(value) => onConfigChange('pdfOrientation', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Retrato</SelectItem>
                        <SelectItem value="landscape">Paisagem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Tamanho da Página</div>
                    <Select
                      value={styling?.pdfPageSize || 'a4'}
                      onValueChange={(value) => onConfigChange('pdfPageSize', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="a3">A3</SelectItem>
                        <SelectItem value="letter">Letter</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <label className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={styling?.pdfIncludeTitle !== false}
                    onCheckedChange={(checked) => onConfigChange('pdfIncludeTitle', checked)}
                  />
                  <span className="text-gray-600">Incluir título no PDF</span>
                </label>
              </div>
            )}

            {/* File Naming */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-gray-700">Nomenclatura do Arquivo</div>
              
              <div>
                <div className="text-xs text-gray-500 mb-1">Prefixo do Nome</div>
                <input
                  type="text"
                  value={styling?.exportFilePrefix || 'table_export'}
                  onChange={(e) => onConfigChange('exportFilePrefix', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="table_export"
                />
              </div>
              
              <label className="flex items-center gap-2 text-xs">
                <Switch
                  checked={styling?.exportIncludeTimestamp !== false}
                  onCheckedChange={(checked) => onConfigChange('exportIncludeTimestamp', checked)}
                />
                <span className="text-gray-600">Incluir timestamp no nome</span>
              </label>
            </div>
          </>
        )}

      </AccordionContent>
    </AccordionItem>
  )
}