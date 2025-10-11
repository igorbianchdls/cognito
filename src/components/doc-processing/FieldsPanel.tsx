'use client';

import { MoreVertical } from 'lucide-react';

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

// Dados de exemplo hardcoded (depois vamos substituir por dados da IA)
const mockFields = [
  { key: 'Invoice id', value: '1234567890', color: 'bg-purple-500' },
  { key: 'Invoice date', value: '2022-08-07', color: 'bg-purple-500' },
  { key: 'Payment terms', value: 'Net 30', color: 'bg-gray-700' },
  { key: 'Supplier address', value: '800 Bellevue Way NE Bellevue, WA 98004', color: 'bg-teal-500' },
  { key: 'Supplier email', value: 'support@super.ai', color: 'bg-pink-500' },
  { key: 'Supplier name', value: 'Super.AI', color: 'bg-yellow-500' },
  { key: 'Supplier phone', value: '+123-456-7890', color: 'bg-pink-500' },
  { key: 'Receiver address', value: '123 Anywhere St., Any City, ST 12345', color: 'bg-orange-500' },
  { key: 'Receiver email', value: 'hello@reallygreatsite.com', color: 'bg-pink-500' },
  { key: 'Receiver name', value: 'Marceline Anderson', color: 'bg-yellow-500' },
  { key: 'Receiver phone', value: '+123-456-7890', color: 'bg-pink-500' },
  { key: 'Net amount', value: '1,735', color: 'bg-teal-500' },
  { key: 'Total amount', value: '1,680', color: 'bg-teal-500' },
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
  // Usar mockFields como template fixo e preencher com valores extraídos se disponíveis
  const fields = mockFields.map((mockField) => {
    // Tentar encontrar valor extraído correspondente (match case-insensitive)
    const extracted = extractedFields?.find(
      (ef) => ef.key.toLowerCase().replace(/\s/g, '') === mockField.key.toLowerCase().replace(/\s/g, '')
    );

    return {
      key: mockField.key,
      value: extracted?.value || (isProcessing ? '...' : ''),
      color: mockField.color,
    };
  });

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
            {/* Table Header */}
            <div className="grid grid-cols-[1fr,2fr,auto] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <div>Key</div>
              <div>Value</div>
              <div className="w-6"></div>
            </div>

            {/* Fields */}
            <div className="divide-y divide-gray-200">
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr,2fr,auto] gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group"
                >
                  {/* Key with color indicator */}
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-6 ${field.color} rounded`}></div>
                    <span className="text-sm text-gray-700">{field.key}</span>
                  </div>

                  {/* Value */}
                  <div className="text-sm text-gray-900 font-medium">
                    {field.value}
                  </div>

                  {/* Actions */}
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-gray-900">
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
