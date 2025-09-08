'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TableColumn } from '@/types/apps/tableWidgets'

interface TableColumnColorsAccordionProps {
  columns: TableColumn[]
  onColumnUpdate: (columnId: string, updates: Partial<TableColumn>) => void
}

export default function TableColumnColorsAccordion({
  columns,
  onColumnUpdate
}: TableColumnColorsAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedColumnId, setSelectedColumnId] = useState<string>('')
  
  const selectedColumn = columns.find(col => col.id === selectedColumnId)
  
  const handleColorChange = (color: string) => {
    if (selectedColumnId) {
      onColumnUpdate(selectedColumnId, { textColor: color })
    }
  }
  
  const handleResetColor = () => {
    if (selectedColumnId) {
      onColumnUpdate(selectedColumnId, { textColor: undefined })
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-4 h-auto font-normal"
      >
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-500" />
          <span className="font-medium">Cores das Colunas</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {isOpen && (
        <div className="p-4 pt-0 space-y-4 border-t border-gray-100">
          
          {/* Column Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Selecionar Coluna</label>
            <Select
              value={selectedColumnId}
              onValueChange={setSelectedColumnId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha uma coluna..." />
              </SelectTrigger>
              <SelectContent>
                {columns.map((column) => (
                  <SelectItem key={column.id} value={column.id}>
                    {column.header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedColumn && (
            <>
              {/* Text Color */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Cor do Texto</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={selectedColumn.textColor || '#374151'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="h-10 w-20 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={selectedColumn.textColor || '#374151'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="flex-1"
                    placeholder="#374151"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetColor}
                    className="px-3"
                  >
                    Reset
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Preview</label>
                <div className="border border-gray-200 rounded p-3 bg-gray-50">
                  <div className="text-xs text-gray-500 mb-1">Coluna: {selectedColumn.header}</div>
                  <div 
                    className="text-sm font-medium"
                    style={{ color: selectedColumn.textColor || '#374151' }}
                  >
                    Texto de exemplo nesta cor
                  </div>
                </div>
              </div>

              {/* Current Settings */}
              {selectedColumn.textColor && (
                <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  💡 Cor aplicada: <code>{selectedColumn.textColor}</code>
                </div>
              )}
            </>
          )}

          {!selectedColumn && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Selecione uma coluna para configurar as cores
            </div>
          )}
        </div>
      )}
    </div>
  )
}