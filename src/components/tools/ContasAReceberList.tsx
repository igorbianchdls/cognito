'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, FileText, Building2, Calendar, DollarSign, AlertCircle, Clock, CreditCard, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ContaAReceber {
  id: string;
  numero_fatura: string;
  cliente_nome: string;
  cliente_email?: string;
  valor_total: number;
  valor_pago?: number;
  valor_pendente?: number;
  data_emissao?: string;
  data_vencimento?: string;
  data_pagamento?: string;
  status?: string;
  itens_descricao?: string;
  metodo_pagamento?: string;
  nota_fiscal_url?: string;
  observacoes?: string;
  created_at?: string;
}

interface ContasAReceberListProps {
  success: boolean;
  count: number;
  data: ContaAReceber[];
  message: string;
  error?: string;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'pago': return 'bg-green-100 text-green-800 border-green-300';
    case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'vencido': return 'bg-red-100 text-red-800 border-red-300';
    case 'cancelado': return 'bg-gray-100 text-gray-800 border-gray-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const calcularDiasAtraso = (dataVencimento?: string, dataPagamento?: string, status?: string) => {
  if (status === 'pago' && dataPagamento) {
    return null;
  }

  if (!dataVencimento) return null;

  const vencimento = new Date(dataVencimento);
  const hoje = new Date();
  const diffTime = hoje.getTime() - vencimento.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};

export default function ContasAReceberList({ success, count, data, message, error }: ContasAReceberListProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showPagamentoForm, setShowPagamentoForm] = useState<string | null>(null);
  const [showCancelarForm, setShowCancelarForm] = useState<string | null>(null);
  const [valorPago, setValorPago] = useState<string>('');
  const [metodoPagamento, setMetodoPagamento] = useState<string>('PIX');
  const [motivoCancelamento, setMotivoCancelamento] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);

  const supabase = createClient();

  // Registrar Pagamento
  const handleRegistrarPagamento = async (contaId: string, conta: ContaAReceber) => {
    const valorPagamentoAtual = parseFloat(valorPago);

    if (!valorPago || valorPagamentoAtual <= 0) {
      setFeedbackMessage({
        id: contaId,
        type: 'error',
        message: 'Por favor, informe um valor válido maior que zero.'
      });
      return;
    }

    const valorPagoAnterior = conta.valor_pago || 0;
    const valorPendente = conta.valor_pendente || conta.valor_total;

    if (valorPagamentoAtual > valorPendente) {
      setFeedbackMessage({
        id: contaId,
        type: 'error',
        message: `Valor informado (R$ ${valorPagamentoAtual.toFixed(2)}) excede o valor pendente (R$ ${valorPendente.toFixed(2)}).`
      });
      return;
    }

    setLoadingId(contaId);
    setFeedbackMessage(null);

    try {
      const novoValorPago = valorPagoAnterior + valorPagamentoAtual;
      const novoValorPendente = conta.valor_total - novoValorPago;
      const novoStatus = novoValorPendente === 0 ? 'pago' : conta.status;

      const { error } = await supabase
        .from('invoices')
        .update({
          valor_pago: novoValorPago,
          valor_pendente: novoValorPendente,
          status: novoStatus,
          metodo_pagamento: metodoPagamento,
          data_pagamento: novoStatus === 'pago' ? new Date().toISOString() : conta.data_pagamento
        })
        .eq('id', contaId);

      if (error) throw error;

      setFeedbackMessage({
        id: contaId,
        type: 'success',
        message: novoStatus === 'pago'
          ? `Pagamento registrado! Conta quitada com sucesso.`
          : `Pagamento parcial registrado. Pendente: R$ ${novoValorPendente.toFixed(2)}`
      });
      setShowPagamentoForm(null);
      setValorPago('');
      setMetodoPagamento('PIX');

      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err) {
      console.error('Erro ao registrar pagamento:', err);
      setFeedbackMessage({
        id: contaId,
        type: 'error',
        message: 'Erro ao registrar pagamento. Tente novamente.'
      });
    } finally {
      setLoadingId(null);
    }
  };

  // Cancelar Conta
  const handleCancelarConta = async (contaId: string) => {
    if (!motivoCancelamento.trim() || motivoCancelamento.length < 10) {
      setFeedbackMessage({
        id: contaId,
        type: 'error',
        message: 'Por favor, informe o motivo do cancelamento (mínimo 10 caracteres).'
      });
      return;
    }

    setLoadingId(contaId);
    setFeedbackMessage(null);

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'cancelado'
        })
        .eq('id', contaId);

      if (error) throw error;

      setFeedbackMessage({
        id: contaId,
        type: 'success',
        message: 'Conta cancelada com sucesso.'
      });
      setShowCancelarForm(null);
      setMotivoCancelamento('');

      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao cancelar conta:', err);
      setFeedbackMessage({
        id: contaId,
        type: 'error',
        message: 'Erro ao cancelar conta. Tente novamente.'
      });
    } finally {
      setLoadingId(null);
    }
  };

  if (!success && error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao buscar contas a receber</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <CardTitle className="text-green-700">{message}</CardTitle>
          </div>
          <CardDescription className="text-green-600">
            {count} conta{count !== 1 ? 's' : ''} a receber encontrada{count !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      {data && data.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>#Fatura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Pendente</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((conta) => {
                const diasAtraso = calcularDiasAtraso(conta.data_vencimento, conta.data_pagamento, conta.status);
                const isExpanded = expandedRow === conta.id;

                return (
                  <>
                    <TableRow key={conta.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedRow(isExpanded ? null : conta.id)}
                          className="p-0 h-6 w-6"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{conta.numero_fatura}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{conta.cliente_nome}</span>
                          {conta.cliente_email && <span className="text-xs text-gray-500">{conta.cliente_email}</span>}
                        </div>
                      </TableCell>
                      <TableCell>R$ {conta.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-green-600">
                        {conta.valor_pago !== undefined && conta.valor_pago > 0
                          ? `R$ ${conta.valor_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        {conta.valor_pendente !== undefined && conta.valor_pendente > 0
                          ? `R$ ${conta.valor_pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {conta.data_vencimento ? (
                          <div className="flex flex-col">
                            <span>{new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}</span>
                            {diasAtraso !== null && diasAtraso > 0 && (
                              <span className="text-xs text-red-600">{diasAtraso} dia{diasAtraso !== 1 ? 's' : ''} de atraso</span>
                            )}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {conta.status && <Badge className={getStatusColor(conta.status)}>{conta.status}</Badge>}
                      </TableCell>
                      <TableCell>
                        {conta.status !== 'pago' && conta.status !== 'cancelado' && (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setExpandedRow(conta.id);
                                setShowPagamentoForm(conta.id);
                                setShowCancelarForm(null);
                              }}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              Pagar
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-gray-50">
                          <div className="p-4 space-y-4">
                            {/* Detalhes */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {conta.data_emissao && (
                                <div>
                                  <span className="font-semibold text-gray-700">Data Emissão:</span>
                                  <span className="ml-2">{new Date(conta.data_emissao).toLocaleDateString('pt-BR')}</span>
                                </div>
                              )}
                              {conta.metodo_pagamento && (
                                <div>
                                  <span className="font-semibold text-gray-700">Método Pagamento:</span>
                                  <span className="ml-2">{conta.metodo_pagamento}</span>
                                </div>
                              )}
                            </div>

                            {conta.itens_descricao && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-blue-700 mb-2">Itens da Conta</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{conta.itens_descricao}</p>
                              </div>
                            )}

                            {conta.observacoes && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-yellow-700 mb-2">Observações</p>
                                <p className="text-sm text-gray-700">{conta.observacoes}</p>
                              </div>
                            )}

                            {conta.nota_fiscal_url && (
                              <div>
                                <a
                                  href={conta.nota_fiscal_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  📄 Baixar Nota Fiscal
                                </a>
                              </div>
                            )}

                            {/* Ações */}
                            {conta.status !== 'pago' && conta.status !== 'cancelado' && (
                              <div className="border-t pt-4">
                                {feedbackMessage && feedbackMessage.id === conta.id && (
                                  <div className={`mb-3 p-3 rounded-md text-sm ${
                                    feedbackMessage.type === 'success'
                                      ? 'bg-green-100 text-green-800 border border-green-300'
                                      : 'bg-red-100 text-red-800 border border-red-300'
                                  }`}>
                                    {feedbackMessage.message}
                                  </div>
                                )}

                                {showPagamentoForm === conta.id ? (
                                  <div className="space-y-3 bg-white border rounded-lg p-4">
                                    <p className="font-semibold text-gray-700">Registrar Pagamento</p>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Valor do Pagamento (R$)</label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={valorPago}
                                          onChange={(e) => setValorPago(e.target.value)}
                                          placeholder={`Máximo: ${(conta.valor_pendente || conta.valor_total).toFixed(2)}`}
                                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                                          disabled={loadingId === conta.id}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Método</label>
                                        <select
                                          value={metodoPagamento}
                                          onChange={(e) => setMetodoPagamento(e.target.value)}
                                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                                          disabled={loadingId === conta.id}
                                        >
                                          <option value="PIX">PIX</option>
                                          <option value="Boleto">Boleto</option>
                                          <option value="Cartão de Crédito">Cartão de Crédito</option>
                                          <option value="TED">TED</option>
                                          <option value="Dinheiro">Dinheiro</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleRegistrarPagamento(conta.id, conta)}
                                        disabled={loadingId === conta.id}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        size="sm"
                                      >
                                        {loadingId === conta.id ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Processando...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Confirmar
                                          </>
                                        )}
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          setShowPagamentoForm(null);
                                          setValorPago('');
                                        }}
                                        variant="outline"
                                        size="sm"
                                      >
                                        Cancelar
                                      </Button>
                                    </div>
                                  </div>
                                ) : showCancelarForm === conta.id ? (
                                  <div className="space-y-3 bg-white border rounded-lg p-4">
                                    <p className="font-semibold text-gray-700">Cancelar Conta</p>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Motivo</label>
                                      <textarea
                                        value={motivoCancelamento}
                                        onChange={(e) => setMotivoCancelamento(e.target.value)}
                                        placeholder="Descreva o motivo... (mínimo 10 caracteres)"
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                                        rows={3}
                                        disabled={loadingId === conta.id}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleCancelarConta(conta.id)}
                                        disabled={loadingId === conta.id}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        size="sm"
                                      >
                                        {loadingId === conta.id ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Processando...
                                          </>
                                        ) : (
                                          <>
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Confirmar
                                          </>
                                        )}
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          setShowCancelarForm(null);
                                          setMotivoCancelamento('');
                                        }}
                                        variant="outline"
                                        size="sm"
                                      >
                                        Voltar
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => {
                                        setShowPagamentoForm(conta.id);
                                        setShowCancelarForm(null);
                                      }}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      size="sm"
                                    >
                                      <CreditCard className="h-4 w-4 mr-2" />
                                      Registrar Pagamento
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setShowCancelarForm(conta.id);
                                        setShowPagamentoForm(null);
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cancelar Conta
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
