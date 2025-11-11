'use client'

import { CheckCircle2, TrendingDown, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

type PagamentoEfetuadoCriadoOutput = {
  success: boolean;
  // preview
  preview?: boolean;
  payload?: {
    lancamento_origem_id: string;
    conta_financeira_id: string;
    metodo_pagamento_id: string;
    descricao: string;
    valor?: number;
    data_pagamento?: string;
    tenant_id?: number | string;
  } | null;
  validations?: Array<{ field: string; status: 'ok' | 'warn' | 'error'; message?: string }>;
  metadata?: { commitEndpoint?: string };
  // created
  data: {
    id: string;
    conta_pagar_id: string;
    valor_pago: number;
    valor_juros: number;
    valor_multa: number;
    valor_desconto: number;
    valor_total: number;
    data_pagamento: string;
    forma_pagamento: string;
    conta_financeira_id: string;
    conta_financeira_nome: string;
    observacoes: string;
    status: string;
    data_cadastro: string;
    conta_pagar: {
      numero_nota_fiscal: string;
      fornecedor_nome: string;
      valor_original: number;
      status_anterior: string;
      status_atual: string;
    };
  };
  message: string;
  title?: string;
  resumo: {
    id: string;
    valor_formatado: string;
    data_pagamento: string;
    forma_pagamento: string;
    conta_financeira: string;
    nota_fiscal: string;
    fornecedor: string;
    status_conta: string;
  };
  detalhamento: {
    valor_principal: number;
    juros: number;
    multa: number;
    desconto: number;
    total: number;
  };
  error?: string;
}

export default function PagamentoEfetuadoCriadoResult({ result }: { result: PagamentoEfetuadoCriadoOutput }) {
  const [creating, setCreating] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const isPreview = result.preview && result.payload && !createdId

  const commit = async () => {
    if (!result.metadata?.commitEndpoint || !result.payload) return
    try {
      setCreating(true)
      const res = await fetch(result.metadata.commitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lancamento_origem_id: result.payload.lancamento_origem_id,
          conta_financeira_id: result.payload.conta_financeira_id,
          metodo_pagamento_id: result.payload.metodo_pagamento_id,
          descricao: result.payload.descricao,
        })
      })
      const json = await res.json()
      if (!res.ok || !json?.success) {
        alert(json?.message || 'Falha ao criar pagamento efetuado')
        setCreating(false)
        return
      }
      setCreatedId(String(json.id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao criar pagamento')
    } finally {
      setCreating(false)
    }
  }

  if (isPreview) {
    const valor = result.payload?.valor || 0
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Pagamento Efetuado (Prévia)</h3>
              <p className="text-sm text-blue-700 mb-3">{result.message}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Valor Proposto:</span>
                  <div className="text-blue-900 font-bold text-lg">{Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Data Pagamento:</span>
                  <div className="text-blue-900">{result.payload?.data_pagamento || '-'}</div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Conta Financeira ID:</span>
                  <div className="text-blue-900 text-xs">{result.payload?.conta_financeira_id}</div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Método Pagamento ID:</span>
                  <div className="text-blue-900 text-xs">{result.payload?.metodo_pagamento_id}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-blue-700 font-medium">Descrição:</span>
                  <div className="text-blue-900">{result.payload?.descricao}</div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={commit} disabled={creating}>
                  {creating ? 'Criando…' : 'Criar Pagamento'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {/* Success Card */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-2">
              {result.title || 'Pagamento Efetuado'}
            </h3>
            <p className="text-sm text-red-700 mb-3">{result.message}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-red-700 font-medium">Valor Total:</span>
                <div className="text-red-900 font-bold text-lg">
                  {result.resumo.valor_formatado}
                </div>
              </div>
              <div>
                <span className="text-red-700 font-medium">Data Pagamento:</span>
                <div className="text-red-900">
                  {new Date(result.resumo.data_pagamento).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div>
                <span className="text-red-700 font-medium">Forma Pagamento:</span>
                <div className="text-red-900">{result.resumo.forma_pagamento}</div>
              </div>
              <div>
                <span className="text-red-700 font-medium">Conta Financeira:</span>
                <div className="text-red-900 text-xs">{result.resumo.conta_financeira}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conta Pagar Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Receipt className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-2">Conta a Pagar Baixada</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Nota Fiscal:</span>
                <div className="text-blue-900 font-mono">{result.resumo.nota_fiscal}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Fornecedor:</span>
                <div className="text-blue-900">{result.resumo.fornecedor}</div>
              </div>
              <div className="col-span-2">
                <span className="text-blue-700 font-medium">Status:</span>
                <div className="text-blue-900 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium">
                    {result.resumo.status_conta}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhamento de Valores */}
      {(result.detalhamento.juros > 0 || result.detalhamento.multa > 0 || result.detalhamento.desconto > 0) && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingDown className="h-5 w-5 text-slate-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-2">Detalhamento de Valores</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Valor Principal:</span>
                  <span className="font-semibold text-slate-900">
                    {result.detalhamento.valor_principal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                {result.detalhamento.juros > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Juros:</span>
                    <span className="font-semibold text-orange-600">
                      + {result.detalhamento.juros.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                )}
                {result.detalhamento.multa > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Multa:</span>
                    <span className="font-semibold text-orange-600">
                      + {result.detalhamento.multa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                )}
                {result.detalhamento.desconto > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Desconto:</span>
                    <span className="font-semibold text-green-600">
                      - {result.detalhamento.desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-300">
                  <span className="font-semibold text-slate-900">Total Pago:</span>
                  <span className="font-bold text-red-600 text-lg">
                    {result.detalhamento.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ID do Pagamento */}
      <div className="text-xs text-muted-foreground text-center">
        ID do Pagamento: <span className="font-mono">{result.resumo.id}</span>
      </div>
    </div>
  );
}
