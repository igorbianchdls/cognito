'use client'

import { useState, useEffect } from 'react'
import type { BigQueryField } from '../builder/TablesExplorer'
import type { KPIConfig } from '@/types/apps/kpiWidgets'

interface TestDropZoneProps {
  kpiConfig: KPIConfig
  onKPIConfigChange: (field: string, value: unknown) => void
}

export default function TestDropZone({ 
  kpiConfig, 
  onKPIConfigChange 
}: TestDropZoneProps) {
  // Estado local igual ao que funciona no datasets
  const [localKpiFields, setLocalKpiFields] = useState<BigQueryField[]>([])

  // Sincronizar com kpiConfig inicial
  useEffect(() => {
    const initialFields = kpiConfig.bigqueryData?.kpiValueFields || []
    setLocalKpiFields(initialFields)
    console.log('🧪 TestDropZone initialized with fields:', initialFields.length)
  }, [kpiConfig.bigqueryData?.kpiValueFields]) // Sincronizar com mudanças

  // Handler de remoção - igual ao que funciona no datasets
  const handleRemoveField = (fieldName: string) => {
    console.log('🧪 TestDropZone handleRemoveField called:', fieldName)
    
    // Atualizar estado local primeiro (igual datasets)
    setLocalKpiFields(prev => {
      const newFields = prev.filter(f => f.name !== fieldName)
      console.log('🧪 TestDropZone local state updated:', newFields.length)
      return newFields
    })
    
    // Também atualizar o store global
    onKPIConfigChange('bigqueryData.kpiValueFields', [])
    
    console.log('🧪 TestDropZone remove completed')
  }

  // Handler para adicionar campo (para teste)
  const handleAddTestField = () => {
    const testField: BigQueryField = {
      name: `test-field-${Date.now()}`,
      type: 'INTEGER',
      mode: 'NULLABLE'
    }
    
    console.log('🧪 TestDropZone adding test field:', testField.name)
    setLocalKpiFields(prev => [...prev, testField])
  }

  return (
    <div className="space-y-3">
      {/* Custom DropZone HTML - NÃO usa o componente DropZone bugado */}
      <div className="border-2 border-dashed border-purple-300 p-4 rounded-lg bg-purple-50">
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-purple-600">🎯</span>
            <h3 className="text-sm font-medium text-purple-900">🧪 TESTE - Valor KPI (HTML Próprio)</h3>
          </div>
          <p className="text-xs text-purple-700">DropZone com HTML próprio - sem usar DropZone.tsx bugado</p>
        </div>

        <div className="min-h-[60px] flex items-center justify-center">
          {localKpiFields.length === 0 ? (
            <p className="text-purple-500 text-sm">Nenhum campo - clique em &ldquo;Adicionar Campo Teste&rdquo;</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {localKpiFields.map((field) => (
                <div
                  key={field.name}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                >
                  <span className="truncate max-w-[120px]">
                    {field.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('🧪 CUSTOM X button clicked:', field.name)
                      handleRemoveField(field.name)
                    }}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors cursor-pointer"
                    title="Remove field"
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botões de teste */}
      <div className="flex gap-2">
        <button
          onClick={handleAddTestField}
          className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
        >
          🧪 Adicionar Campo Teste
        </button>
        <button
          onClick={() => setLocalKpiFields([])}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          🧪 Limpar Todos
        </button>
      </div>

      {/* Debug info */}
      <div className="text-xs text-gray-500">
        🧪 Local fields: {localKpiFields.length} | 
        Original fields: {kpiConfig.bigqueryData?.kpiValueFields?.length || 0}
      </div>
    </div>
  )
}