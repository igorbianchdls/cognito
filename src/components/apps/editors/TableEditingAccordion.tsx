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

interface TableEditingAccordionProps {
  styling: TableConfig
  onConfigChange: (field: string, value: unknown) => void
}

export default function TableEditingAccordion({ 
  styling, 
  onConfigChange 
}: TableEditingAccordionProps) {

  return (
    <AccordionItem value="table-editing" className="border rounded-lg px-3">
      <AccordionTrigger className="text-xs font-medium hover:no-underline">
        ✏️ Configurações de Edição
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        
        {/* Enable Editing Mode */}
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-gray-700">Habilitar Edição</div>
          <Switch
            checked={styling?.editableMode ?? false}
            onCheckedChange={(checked) => onConfigChange('editableMode', checked)}
          />
        </div>

        {styling?.editableMode && (
          <>
            {/* Editable Cells Mode */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">Células Editáveis</div>
              <Select
                value={Array.isArray(styling?.editableCells) ? 'selected' : styling?.editableCells || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    onConfigChange('editableCells', 'all')
                  } else if (value === 'selected') {
                    onConfigChange('editableCells', [])
                  } else {
                    onConfigChange('editableCells', 'none')
                  }
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as células</SelectItem>
                  <SelectItem value="selected">Colunas específicas</SelectItem>
                  <SelectItem value="none">Somente leitura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row Actions */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-gray-700">Ações de Linha</div>
              
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={styling?.editableRowActions?.allowAdd ?? true}
                    onCheckedChange={(checked) => 
                      onConfigChange('editableRowActions.allowAdd', checked)
                    }
                  />
                  <span className="text-gray-600">Permitir adicionar linhas</span>
                </label>
                
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={styling?.editableRowActions?.allowDelete ?? true}
                    onCheckedChange={(checked) => 
                      onConfigChange('editableRowActions.allowDelete', checked)
                    }
                  />
                  <span className="text-gray-600">Permitir deletar linhas</span>
                </label>
                
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={styling?.editableRowActions?.allowDuplicate ?? false}
                    onCheckedChange={(checked) => 
                      onConfigChange('editableRowActions.allowDuplicate', checked)
                    }
                  />
                  <span className="text-gray-600">Permitir duplicar linhas</span>
                </label>
              </div>
            </div>

            {/* Validation Options */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-gray-700">Validação</div>
              
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={styling?.enableValidation ?? true}
                  onCheckedChange={(checked) => 
                    onConfigChange('enableValidation', checked)
                  }
                />
                <span className="text-gray-600">Habilitar validação de dados</span>
              </label>
              
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={styling?.showValidationErrors ?? true}
                  onCheckedChange={(checked) => 
                    onConfigChange('showValidationErrors', checked)
                  }
                />
                <span className="text-gray-600">Mostrar erros de validação</span>
              </label>
            </div>

            {/* Save Behavior */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">Comportamento de Salvamento</div>
              <Select
                value={styling?.saveBehavior || 'auto'}
                onValueChange={(value) => onConfigChange('saveBehavior', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Salvar automaticamente</SelectItem>
                  <SelectItem value="manual">Salvar manualmente</SelectItem>
                  <SelectItem value="onBlur">Salvar ao sair da célula</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Edit Triggers */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">Trigger de Edição</div>
              <Select
                value={styling?.editTrigger || 'doubleClick'}
                onValueChange={(value) => onConfigChange('editTrigger', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="click">Clique simples</SelectItem>
                  <SelectItem value="doubleClick">Clique duplo</SelectItem>
                  <SelectItem value="focus">Ao focar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}