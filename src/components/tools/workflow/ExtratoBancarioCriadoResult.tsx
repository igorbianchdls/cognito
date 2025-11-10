'use client'

import { CheckCircle2, Database } from 'lucide-react'

type ExtratoBancarioCriadoOutput = {
  success: boolean;
  data: {
    id: string;
    banco: string;
    conta: string;
    agencia: string;
    data_inicio: string;
    data_fim: string;
    saldo_inicial: number;
    saldo_final: number;
    total_debitos: number;
    total_creditos: number;
    quantidade_transacoes: number;
    status: string;
    data_cadastro: string;
  };
  message: string;
  title?: string;
  resumo: {
    id: string;
    banco: string;
    conta: string;
    periodo: string;
    total_transacoes: number;
    status: string;
  };
  error?: string;
}

export default function ExtratoBancarioCriadoResult({ result }: { result: ExtratoBancarioCriadoOutput }) {
  return (
    <div className="space-y-4">
      {/* Success Card */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-2">
              {result.title || 'Extrato Bancário Salvo'}
            </h3>
            <p className="text-sm text-green-700 mb-3">{result.message}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700 font-medium">ID do Extrato:</span>
                <div className="text-green-900 font-mono text-xs">{result.resumo.id}</div>
              </div>
              <div>
                <span className="text-green-700 font-medium">Status:</span>
                <div className="inline-flex items-center px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-medium">
                  {result.resumo.status}
                </div>
              </div>
              <div>
                <span className="text-green-700 font-medium">Banco/Conta:</span>
                <div className="text-green-900 font-semibold">
                  {result.resumo.banco} - {result.resumo.conta}
                </div>
              </div>
              <div>
                <span className="text-green-700 font-medium">Período:</span>
                <div className="text-green-900">{result.resumo.periodo}</div>
              </div>
              <div>
                <span className="text-green-700 font-medium">Total de Transações:</span>
                <div className="text-green-900 font-semibold">{result.resumo.total_transacoes}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Database className="h-5 w-5 text-slate-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-2">Detalhes Financeiros</h4>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-slate-600">Saldo Inicial:</span>
                <div className="text-slate-900 font-semibold">
                  {result.data.saldo_inicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div>
                <span className="text-slate-600">Saldo Final:</span>
                <div className="text-slate-900 font-semibold">
                  {result.data.saldo_final.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div>
                <span className="text-slate-600">Total Débitos:</span>
                <div className="text-red-600 font-semibold">
                  {result.data.total_debitos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div>
                <span className="text-slate-600">Total Créditos:</span>
                <div className="text-green-600 font-semibold">
                  {result.data.total_creditos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div>
                <span className="text-slate-600">Quantidade Transações:</span>
                <div className="text-slate-900 font-semibold">
                  {result.data.quantidade_transacoes}
                </div>
              </div>
              <div>
                <span className="text-slate-600">Data Cadastro:</span>
                <div className="text-slate-900 text-xs">
                  {new Date(result.data.data_cadastro).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
