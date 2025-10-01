'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, ArrowUpDown, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon, CreditCard, Loader2, DollarSign } from 'lucide-react';
import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ExpandedState,
  getExpandedRowModel,
} from '@tanstack/react-table';

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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
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
        message: `Valor excede o pendente. Máximo: R$ ${valorPendente.toFixed(2)}`
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

  const columns: ColumnDef<ContaAPagar>[] = useMemo(() => [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => {
        return row.getCanExpand() ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={row.getToggleExpandedHandler()}
            className="p-0 h-6 w-6"
          >
            {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
          </Button>
        ) : null;
      },
    },
    {
      accessorKey: 'numero_conta',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          #Conta
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue('numero_conta')}</span>,
    },
    {
      accessorKey: 'fornecedor_nome',
      header: 'Fornecedor',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue('fornecedor_nome')}</span>
          {row.original.fornecedor_email && <span className="text-xs text-gray-500">{row.original.fornecedor_email}</span>}
        </div>
      ),
    },
    {
      accessorKey: 'categoria',
      header: 'Categoria',
      cell: ({ row }) => {
        const categoria = row.getValue<string | undefined>('categoria');
        return categoria ? <Badge variant="outline" className="text-xs">{categoria}</Badge> : '-';
      },
    },
    {
      accessorKey: 'valor_total',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => `R$ ${row.getValue<number>('valor_total').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    },
    {
      accessorKey: 'valor_pago',
      header: 'Pago',
      cell: ({ row }) => {
        const valor = row.getValue<number | undefined>('valor_pago');
        return valor !== undefined && valor > 0
          ? <span className="text-green-600">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          : '-';
      },
    },
    {
      accessorKey: 'valor_pendente',
      header: 'Pendente',
      cell: ({ row }) => {
        const valor = row.getValue<number | undefined>('valor_pendente');
        return valor !== undefined && valor > 0
          ? <span className="text-orange-600">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          : '-';
      },
    },
    {
      accessorKey: 'data_vencimento',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Vencimento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const data = row.getValue<string | undefined>('data_vencimento');
        if (!data) return '-';
        const diasAtraso = calcularDiasAtraso(data, row.original.data_pagamento, row.original.status);
        return (
          <div className="flex flex-col">
            <span>{new Date(data).toLocaleDateString('pt-BR')}</span>
            {diasAtraso !== null && diasAtraso > 0 && (
              <span className="text-xs text-red-600">{diasAtraso} dia{diasAtraso !== 1 ? 's' : ''} de atraso</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue<string | undefined>('status');
        return status ? <Badge className={getStatusColor(status)}>{status}</Badge> : null;
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const conta = row.original;
        if (conta.status === 'pago' || conta.status === 'cancelado') return null;
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              row.toggleExpanded();
              setShowPagamentoForm(conta.id);
              setShowCancelarForm(null);
            }}
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            Pagar
          </Button>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    state: {
      sorting,
      expanded,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
    getRowCanExpand: () => true,
  });

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
            <DollarSign className="h-5 w-5" />
            Nenhuma Conta Encontrada
          </CardTitle>
          <CardDescription>
            Não há contas a pagar que correspondam aos filtros aplicados.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">{message}</CardTitle>
          </div>
          <CardDescription className="text-red-600">
            {count} conta{count !== 1 ? 's' : ''} a pagar encontrada{count !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      {data && data.length > 0 && (
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="whitespace-nowrap">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => {
                    const conta = row.original;
                    return (
                      <>
                        <TableRow key={row.id} className="hover:bg-gray-50">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="whitespace-nowrap">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>

                        {row.getIsExpanded() && (
                          <TableRow>
                            <TableCell colSpan={columns.length} className="bg-gray-50">
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
                                  {conta.fornecedor_cnpj && (
                                    <div>
                                      <span className="font-semibold text-gray-700">CNPJ:</span>
                                      <span className="ml-2">{conta.fornecedor_cnpj}</span>
                                    </div>
                                  )}
                                  {conta.centro_custo && (
                                    <div>
                                      <span className="font-semibold text-gray-700">Centro de Custo:</span>
                                      <span className="ml-2">{conta.centro_custo}</span>
                                    </div>
                                  )}
                                </div>

                                {conta.itens_descricao && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-blue-700 mb-2">Itens/Serviços</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{conta.itens_descricao}</p>
                                  </div>
                                )}

                                {conta.descricao && (
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Descrição</p>
                                    <p className="text-sm text-gray-700">{conta.descricao}</p>
                                  </div>
                                )}

                                {conta.observacoes && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-yellow-700 mb-2">Observações</p>
                                    <p className="text-sm text-gray-700">{conta.observacoes}</p>
                                  </div>
                                )}

                                <div className="flex gap-3">
                                  {conta.nota_fiscal_url && (
                                    <a
                                      href={conta.nota_fiscal_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline"
                                    >
                                      📄 Ver Nota Fiscal
                                    </a>
                                  )}
                                  {conta.comprovante_pagamento_url && (
                                    <a
                                      href={conta.comprovante_pagamento_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline"
                                    >
                                      📋 Ver Comprovante
                                    </a>
                                  )}
                                </div>

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
                                        <div className="space-y-2 text-sm">
                                          <p>Valor Total: <span className="font-semibold">R$ {conta.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                                          {conta.valor_pago !== undefined && conta.valor_pago > 0 && (
                                            <p>Já Pago: <span className="font-semibold text-green-600">R$ {conta.valor_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
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
                                              <option value="Transferencia">Transferência</option>
                                              <option value="Boleto">Boleto</option>
                                              <option value="Cartao">Cartão</option>
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
                                      <div className="space-y-3 bg-white border rounded-lg p-4">
                                        <p className="font-semibold text-gray-700">Cancelar Conta</p>
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">Motivo do Cancelamento</label>
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
            </div>
          </div>

          {/* Pagination */}
          <div className="border-t bg-white py-4 px-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} até{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                data.length
              )}{' '}
              de {data.length} registros
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
