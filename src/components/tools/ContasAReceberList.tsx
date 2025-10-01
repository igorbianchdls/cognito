'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, FileText, Building2, Calendar, DollarSign, AlertCircle, Clock, CreditCard, Loader2 } from 'lucide-react';
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

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'pago': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'pendente': return <Clock className="h-4 w-4 text-yellow-600" />;
    case 'vencido': return <AlertCircle className="h-4 w-4 text-red-600" />;
    case 'cancelado': return <XCircle className="h-4 w-4 text-gray-600" />;
    default: return <FileText className="h-4 w-4 text-gray-600" />;
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
          // Opcional: adicionar campo motivo_cancelamento no banco
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
        <div className="grid gap-4 md:grid-cols-4">
          {data.map((conta) => {
            const diasAtraso = calcularDiasAtraso(conta.data_vencimento, conta.data_pagamento, conta.status);

            return (
              <Card key={conta.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <CardTitle className="text-lg">Conta #{conta.numero_fatura}</CardTitle>
                        <CardDescription className="text-sm mt-1 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {conta.cliente_nome}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center flex-col">
                      {conta.status && (
                        <Badge className={getStatusColor(conta.status)}>
                          {conta.status}
                        </Badge>
                      )}
                      {diasAtraso !== null && diasAtraso > 0 && (
                        <Badge className="bg-red-100 text-red-800 border-red-300">
                          {diasAtraso} dia{diasAtraso !== 1 ? 's' : ''} de atraso
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    {conta.cliente_email && <span>{conta.cliente_email}</span>}
                    {conta.data_emissao && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Emissão: {new Date(conta.data_emissao).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm font-medium mt-2">
                    <span className="flex items-center gap-1 text-blue-600">
                      <DollarSign className="h-4 w-4" />
                      Total: R$ {conta.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {conta.valor_pago !== undefined && conta.valor_pago > 0 && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Pago: R$ {conta.valor_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    {conta.valor_pendente !== undefined && conta.valor_pendente > 0 && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <Clock className="h-4 w-4" />
                        Pendente: R$ {conta.valor_pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="content" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-3 cursor-pointer">
                        <div className="w-full pointer-events-none">
                          <p className="text-xs font-semibold text-gray-500 mb-2">DETALHES DA CONTA</p>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(conta.status)}
                            <span className="text-sm text-gray-700">
                              {conta.status === 'pago' && conta.data_pagamento
                                ? `Pago em ${new Date(conta.data_pagamento).toLocaleDateString('pt-BR')}`
                                : conta.status === 'vencido'
                                ? `Vencida ${diasAtraso ? `há ${diasAtraso} dias` : ''}`
                                : conta.status === 'pendente' && conta.data_vencimento
                                ? `Vence em ${new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}`
                                : `Status: ${conta.status}`}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          {conta.itens_descricao && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-blue-700 mb-2">📋 ITENS DA CONTA</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{conta.itens_descricao}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {conta.data_vencimento && (
                              <div>
                                <p className="text-xs text-gray-500 font-semibold">Vencimento</p>
                                <p className="text-gray-700">{new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}</p>
                              </div>
                            )}
                            {conta.metodo_pagamento && (
                              <div>
                                <p className="text-xs text-gray-500 font-semibold">Método de Pagamento</p>
                                <p className="text-gray-700">{conta.metodo_pagamento}</p>
                              </div>
                            )}
                          </div>

                          {conta.observacoes && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-yellow-700 mb-2">💬 OBSERVAÇÕES</p>
                              <p className="text-sm text-gray-700">{conta.observacoes}</p>
                            </div>
                          )}

                          {conta.nota_fiscal_url && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-green-700 mb-2">📄 NOTA FISCAL</p>
                              <a
                                href={conta.nota_fiscal_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Baixar Nota Fiscal
                              </a>
                            </div>
                          )}

                          {/* Financial Actions Section - Only for non-final states */}
                          {conta.status !== 'pago' && conta.status !== 'cancelado' && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                              <p className="text-xs font-semibold text-purple-700 mb-3">⚡ AÇÕES FINANCEIRAS</p>

                              {/* Feedback Message */}
                              {feedbackMessage && feedbackMessage.id === conta.id && (
                                <div className={`mb-3 p-2 rounded-md text-sm ${
                                  feedbackMessage.type === 'success'
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                }`}>
                                  {feedbackMessage.message}
                                </div>
                              )}

                              {/* Pagamento Form */}
                              {showPagamentoForm === conta.id ? (
                                <div className="space-y-3">
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                    <p className="text-xs font-semibold text-blue-700 mb-1">💰 RESUMO FINANCEIRO</p>
                                    <div className="text-sm space-y-1">
                                      <p>Valor Total: <span className="font-semibold">R$ {conta.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                                      {conta.valor_pago !== undefined && conta.valor_pago > 0 && (
                                        <p>Já Pago: <span className="font-semibold text-green-600">R$ {conta.valor_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                                      )}
                                      <p>Pendente: <span className="font-semibold text-orange-600">R$ {(conta.valor_pendente || conta.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                                      Valor do Pagamento (R$)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={valorPago}
                                      onChange={(e) => setValorPago(e.target.value)}
                                      placeholder={`Máximo: ${(conta.valor_pendente || conta.valor_total).toFixed(2)}`}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                      disabled={loadingId === conta.id}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                                      Método de Pagamento
                                    </label>
                                    <select
                                      value={metodoPagamento}
                                      onChange={(e) => setMetodoPagamento(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                      disabled={loadingId === conta.id}
                                    >
                                      <option value="PIX">PIX</option>
                                      <option value="Boleto">Boleto</option>
                                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                                      <option value="TED">TED</option>
                                      <option value="Dinheiro">Dinheiro</option>
                                    </select>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleRegistrarPagamento(conta.id, conta)}
                                      disabled={loadingId === conta.id}
                                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                      size="sm"
                                    >
                                      {loadingId === conta.id ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Registrando...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                          Confirmar Pagamento
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setShowPagamentoForm(null);
                                        setValorPago('');
                                        setMetodoPagamento('PIX');
                                      }}
                                      disabled={loadingId === conta.id}
                                      variant="outline"
                                      size="sm"
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : showCancelarForm === conta.id ? (
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                                      Motivo do Cancelamento
                                    </label>
                                    <textarea
                                      value={motivoCancelamento}
                                      onChange={(e) => setMotivoCancelamento(e.target.value)}
                                      placeholder="Descreva o motivo do cancelamento... (mínimo 10 caracteres)"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-20"
                                      disabled={loadingId === conta.id}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleCancelarConta(conta.id)}
                                      disabled={loadingId === conta.id}
                                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                      size="sm"
                                    >
                                      {loadingId === conta.id ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Cancelando...
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Confirmar Cancelamento
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setShowCancelarForm(null);
                                        setMotivoCancelamento('');
                                      }}
                                      disabled={loadingId === conta.id}
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
                                    onClick={() => setShowPagamentoForm(conta.id)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    size="sm"
                                  >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Registrar Pagamento
                                  </Button>
                                  <Button
                                    onClick={() => setShowCancelarForm(conta.id)}
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
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {conta.created_at && (
                    <p className="text-xs text-gray-400 pt-3 border-t mt-3">
                      Registrada em: {new Date(conta.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
