'use client';

import { MoreVertical } from 'lucide-react';

interface FieldsPanelProps {
  hasDocument: boolean;
  isProcessing: boolean;
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

export default function FieldsPanel({ hasDocument, isProcessing }: FieldsPanelProps) {
  if (!hasDocument) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No document uploaded</p>
          <p className="text-sm mt-2">Upload a document to see extracted fields</p>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="animate-pulse">
            <p className="text-lg font-medium">Extracting fields...</p>
            <p className="text-sm mt-2">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

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
              {mockFields.map((field, index) => (
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
