'use client'

import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import DropZone from '../builder/DropZone'
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
  }, []) // Só na inicialização

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
      {/* Test DropZone - usando estado local como datasets */}
      <DropZone
        id="test-kpi-value-drop-zone"
        label="🧪 TESTE - Valor KPI (Estado Local)"
        description="DropZone de teste com useState - deveria funcionar"
        icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
        fields={localKpiFields}
        acceptedTypes={['numeric']}
        onRemoveField={handleRemoveField}
      />

      {/* Botão para adicionar campo de teste */}
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