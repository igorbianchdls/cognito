'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, FileText, Building2, Calendar, DollarSign, AlertCircle, Clock, CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ContaAPagar {
  id: string;
  numero_conta: string;
  fornecedor_nome: string;
  fornecedor_cnpj?: string;
  fornecedor_email?: string;
  valor_total: number;
  valor_pago?: number;
  valor_pendente?: number;
  data_emissao?: string;
  data_vencimento?: string;
  data_pagamento?: string;
  status?: string;
  categoria?: string;
  descricao?: string;
  itens_descricao?: string;
  metodo_pagamento?: string;
  centro_custo?: string;
  nota_fiscal_url?: string;
  comprovante_pagamento_url?: string;
  observacoes?: string;
  created_at?: string;
}

interface ContasAPagarListProps {
  success: boolean;
  count: number;
  data: ContaAPagar[];
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

export default function ContasAPagarList({ success, count, data, message, error }: ContasAPagarListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showPagamentoForm, setShowPagamentoForm] = useState<string | null>(null);
  const [showCancelarForm, setShowCancelarForm] = useState<string | null>(null);
  const [valorPago, setValorPago] = useState<string>('');
  const [metodoPagamento, setMetodoPagamento] = useState<string>('PIX');
  const [motivoCancelamento, setMotivoCancelamento] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);

  const supabase = createClient();

  // Registrar Pagamento
  const handleRegistrarPagamento = async (contaId: string, conta: ContaAPagar) => {
    const valorPagamentoAtual = parseFloat(valorPago);

    if (!valorPago || valorPagamentoAtual <= 0) {
      setFeedbackMessage({
        id: contaId,
        type: 'error',
        message: 'Por favor, informe um valor valido maior que zero.'
      });
      return;
    }

    const valorPagoAnterior = conta.valor_pago || 0;
    const valorPendente = conta.valor_pendente || conta.valor_total;

    if (valorPagamentoAtual > valorPendente) {
      setFeedbackMessage({
        id: contaId,
        type: 'error',
        message: `Valor excede o pendente. Maximo: R$ ${valorPendente.toFixed(2)}`
      });
      return;
    }

    setLoadingId(contaId);
    setFeedbackMessage(null);

    const novoValorPago = valorPagoAnterior + valorPagamentoAtual;
    const novoValorPendente = conta.valor_total - novoValorPago;
    const novoStatus = novoValorPendente <= 0.01 ? 'pago' : 'pendente';

    try {
      const { error } = await supabase
        .from('accounts_payable')
        .update({
          valor_pago: novoValorPago,
          valor_pendente: novoValorPendente,
          status: novoStatus,
          data_pagamento: novoStatus === 'pago' ? new Date().toISOString() : null,
          metodo_pagamento: metodoPagamento
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
      setTimeout(() => setFeedbackMessage(null), 3000);
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
    if (!motivoCancelamento.trim()) {
      setFeedbackMessage({
        id: contaId,
        type: 'error',
        message: 'Por favor, informe o motivo do cancelamento.'
      });
      return;
    }

    setLoadingId(contaId);
    setFeedbackMessage(null);

    try {
      const { error } = await supabase
        .from('accounts_payable')
        .update({
          status: 'cancelado',
          observacoes: motivoCancelamento
        })
        .eq('id', contaId);

      if (error) throw error;

      setFeedbackMessage({
        id: contaId,
        type: 'success',
        message: 'Conta cancelada com sucesso!'
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

  if (!success) {
    return (
      <Card className="w-full border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Erro ao Buscar Contas a Pagar
          </CardTitle>
          <CardDescription className="text-red-600">
            {error || 'Erro desconhecido ao buscar contas a pagar'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (count === 0) {
    return (
      <Card className="w-full border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-700 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nenhuma Conta Encontrada
          </CardTitle>
          <CardDescription>
            Nao ha contas a pagar que correspondam aos filtros aplicados.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full border-gray-200 bg-white">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              Contas a Pagar
            </CardTitle>
            <CardDescription className="mt-1">{message}</CardDescription>
          </div>
        </div>
      </CardHeader>

      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {data.map((conta) => {
            const diasAtraso = calcularDiasAtraso(conta.data_vencimento, conta.data_pagamento, conta.status);

            return (
              <Card key={conta.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">Conta #{conta.numero_conta}</CardTitle>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        {conta.fornecedor_nome}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {conta.status && (
                        <Badge className={getStatusColor(conta.status)}>
                          {conta.status}
                        </Badge>
                      )}
                      {conta.categoria && (
                        <Badge variant="outline" className="text-xs">
                          {conta.categoria}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {conta.fornecedor_email && <span>{conta.fornecedor_email}</span>}
                    {conta.data_emissao && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        Emissao: {new Date(conta.data_emissao).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      Total: R$ {conta.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    {conta.valor_pago !== undefined && conta.valor_pago > 0 && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Pago: R$ {conta.valor_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                    {conta.valor_pendente !== undefined && conta.valor_pendente > 0 && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        Pendente: R$ {conta.valor_pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>

                  {diasAtraso !== null && diasAtraso > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700 font-medium">
                        Vencida ha {diasAtraso} dia{diasAtraso !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="detalhes" className="border-0">
                      <AccordionTrigger className="py-2 hover:no-underline">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {getStatusIcon(conta.status)}
                          <span>
                            {conta.status === 'pago' && conta.data_pagamento
                              ? `Pago em ${new Date(conta.data_pagamento).toLocaleDateString('pt-BR')}`
                              : conta.status === 'vencido'
                              ? `Vencida - Acao urgente necessaria`
                              : conta.status === 'pendente' && conta.data_vencimento
                              ? `Vence em ${new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}`
                              : `Status: ${conta.status}`}
                          </span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 gap-4 text-sm">
                          {conta.itens_descricao && (
                            <div>
                              <p className="font-semibold text-gray-700 mb-1">Itens/Servicos:</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{conta.itens_descricao}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            {conta.data_vencimento && (
                              <div>
                                <p className="font-semibold text-gray-700">Vencimento:</p>
                                <p className="text-gray-700">{new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}</p>
                              </div>
                            )}
                            {conta.metodo_pagamento && (
                              <div>
                                <p className="font-semibold text-gray-700">Metodo:</p>
                                <p className="text-gray-700">{conta.metodo_pagamento}</p>
                              </div>
                            )}
                          </div>

                          {conta.observacoes && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-700">{conta.observacoes}</p>
                            </div>
                          )}

                          {conta.nota_fiscal_url && (
                            <div>
                              <a
                                href={conta.nota_fiscal_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Ver Nota Fiscal
                              </a>
                            </div>
                          )}
                        </div>

                        {conta.status !== 'pago' && conta.status !== 'cancelado' && (
                          <div className="border-t pt-4 space-y-4">
                            <p className="text-sm font-semibold text-gray-700">Acoes:</p>

                            {feedbackMessage && feedbackMessage.id === conta.id && (
                              <div className={`p-3 rounded-lg ${feedbackMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                <p className={`text-sm ${feedbackMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                  {feedbackMessage.message}
                                </p>
                              </div>
                            )}

                            {showPagamentoForm === conta.id ? (
                              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div className="space-y-2">
                                  <p>Valor Total: <span className="font-semibold">R$ {conta.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                                  {conta.valor_pago !== undefined && conta.valor_pago > 0 && (
                                    <p>Ja Pago: <span className="font-semibold text-green-600">R$ {conta.valor_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                                  )}
                                  <p>Pendente: <span className="font-semibold text-orange-600">R$ {(conta.valor_pendente || conta.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Valor do Pagamento</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={valorPago}
                                      onChange={(e) => setValorPago(e.target.value)}
                                      placeholder={`Maximo: ${(conta.valor_pendente || conta.valor_total).toFixed(2)}`}
                                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                      disabled={loadingId === conta.id}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Metodo</label>
                                    <select
                                      value={metodoPagamento}
                                      onChange={(e) => setMetodoPagamento(e.target.value)}
                                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                      disabled={loadingId === conta.id}
                                    >
                                      <option value="PIX">PIX</option>
                                      <option value="Transferencia">Transferencia</option>
                                      <option value="Boleto">Boleto</option>
                                      <option value="Cartao">Cartao</option>
                                      <option value="Dinheiro">Dinheiro</option>
                                    </select>
                                  </div>
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
                                        Processando...
                                      </>
                                    ) : (
                                      <>
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Confirmar Pagamento
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setShowPagamentoForm(null);
                                      setValorPago('');
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
                              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Motivo do Cancelamento</label>
                                  <textarea
                                    value={motivoCancelamento}
                                    onChange={(e) => setMotivoCancelamento(e.target.value)}
                                    placeholder="Descreva o motivo..."
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                    rows={3}
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
                                        Processando...
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
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                                >
                                  Registrar Pagamento
                                </Button>
                                <Button
                                  onClick={() => setShowCancelarForm(conta.id)}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                                >
                                  Cancelar Conta
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {conta.created_at && (
                    <p className="text-xs text-gray-500 text-right">
                      Registrada em: {new Date(conta.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
}
