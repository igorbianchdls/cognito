'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, Wrench, User, Calendar, DollarSign, FileText, Settings, CheckCircle, PlayCircle, PauseCircle, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ServiceOrder {
  id: string;
  numero_os: string;
  cliente_nome: string;
  equipamento: string;
  defeito_relatado: string;
  diagnostico?: string;
  servico_executado?: string;
  tecnico_responsavel: string;
  status?: string;
  valor_total?: number;
  data_abertura?: string;
  data_conclusao?: string;
  created_at?: string;
}

interface ServiceOrdersListProps {
  success: boolean;
  count: number;
  data: ServiceOrder[];
  message: string;
  error?: string;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'concluida': return 'bg-green-100 text-green-800 border-green-300';
    case 'cancelada': return 'bg-red-100 text-red-800 border-red-300';
    case 'em_andamento': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'aguardando_pecas': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'aberta': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'concluida': return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'em_andamento': return <Settings className="h-4 w-4 text-blue-600 animate-pulse" />;
    case 'aberta': return <FileText className="h-4 w-4 text-yellow-600" />;
    default: return <Wrench className="h-4 w-4 text-gray-600" />;
  }
};

export default function ServiceOrdersList({ success, count, data, message, error }: ServiceOrdersListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showConcluirForm, setShowConcluirForm] = useState<string | null>(null);
  const [showCancelarForm, setShowCancelarForm] = useState<string | null>(null);
  const [servicoExecutado, setServicoExecutado] = useState<string>('');
  const [valorTotal, setValorTotal] = useState<string>('');
  const [motivoCancelamento, setMotivoCancelamento] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);

  const supabase = createClient();

  // Iniciar Ordem: aberta → em_andamento
  const handleIniciarOrdem = async (osId: string) => {
    setLoadingId(osId);
    setFeedbackMessage(null);

    try {
      const { error } = await supabase
        .from('service_orders')
        .update({
          status: 'em_andamento'
        })
        .eq('id', osId);

      if (error) throw error;

      setFeedbackMessage({
        id: osId,
        type: 'success',
        message: 'Ordem de serviço iniciada com sucesso!'
      });

      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao iniciar ordem:', err);
      setFeedbackMessage({
        id: osId,
        type: 'error',
        message: 'Erro ao iniciar ordem. Tente novamente.'
      });
    } finally {
      setLoadingId(null);
    }
  };

  // Pausar para Peças: em_andamento → aguardando_pecas
  const handlePausarParaPecas = async (osId: string) => {
    setLoadingId(osId);
    setFeedbackMessage(null);

    try {
      const { error } = await supabase
        .from('service_orders')
        .update({
          status: 'aguardando_pecas'
        })
        .eq('id', osId);

      if (error) throw error;

      setFeedbackMessage({
        id: osId,
        type: 'success',
        message: 'Ordem pausada - aguardando peças.'
      });

      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao pausar ordem:', err);
      setFeedbackMessage({
        id: osId,
        type: 'error',
        message: 'Erro ao pausar ordem. Tente novamente.'
      });
    } finally {
      setLoadingId(null);
    }
  };

  // Retomar Ordem: aguardando_pecas → em_andamento
  const handleRetomarOrdem = async (osId: string) => {
    setLoadingId(osId);
    setFeedbackMessage(null);

    try {
      const { error } = await supabase
        .from('service_orders')
        .update({
          status: 'em_andamento'
        })
        .eq('id', osId);

      if (error) throw error;

      setFeedbackMessage({
        id: osId,
        type: 'success',
        message: 'Ordem retomada com sucesso!'
      });

      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao retomar ordem:', err);
      setFeedbackMessage({
        id: osId,
        type: 'error',
        message: 'Erro ao retomar ordem. Tente novamente.'
      });
    } finally {
      setLoadingId(null);
    }
  };

  // Concluir Ordem: em_andamento → concluida
  const handleConcluirOrdem = async (osId: string) => {
    if (!servicoExecutado.trim()) {
      setFeedbackMessage({
        id: osId,
        type: 'error',
        message: 'Por favor, informe o serviço executado.'
      });
      return;
    }

    if (!valorTotal || parseFloat(valorTotal) <= 0) {
      setFeedbackMessage({
        id: osId,
        type: 'error',
        message: 'Por favor, informe um valor válido.'
      });
      return;
    }

    setLoadingId(osId);
    setFeedbackMessage(null);

    try {
      const { error } = await supabase
        .from('service_orders')
        .update({
          status: 'concluida',
          servico_executado: servicoExecutado,
          valor_total: parseFloat(valorTotal),
          data_conclusao: new Date().toISOString()
        })
        .eq('id', osId);

      if (error) throw error;

      setFeedbackMessage({
        id: osId,
        type: 'success',
        message: 'Ordem de serviço concluída com sucesso!'
      });
      setShowConcluirForm(null);
      setServicoExecutado('');
      setValorTotal('');

      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao concluir ordem:', err);
      setFeedbackMessage({
        id: osId,
        type: 'error',
        message: 'Erro ao concluir ordem. Tente novamente.'
      });
    } finally {
      setLoadingId(null);
    }
  };

  // Cancelar Ordem: qualquer → cancelada
  const handleCancelarOrdem = async (osId: string) => {
    if (!motivoCancelamento.trim() || motivoCancelamento.length < 10) {
      setFeedbackMessage({
        id: osId,
        type: 'error',
        message: 'Por favor, informe o motivo do cancelamento (mínimo 10 caracteres).'
      });
      return;
    }

    setLoadingId(osId);
    setFeedbackMessage(null);

    try {
      const { error } = await supabase
        .from('service_orders')
        .update({
          status: 'cancelada'
          // Opcional: adicionar campo motivo_cancelamento no banco
        })
        .eq('id', osId);

      if (error) throw error;

      setFeedbackMessage({
        id: osId,
        type: 'success',
        message: 'Ordem de serviço cancelada.'
      });
      setShowCancelarForm(null);
      setMotivoCancelamento('');

      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao cancelar ordem:', err);
      setFeedbackMessage({
        id: osId,
        type: 'error',
        message: 'Erro ao cancelar ordem. Tente novamente.'
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
            <CardTitle className="text-red-700">Erro ao buscar ordens de serviço</CardTitle>
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
            {count} ordem{count !== 1 ? 'ns' : ''} de serviço encontrada{count !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-1">
          {data.map((os) => (
            <Card key={os.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Wrench className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-lg">OS #{os.numero_os}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {os.cliente_nome} - {os.equipamento}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {os.status && (
                      <Badge className={getStatusColor(os.status)}>
                        {os.status.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {os.tecnico_responsavel}
                  </span>
                  {os.data_abertura && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(os.data_abertura).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {os.valor_total !== undefined && os.valor_total > 0 && (
                    <span className="flex items-center gap-1 font-medium text-green-600">
                      <DollarSign className="h-3 w-3" />
                      R$ {os.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="content" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-3 cursor-pointer">
                      <div className="w-full pointer-events-none">
                        <p className="text-xs font-semibold text-gray-500 mb-2">INFORMAÇÕES RÁPIDAS</p>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(os.status)}
                          <span className="text-sm text-gray-700">
                            {os.status === 'concluida' && os.data_conclusao
                              ? `Concluída em ${new Date(os.data_conclusao).toLocaleDateString('pt-BR')}`
                              : os.status === 'em_andamento'
                              ? 'Em andamento - técnico trabalhando'
                              : os.status === 'aberta'
                              ? 'Aguardando atribuição'
                              : os.status === 'aguardando_pecas'
                              ? 'Aguardando peças'
                              : 'Status: ' + os.status}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-red-700 mb-2">🔴 DEFEITO RELATADO</p>
                          <p className="text-sm text-gray-700">{os.defeito_relatado}</p>
                        </div>

                        {os.diagnostico && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-2">🔍 DIAGNÓSTICO</p>
                            <p className="text-sm text-gray-700">{os.diagnostico}</p>
                          </div>
                        )}

                        {os.servico_executado && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-green-700 mb-2">✅ SERVIÇO EXECUTADO</p>
                            <p className="text-sm text-gray-700">{os.servico_executado}</p>
                          </div>
                        )}

                        {os.data_conclusao && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>
                              Tempo de resolução:{' '}
                              {Math.ceil(
                                (new Date(os.data_conclusao).getTime() - new Date(os.data_abertura!).getTime()) /
                                (1000 * 60 * 60 * 24)
                              )}{' '}
                              dia(s)
                            </span>
                          </div>
                        )}

                        {/* Status Management Section - Only for non-final states */}
                        {os.status !== 'concluida' && os.status !== 'cancelada' && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                            <p className="text-xs font-semibold text-purple-700 mb-3">⚡ AÇÕES DE GESTÃO</p>

                            {/* Feedback Message */}
                            {feedbackMessage && feedbackMessage.id === os.id && (
                              <div className={`mb-3 p-2 rounded-md text-sm ${
                                feedbackMessage.type === 'success'
                                  ? 'bg-green-100 text-green-800 border border-green-300'
                                  : 'bg-red-100 text-red-800 border border-red-300'
                              }`}>
                                {feedbackMessage.message}
                              </div>
                            )}

                            {/* Concluir Form */}
                            {showConcluirForm === os.id ? (
                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                                    Serviço Executado
                                  </label>
                                  <textarea
                                    value={servicoExecutado}
                                    onChange={(e) => setServicoExecutado(e.target.value)}
                                    placeholder="Descreva o serviço realizado..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-20"
                                    disabled={loadingId === os.id}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                                    Valor Total (R$)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={valorTotal}
                                    onChange={(e) => setValorTotal(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    disabled={loadingId === os.id}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleConcluirOrdem(os.id)}
                                    disabled={loadingId === os.id}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    size="sm"
                                  >
                                    {loadingId === os.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Concluindo...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Confirmar Conclusão
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setShowConcluirForm(null);
                                      setServicoExecutado('');
                                      setValorTotal('');
                                    }}
                                    disabled={loadingId === os.id}
                                    variant="outline"
                                    size="sm"
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : showCancelarForm === os.id ? (
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
                                    disabled={loadingId === os.id}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleCancelarOrdem(os.id)}
                                    disabled={loadingId === os.id}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    size="sm"
                                  >
                                    {loadingId === os.id ? (
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
                                    disabled={loadingId === os.id}
                                    variant="outline"
                                    size="sm"
                                  >
                                    Voltar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {/* Actions for 'aberta' status */}
                                {os.status === 'aberta' && (
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleIniciarOrdem(os.id)}
                                      disabled={loadingId === os.id}
                                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                      size="sm"
                                    >
                                      {loadingId === os.id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <PlayCircle className="h-4 w-4 mr-2" />
                                      )}
                                      Iniciar Ordem
                                    </Button>
                                    <Button
                                      onClick={() => setShowCancelarForm(os.id)}
                                      variant="outline"
                                      size="sm"
                                      className="border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cancelar
                                    </Button>
                                  </div>
                                )}

                                {/* Actions for 'em_andamento' status */}
                                {os.status === 'em_andamento' && (
                                  <div className="space-y-2">
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handlePausarParaPecas(os.id)}
                                        disabled={loadingId === os.id}
                                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                                        size="sm"
                                      >
                                        {loadingId === os.id ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <PauseCircle className="h-4 w-4 mr-2" />
                                        )}
                                        Pausar - Aguardar Peças
                                      </Button>
                                      <Button
                                        onClick={() => setShowConcluirForm(os.id)}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        size="sm"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Concluir Ordem
                                      </Button>
                                    </div>
                                    <Button
                                      onClick={() => setShowCancelarForm(os.id)}
                                      variant="outline"
                                      size="sm"
                                      className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cancelar Ordem
                                    </Button>
                                  </div>
                                )}

                                {/* Actions for 'aguardando_pecas' status */}
                                {os.status === 'aguardando_pecas' && (
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleRetomarOrdem(os.id)}
                                      disabled={loadingId === os.id}
                                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                      size="sm"
                                    >
                                      {loadingId === os.id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <PlayCircle className="h-4 w-4 mr-2" />
                                      )}
                                      Retomar Ordem
                                    </Button>
                                    <Button
                                      onClick={() => setShowCancelarForm(os.id)}
                                      variant="outline"
                                      size="sm"
                                      className="border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cancelar
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {os.created_at && (
                  <p className="text-xs text-gray-400 pt-3 border-t mt-3">
                    Registrada em: {new Date(os.created_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
