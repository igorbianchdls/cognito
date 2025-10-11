'use client';

import { useState, useEffect } from 'react';
import { MoreVertical, Save, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

interface Transacao {
  data: string;
  descricao: string;
  valor: string;
  tipo: 'credito' | 'debito';
}

interface FieldsPanelProps {
  hasDocument: boolean;
  isProcessing: boolean;
  extractedFields?: ExtractedField[];
  summary?: string;
  transacoes?: Transacao[];
}

// Mapeamento de campos específicos por tipo de documento
const fieldsByDocumentType: Record<string, Array<{ key: string; value: string; color: string }>> = {
  'Nota Fiscal (NF-e)': [
    { key: 'Número da NF-e', value: '', color: 'bg-blue-500' },
    { key: 'Série', value: '', color: 'bg-indigo-500' },
    { key: 'Chave de acesso', value: '', color: 'bg-teal-500' },
    { key: 'Data de emissão', value: '', color: 'bg-purple-500' },
    { key: 'CFOP', value: '', color: 'bg-yellow-500' },
    { key: 'Emitente', value: '', color: 'bg-orange-500' },
    { key: 'CNPJ/CPF Emitente', value: '', color: 'bg-orange-500' },
    { key: 'Destinatário', value: '', color: 'bg-pink-500' },
    { key: 'CNPJ/CPF Destinatário', value: '', color: 'bg-pink-500' },
    { key: 'Valor total', value: '', color: 'bg-green-500' },
    { key: 'Total de impostos', value: '', color: 'bg-green-500' },
    { key: 'Status', value: '', color: 'bg-yellow-500' },
  ],
  'Recibo': [
    { key: 'Número do recibo', value: '', color: 'bg-blue-500' },
    { key: 'Data', value: '', color: 'bg-purple-500' },
    { key: 'Valor', value: '', color: 'bg-green-500' },
    { key: 'Recebedor', value: '', color: 'bg-orange-500' },
    { key: 'CPF/CNPJ Recebedor', value: '', color: 'bg-orange-500' },
    { key: 'Pagador', value: '', color: 'bg-pink-500' },
    { key: 'CPF/CNPJ Pagador', value: '', color: 'bg-pink-500' },
    { key: 'Descrição/Referente a', value: '', color: 'bg-gray-700' },
  ],
  'Fatura': [
    { key: 'Número da fatura', value: '', color: 'bg-blue-500' },
    { key: 'Data de emissão', value: '', color: 'bg-purple-500' },
    { key: 'Data de vencimento', value: '', color: 'bg-purple-500' },
    { key: 'Cliente', value: '', color: 'bg-pink-500' },
    { key: 'CNPJ/CPF Cliente', value: '', color: 'bg-pink-500' },
    { key: 'Valor total', value: '', color: 'bg-green-500' },
    { key: 'Status', value: '', color: 'bg-yellow-500' },
    { key: 'Observações', value: '', color: 'bg-gray-700' },
  ],
  'Duplicata': [
    { key: 'Número da duplicata', value: '', color: 'bg-blue-500' },
    { key: 'Data de emissão', value: '', color: 'bg-purple-500' },
    { key: 'Data de vencimento', value: '', color: 'bg-purple-500' },
    { key: 'Sacado', value: '', color: 'bg-pink-500' },
    { key: 'CNPJ/CPF Sacado', value: '', color: 'bg-pink-500' },
    { key: 'Valor', value: '', color: 'bg-green-500' },
    { key: 'Praça de pagamento', value: '', color: 'bg-indigo-500' },
  ],
  'Contrato': [
    { key: 'Número do contrato', value: '', color: 'bg-blue-500' },
    { key: 'Contratante', value: '', color: 'bg-orange-500' },
    { key: 'Contratado', value: '', color: 'bg-pink-500' },
    { key: 'Data de início', value: '', color: 'bg-purple-500' },
    { key: 'Data de término', value: '', color: 'bg-purple-500' },
    { key: 'Valor', value: '', color: 'bg-green-500' },
    { key: 'Objeto do contrato', value: '', color: 'bg-gray-700' },
  ],
  'Extrato Bancário': [
    { key: 'Banco', value: '', color: 'bg-blue-500' },
    { key: 'Agência', value: '', color: 'bg-indigo-500' },
    { key: 'Conta', value: '', color: 'bg-indigo-500' },
    { key: 'Período (Data inicial)', value: '', color: 'bg-purple-500' },
    { key: 'Período (Data final)', value: '', color: 'bg-purple-500' },
    { key: 'Saldo inicial', value: '', color: 'bg-green-500' },
    { key: 'Saldo final', value: '', color: 'bg-green-500' },
    { key: 'Total de créditos', value: '', color: 'bg-teal-500' },
    { key: 'Total de débitos', value: '', color: 'bg-red-500' },
  ],
  'Guia de Imposto': [
    { key: 'Tipo de guia', value: '', color: 'bg-yellow-500' },
    { key: 'Código de barras', value: '', color: 'bg-teal-500' },
    { key: 'Período de apuração', value: '', color: 'bg-purple-500' },
    { key: 'Data de vencimento', value: '', color: 'bg-purple-500' },
    { key: 'Contribuinte', value: '', color: 'bg-orange-500' },
    { key: 'CNPJ/CPF', value: '', color: 'bg-orange-500' },
    { key: 'Valor principal', value: '', color: 'bg-green-500' },
    { key: 'Multa/Juros', value: '', color: 'bg-red-500' },
    { key: 'Valor total', value: '', color: 'bg-green-500' },
  ],
};

// Opções de tipos de documento - Principais documentos usados por PMEs brasileiras
const tiposDocumento = [
  'Nota Fiscal (NF-e)',
  'Recibo',
  'Fatura',
  'Duplicata',
  'Contrato',
  'Extrato Bancário',
  'Guia de Imposto',
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

export default function FieldsPanel({ hasDocument, isProcessing, extractedFields, summary, transacoes }: FieldsPanelProps) {
  // Estado local para gerenciar valores editáveis dos campos
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  // Estado para rastrear o tipo de documento selecionado
  const [documentType, setDocumentType] = useState<string>('');
  // Estado de salvamento
  const [isSaving, setIsSaving] = useState(false);
  // Estado para armazenar transações extraídas
  const [extractedTransacoes, setExtractedTransacoes] = useState<Transacao[]>([]);

  // Atualizar valores quando novos campos forem extraídos
  useEffect(() => {
    const newValues: Record<string, string> = {};

    // Primeiro, tentar encontrar o tipo de documento nos campos extraídos
    const extractedType = extractedFields?.find(
      (ef) => ef.key.toLowerCase().replace(/\s/g, '') === 'tipodedocumento'.replace(/\s/g, '')
    );

    if (extractedType?.value && tiposDocumento.includes(extractedType.value)) {
      setDocumentType(extractedType.value);
    }

    // Preencher valores dos campos baseado nos campos extraídos
    extractedFields?.forEach((extracted) => {
      newValues[extracted.key] = extracted.value;
    });

    setFieldValues(newValues);
  }, [extractedFields]);

  // Atualizar transações quando forem extraídas
  useEffect(() => {
    if (transacoes && transacoes.length > 0) {
      setExtractedTransacoes(transacoes);
    }
  }, [transacoes]);

  // Função para atualizar valor de um campo específico
  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Função para atualizar tipo de documento
  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value);
    setFieldValues({}); // Limpar valores ao mudar tipo
  };

  // Obter campos baseados no tipo de documento selecionado
  const getFieldsForType = () => {
    if (!documentType || !fieldsByDocumentType[documentType]) {
      return [];
    }
    return fieldsByDocumentType[documentType];
  };

  // Campos a serem exibidos: sempre mostrar "Tipo de documento" + campos específicos do tipo
  const fields = [
    { key: 'Tipo de documento', value: documentType, color: 'bg-purple-500' },
    ...getFieldsForType().map((field) => ({
      ...field,
      value: fieldValues[field.key] || field.value,
    })),
  ];

  // Função para salvar documento no banco de dados
  const handleSaveDocument = async () => {
    if (!documentType) {
      alert('Por favor, selecione o tipo de documento antes de salvar.');
      return;
    }

    // Converter campos para o formato esperado pela API
    const fieldsToSave = fields
      .filter((field) => field.key !== 'Tipo de documento' && field.value)
      .map((field) => ({
        key: field.key,
        value: field.value,
      }));

    if (fieldsToSave.length === 0) {
      alert('Nenhum campo preenchido para salvar.');
      return;
    }

    setIsSaving(true);

    try {
      const requestBody: {
        documentType: string;
        fields: typeof fieldsToSave;
        summary?: string;
        transacoes?: Transacao[];
      } = {
        documentType,
        fields: fieldsToSave,
        summary,
      };

      // Incluir transações se for extrato bancário
      if (documentType === 'Extrato Bancário' && extractedTransacoes.length > 0) {
        requestBody.transacoes = extractedTransacoes;
      }

      const response = await fetch('/api/doc-processing/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar documento');
      }

      alert(data.message || 'Documento salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar documento');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">FIELDS</h2>
        <Button
          onClick={handleSaveDocument}
          disabled={!documentType || isSaving}
          size="sm"
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar no Sistema
            </>
          )}
        </Button>
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
                      onValueChange={handleDocumentTypeChange}
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

          {/* Transações Section - Only for Extrato Bancário */}
          {documentType === 'Extrato Bancário' && extractedTransacoes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Transações Extraídas ({extractedTransacoes.length})
              </h3>
              <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                {/* Header da tabela */}
                <div className="grid grid-cols-[120px_1fr_150px_100px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-sm text-gray-700">
                  <div>Data</div>
                  <div>Descrição</div>
                  <div className="text-right">Valor</div>
                  <div className="text-center">Tipo</div>
                </div>
                {/* Linhas de transações */}
                {extractedTransacoes.map((transacao, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[120px_1fr_150px_100px] gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm"
                  >
                    <div className="text-gray-700">{transacao.data}</div>
                    <div className="text-gray-900 truncate">{transacao.descricao}</div>
                    <div className={`text-right font-medium ${
                      transacao.tipo === 'credito' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transacao.valor}
                    </div>
                    <div className="text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        transacao.tipo === 'credito'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {transacao.tipo === 'credito' ? 'Crédito' : 'Débito'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
