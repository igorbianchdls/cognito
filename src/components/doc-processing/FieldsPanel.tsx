'use client';

import { useState, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExtractedField {
  key: string;
  value: string;
  confidence?: number;
}

interface FieldsPanelProps {
  hasDocument: boolean;
  isProcessing: boolean;
  extractedFields?: ExtractedField[];
  summary?: string;
}

// Campos genéricos para documentos fiscais brasileiros (NF-e, Boletos, Recibos, Faturas)
const mockFields = [
  { key: 'Tipo de documento', value: '', color: 'bg-purple-500' },
  { key: 'Número do documento', value: '', color: 'bg-blue-500' },
  { key: 'Série', value: '', color: 'bg-indigo-500' },
  { key: 'Chave de acesso', value: '', color: 'bg-teal-500' },
  { key: 'Código de barras', value: '', color: 'bg-teal-500' },
  { key: 'Data de emissão', value: '', color: 'bg-purple-500' },
  { key: 'Data de vencimento', value: '', color: 'bg-purple-500' },
  { key: 'Valor total', value: '', color: 'bg-green-500' },
  { key: 'Nome do emitente', value: '', color: 'bg-orange-500' },
  { key: 'CNPJ/CPF do emitente', value: '', color: 'bg-orange-500' },
  { key: 'Nome do destinatário', value: '', color: 'bg-pink-500' },
  { key: 'CNPJ/CPF do destinatário', value: '', color: 'bg-pink-500' },
  { key: 'Descrição/Observações', value: '', color: 'bg-gray-700' },
  { key: 'Status do documento', value: '', color: 'bg-yellow-500' },
  { key: 'Total de impostos', value: '', color: 'bg-green-500' },
];

// Opções de tipos de documento - Principais documentos usados por PMEs brasileiras
const tiposDocumento = [
  'Nota Fiscal (NF-e)',
  'Nota Fiscal de Serviço (NFS-e)',
  'Boleto',
  'Recibo',
  'Fatura',
  'Duplicata',
  'Ordem de Compra',
  'Pedido de Venda',
  'Contrato',
  'Conta a Pagar',
  'Guia de Imposto',
  'Comprovante de Pagamento',
  'Outro',
];

// Cores para os indicadores dos campos
const colorOptions = [
  'bg-purple-500',
  'bg-teal-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-orange-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-red-500',
  'bg-indigo-500',
];

export default function FieldsPanel({ hasDocument, isProcessing, extractedFields, summary }: FieldsPanelProps) {
  // Estado local para gerenciar valores editáveis dos campos
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Atualizar valores quando novos campos forem extraídos
  useEffect(() => {
    const newValues: Record<string, string> = {};
    mockFields.forEach((mockField) => {
      const extracted = extractedFields?.find(
        (ef) => ef.key.toLowerCase().replace(/\s/g, '') === mockField.key.toLowerCase().replace(/\s/g, '')
      );
      newValues[mockField.key] = extracted?.value || mockField.value;
    });
    setFieldValues(newValues);
  }, [extractedFields]);

  // Função para atualizar valor de um campo específico
  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Usar mockFields como template fixo e preencher com valores do estado
  const fields = mockFields.map((mockField) => ({
    key: mockField.key,
    value: fieldValues[mockField.key] || mockField.value,
    color: mockField.color,
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">FIELDS</h2>
      </div>

      {/* Fields List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
            {/* Fields */}
            <div>
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group"
                >
                  {/* Color indicator */}
                  <div className={`w-2 h-6 ${field.color} rounded-md flex-shrink-0`}></div>

                  {/* Key */}
                  <span className="text-sm text-gray-700 font-semibold w-[200px] flex-shrink-0">{field.key}</span>

                  {/* Value - Select for Tipo de documento, Input for others */}
                  {field.key === 'Tipo de documento' ? (
                    <Select
                      value={field.value}
                      onValueChange={(value) => handleFieldChange(field.key, value)}
                    >
                      <SelectTrigger className="flex-1 bg-white">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposDocumento.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={field.value}
                      readOnly
                      className="bg-white flex-1"
                    />
                  )}

                  {/* Actions */}
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-gray-900 flex-shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
