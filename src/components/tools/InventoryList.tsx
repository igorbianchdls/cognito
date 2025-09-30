'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Package, AlertTriangle, CheckCircle2, XCircle, MapPin, DollarSign, TrendingUp, TrendingDown, Archive, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface InventoryItem {
  id: string;
  codigo_produto: string;
  nome_produto: string;
  categoria?: string;
  descricao?: string;
  quantidade_atual: number;
  quantidade_minima?: number;
  quantidade_maxima?: number;
  unidade_medida?: string;
  localizacao?: string;
  fornecedor?: string;
  custo_unitario?: number;
  preco_venda?: number;
  ultima_compra?: string;
  ultima_venda?: string;
  status?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

interface InventoryListProps {
  success: boolean;
  count: number;
  data: InventoryItem[];
  message: string;
  error?: string;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'disponivel': return 'bg-green-100 text-green-800 border-green-300';
    case 'baixo_estoque': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'esgotado': return 'bg-red-100 text-red-800 border-red-300';
    case 'descontinuado': return 'bg-gray-100 text-gray-800 border-gray-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'disponivel': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'baixo_estoque': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'esgotado': return <XCircle className="h-4 w-4 text-red-600" />;
    case 'descontinuado': return <Archive className="h-4 w-4 text-gray-600" />;
    default: return <Package className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'disponivel': return 'Disponível';
    case 'baixo_estoque': return 'Estoque Baixo';
    case 'esgotado': return 'Esgotado';
    case 'descontinuado': return 'Descontinuado';
    default: return status || 'Desconhecido';
  }
};

export default function InventoryList({ success, count, data, message, error }: InventoryListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showAjustarForm, setShowAjustarForm] = useState<string | null>(null);
  const [novaQuantidade, setNovaQuantidade] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);

  const supabase = createClient();

  // Ajustar quantidade
  const handleAjustarQuantidade = async (itemId: string, item: InventoryItem) => {
    if (!novaQuantidade || isNaN(Number(novaQuantidade))) {
      setFeedbackMessage({
        id: itemId,
        type: 'error',
        message: 'Digite uma quantidade válida'
      });
      return;
    }

    setLoadingId(itemId);
    setFeedbackMessage(null);

    const quantidade = Number(novaQuantidade);
    let novoStatus = item.status;

    // Atualizar status baseado na quantidade
    if (quantidade === 0) {
      novoStatus = 'esgotado';
    } else if (item.quantidade_minima && quantidade < item.quantidade_minima) {
      novoStatus = 'baixo_estoque';
    } else if (novoStatus !== 'descontinuado') {
      novoStatus = 'disponivel';
    }

    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          quantidade_atual: quantidade,
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      setFeedbackMessage({
        id: itemId,
        type: 'success',
        message: `Quantidade atualizada! Novo estoque: ${quantidade} ${item.unidade_medida || 'unidade'}(s)`
      });

      setShowAjustarForm(null);
      setNovaQuantidade('');
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao ajustar quantidade:', err);
      setFeedbackMessage({
        id: itemId,
        type: 'error',
        message: 'Erro ao ajustar quantidade. Tente novamente.'
      });
    } finally {
      setLoadingId(null);
    }
  };

  // Marcar como descontinuado
  const handleDescontinuar = async (itemId: string) => {
    setLoadingId(itemId);
    setFeedbackMessage(null);

    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          status: 'descontinuado',
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      setFeedbackMessage({
        id: itemId,
        type: 'success',
        message: 'Produto marcado como descontinuado'
      });

      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao descontinuar produto:', err);
      setFeedbackMessage({
        id: itemId,
        type: 'error',
        message: 'Erro ao descontinuar produto. Tente novamente.'
      });
    } finally {
      setLoadingId(null);
    }
  };

  // Calcular margem de lucro
  const calcularMargem = (custo?: number, venda?: number) => {
    if (!custo || !venda || custo === 0) return null;
    return ((venda - custo) / custo * 100).toFixed(1);
  };

  // Verificar se está abaixo do mínimo
  const isAbaixoDoMinimo = (item: InventoryItem) => {
    return item.quantidade_minima && item.quantidade_atual < item.quantidade_minima;
  };

  if (!success) {
    return (
      <Card className="w-full border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Erro ao Buscar Estoque
          </CardTitle>
          <CardDescription className="text-red-600">
            {error || 'Erro desconhecido ao buscar itens do estoque'}
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
            <Package className="h-5 w-5" />
            Nenhum Item Encontrado
          </CardTitle>
          <CardDescription>
            Não há itens no estoque que correspondam aos filtros aplicados.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Inventário de Estoque
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {data.map((item) => (
            <AccordionItem key={item.id} value={item.id} className="border rounded-lg mb-3 px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-start justify-between w-full pr-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {item.nome_produto}
                        {isAbaixoDoMinimo(item) && (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{item.codigo_produto}</span>
                        {item.categoria && (
                          <span className="text-xs text-gray-500">• {item.categoria}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 mt-1 flex items-center gap-4">
                        <span className={`font-medium ${item.quantidade_atual === 0 ? 'text-red-600' : isAbaixoDoMinimo(item) ? 'text-yellow-600' : 'text-green-600'}`}>
                          {item.quantidade_atual} {item.unidade_medida || 'un'}
                        </span>
                        {item.quantidade_minima && (
                          <span className="text-xs text-gray-500">
                            Mín: {item.quantidade_minima}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-4 space-y-4">
                {/* Feedback Messages */}
                {feedbackMessage && feedbackMessage.id === item.id && (
                  <div className={`p-3 rounded-lg ${feedbackMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`text-sm ${feedbackMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                      {feedbackMessage.message}
                    </p>
                  </div>
                )}

                {/* Informações do Produto */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    {item.descricao && (
                      <div>
                        <span className="text-gray-500">Descrição:</span>
                        <p className="text-gray-700">{item.descricao}</p>
                      </div>
                    )}

                    {item.localizacao && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{item.localizacao}</span>
                      </div>
                    )}

                    {item.fornecedor && (
                      <div>
                        <span className="text-gray-500">Fornecedor:</span>
                        <p className="text-gray-700">{item.fornecedor}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {item.custo_unitario && (
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="text-gray-500">Custo:</span>
                        <span className="text-gray-700 font-medium">R$ {item.custo_unitario.toFixed(2)}</span>
                      </div>
                    )}

                    {item.preco_venda && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-gray-500">Venda:</span>
                        <span className="text-gray-700 font-medium">R$ {item.preco_venda.toFixed(2)}</span>
                      </div>
                    )}

                    {calcularMargem(item.custo_unitario, item.preco_venda) && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-500">Margem:</span>
                        <span className="text-blue-600 font-medium">
                          {calcularMargem(item.custo_unitario, item.preco_venda)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {item.observacoes && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{item.observacoes}</p>
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-3 pt-2">
                  {item.status !== 'descontinuado' && (
                    <>
                      {showAjustarForm === item.id ? (
                        <div className="flex gap-2 items-center flex-1">
                          <input
                            type="number"
                            value={novaQuantidade}
                            onChange={(e) => setNovaQuantidade(e.target.value)}
                            placeholder="Nova quantidade"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            disabled={loadingId === item.id}
                          />
                          <Button
                            onClick={() => handleAjustarQuantidade(item.id, item)}
                            disabled={loadingId === item.id}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {loadingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
                          </Button>
                          <Button
                            onClick={() => {
                              setShowAjustarForm(null);
                              setNovaQuantidade('');
                            }}
                            disabled={loadingId === item.id}
                            size="sm"
                            variant="outline"
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            setShowAjustarForm(item.id);
                            setNovaQuantidade(item.quantidade_atual.toString());
                          }}
                          disabled={loadingId === item.id}
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          Ajustar Quantidade
                        </Button>
                      )}

                      <Button
                        onClick={() => handleDescontinuar(item.id)}
                        disabled={loadingId === item.id}
                        size="sm"
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        {loadingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Descontinuar'}
                      </Button>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
