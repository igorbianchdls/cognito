import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, FileText, Building2, Calendar, DollarSign, AlertCircle, Clock } from 'lucide-react';

interface Invoice {
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

interface InvoicesListProps {
  success: boolean;
  count: number;
  data: Invoice[];
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

export default function InvoicesList({ success, count, data, message, error }: InvoicesListProps) {
  if (!success && error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao buscar faturas</CardTitle>
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
            {count} fatura{count !== 1 ? 's' : ''} encontrada{count !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-1">
          {data.map((invoice) => {
            const diasAtraso = calcularDiasAtraso(invoice.data_vencimento, invoice.data_pagamento, invoice.status);

            return (
              <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <CardTitle className="text-lg">Fatura #{invoice.numero_fatura}</CardTitle>
                        <CardDescription className="text-sm mt-1 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {invoice.cliente_nome}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center flex-col">
                      {invoice.status && (
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
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
                    {invoice.cliente_email && <span>{invoice.cliente_email}</span>}
                    {invoice.data_emissao && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Emissão: {new Date(invoice.data_emissao).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm font-medium mt-2">
                    <span className="flex items-center gap-1 text-blue-600">
                      <DollarSign className="h-4 w-4" />
                      Total: R$ {invoice.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {invoice.valor_pago !== undefined && invoice.valor_pago > 0 && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Pago: R$ {invoice.valor_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    {invoice.valor_pendente !== undefined && invoice.valor_pendente > 0 && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <Clock className="h-4 w-4" />
                        Pendente: R$ {invoice.valor_pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="content" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-3 cursor-pointer">
                        <div className="w-full pointer-events-none">
                          <p className="text-xs font-semibold text-gray-500 mb-2">DETALHES DA FATURA</p>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(invoice.status)}
                            <span className="text-sm text-gray-700">
                              {invoice.status === 'pago' && invoice.data_pagamento
                                ? `Pago em ${new Date(invoice.data_pagamento).toLocaleDateString('pt-BR')}`
                                : invoice.status === 'vencido'
                                ? `Vencida ${diasAtraso ? `há ${diasAtraso} dias` : ''}`
                                : invoice.status === 'pendente' && invoice.data_vencimento
                                ? `Vence em ${new Date(invoice.data_vencimento).toLocaleDateString('pt-BR')}`
                                : `Status: ${invoice.status}`}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          {invoice.itens_descricao && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-blue-700 mb-2">📋 ITENS DA FATURA</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.itens_descricao}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {invoice.data_vencimento && (
                              <div>
                                <p className="text-xs text-gray-500 font-semibold">Vencimento</p>
                                <p className="text-gray-700">{new Date(invoice.data_vencimento).toLocaleDateString('pt-BR')}</p>
                              </div>
                            )}
                            {invoice.metodo_pagamento && (
                              <div>
                                <p className="text-xs text-gray-500 font-semibold">Método de Pagamento</p>
                                <p className="text-gray-700">{invoice.metodo_pagamento}</p>
                              </div>
                            )}
                          </div>

                          {invoice.observacoes && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-yellow-700 mb-2">💬 OBSERVAÇÕES</p>
                              <p className="text-sm text-gray-700">{invoice.observacoes}</p>
                            </div>
                          )}

                          {invoice.nota_fiscal_url && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-green-700 mb-2">📄 NOTA FISCAL</p>
                              <a
                                href={invoice.nota_fiscal_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Baixar Nota Fiscal
                              </a>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {invoice.created_at && (
                    <p className="text-xs text-gray-400 pt-3 border-t mt-3">
                      Registrada em: {new Date(invoice.created_at).toLocaleDateString('pt-BR')}
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
