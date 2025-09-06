'use client'

import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import type { TableConfig } from '@/types/apps/tableWidgets'

interface TableBehaviorAccordionProps {
  styling: TableConfig
  onConfigChange: (field: string, value: unknown) => void
}

export default function TableBehaviorAccordion({ 
  styling, 
  onConfigChange 
}: TableBehaviorAccordionProps) {

  // Verificação de segurança para evitar erros de client-side
  if (!onConfigChange) {
    console.warn('TableBehaviorAccordion: onConfigChange callback is missing')
    return null
  }

  return (
    <AccordionItem value="table-behavior" className="border rounded-lg px-3">
      <AccordionTrigger className="text-xs font-medium hover:no-underline">
        ⚙️ Comportamento
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        
        {/* Display Options */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Opções de Exibição</div>
          
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-xs">
              <Switch
                checked={styling?.showPagination ?? true}
                onCheckedChange={(checked) => onConfigChange('showPagination', checked)}
              />
              <span className="text-gray-600">Mostrar Paginação</span>
            </label>
            
            <label className="flex items-center gap-2 text-xs">
              <Switch
                checked={styling?.enableSearch ?? true}
                onCheckedChange={(checked) => onConfigChange('enableSearch', checked)}
              />
              <span className="text-gray-600">Habilitar Busca</span>
            </label>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-xs">
              <Switch
                checked={styling?.showColumnToggle ?? true}
                onCheckedChange={(checked) => onConfigChange('showColumnToggle', checked)}
              />
              <span className="text-gray-600">Toggle de Colunas</span>
            </label>
            
            <label className="flex items-center gap-2 text-xs">
              <Switch
                checked={styling?.enableFiltering ?? false}
                onCheckedChange={(checked) => onConfigChange('enableFiltering', checked)}
              />
              <span className="text-gray-600">Habilitar Filtros</span>
            </label>
          </div>
        </div>

        {/* Row Selection */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Seleção de Linhas</div>
          
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={styling?.enableRowSelection ?? false}
              onCheckedChange={(checked) => onConfigChange('enableRowSelection', checked)}
            />
            <span className="text-gray-600">Habilitar Seleção de Linhas</span>
          </label>
          
          {(styling?.enableRowSelection ?? false) && (
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Modo de Seleção</div>
              <Select
                value={styling?.selectionMode || 'single'}
                onValueChange={(value) => onConfigChange('selectionMode', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Seleção Simples</SelectItem>
                  <SelectItem value="multiple">Seleção Múltipla</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Sorting Options */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Ordenação</div>
          
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={styling?.enableSorting ?? true}
              onCheckedChange={(checked) => onConfigChange('enableSorting', checked)}
            />
            <span className="text-gray-600">Habilitar Ordenação</span>
          </label>
          
          {(styling?.enableSorting ?? true) && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Coluna Padrão</div>
                  <Select
                    value={styling?.defaultSortColumn ?? ''}
                    onValueChange={(value) => onConfigChange('defaultSortColumn', value === '' ? undefined : value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      <SelectItem value="id">ID</SelectItem>
                      <SelectItem value="name">Nome</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="created">Criado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500 mb-1">Direção Padrão</div>
                  <Select
                    value={styling?.defaultSortDirection ?? 'asc'}
                    onValueChange={(value) => onConfigChange('defaultSortDirection', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Crescente</SelectItem>
                      <SelectItem value="desc">Decrescente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <label className="flex items-center gap-2 text-xs">
                <Switch
                  checked={styling?.enableMultiSort ?? false}
                  onCheckedChange={(checked) => onConfigChange('enableMultiSort', checked)}
                />
                <span className="text-gray-600">Permitir ordenação múltipla</span>
              </label>
            </>
          )}
        </div>

        {/* Performance Options */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Performance</div>
          
          <div className="space-y-2">
            <div className="text-xs text-gray-500 mb-1">
              Debounce da Busca: {styling?.searchDebounce || 300}ms
            </div>
            <Slider
              value={[styling?.searchDebounce || 300]}
              onValueChange={(value) => onConfigChange('searchDebounce', value[0])}
              max={1000}
              min={0}
              step={50}
              className="w-full"
            />
          </div>
          
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={styling?.enableVirtualization ?? false}
              onCheckedChange={(checked) => onConfigChange('enableVirtualization', checked)}
            />
            <span className="text-gray-600">Virtualização (grandes datasets)</span>
          </label>
        </div>

        {/* Auto-refresh */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Atualização Automática</div>
          
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={styling?.enableAutoRefresh ?? false}
              onCheckedChange={(checked) => onConfigChange('enableAutoRefresh', checked)}
            />
            <span className="text-gray-600">Habilitar auto-refresh</span>
          </label>
          
          {(styling?.enableAutoRefresh ?? false) && (
            <div className="space-y-2">
              <div className="text-xs text-gray-500 mb-1">
                Intervalo: {styling?.autoRefreshInterval || 30}s
              </div>
              <Slider
                value={[styling?.autoRefreshInterval || 30]}
                onValueChange={(value) => onConfigChange('autoRefreshInterval', value[0])}
                max={300}
                min={5}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Responsive Behavior */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Responsividade</div>
          
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={styling?.enableResponsive ?? true}
              onCheckedChange={(checked) => onConfigChange('enableResponsive', checked)}
            />
            <span className="text-gray-600">Layout responsivo</span>
          </label>
          
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={styling?.stackOnMobile ?? false}
              onCheckedChange={(checked) => onConfigChange('stackOnMobile', checked)}
            />
            <span className="text-gray-600">Empilhar colunas no mobile</span>
          </label>
        </div>

      </AccordionContent>
    </AccordionItem>
  )
}