import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, Receipt, User, Calendar, DollarSign, FileText, Clock, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface ReceiptItem {
  id: string;
  numero_recibo: string;
  tipo: string;
  solicitante_nome: string;
  solicitante_email?: string;
  fornecedor_nome: string;
  valor: number;
  data_emissao?: string;
  data_envio?: string;
  categoria: string;
  descricao?: string;
  anexo_url?: string;
  status?: string;
  aprovador_nome?: string;
  data_aprovacao?: string;
  motivo_reprovacao?: string;
  metodo_reembolso?: string;
  observacoes?: string;
  created_at?: string;
}

interface ReceiptsListProps {
  success: boolean;
  count: number;
  data: ReceiptItem[];
  message: string;
  error?: string;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'aprovado': return 'bg-green-100 text-green-800 border-green-300';
    case 'reprovado': return 'bg-red-100 text-red-800 border-red-300';
    case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'reembolsado': return 'bg-blue-100 text-blue-800 border-blue-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getTipoColor = (tipo?: string) => {
  switch (tipo) {
    case 'reembolso': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'compra': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'servico': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    case 'doacao': return 'bg-pink-100 text-pink-800 border-pink-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getCategoriaColor = (categoria?: string) => {
  switch (categoria) {
    case 'alimentacao': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'transporte': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'hospedagem': return 'bg-teal-100 text-teal-800 border-teal-300';
    case 'material': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'equipamento': return 'bg-slate-100 text-slate-800 border-slate-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'aprovado': return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'reprovado': return <XCircle className="h-4 w-4 text-red-600" />;
    case 'pendente': return <Clock className="h-4 w-4 text-yellow-600" />;
    case 'reembolsado': return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    default: return <FileText className="h-4 w-4 text-gray-600" />;
  }
};

export default function ReceiptsList({ success, count, data, message, error }: ReceiptsListProps) {
  if (!success && error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao buscar recibos</CardTitle>
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
            {count} recibo{count !== 1 ? 's' : ''} encontrado{count !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-1">
          {data.map((receipt) => (
            <Card key={receipt.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Receipt className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-lg">Recibo #{receipt.numero_recibo}</CardTitle>
                      <CardDescription className="text-sm mt-1 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {receipt.solicitante_nome}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center flex-col">
                    {receipt.status && (
                      <Badge className={getStatusColor(receipt.status)}>
                        {receipt.status}
                      </Badge>
                    )}
                    {receipt.tipo && (
                      <Badge className={getTipoColor(receipt.tipo)}>
                        {receipt.tipo}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 flex-wrap">
                  {receipt.solicitante_email && <span>{receipt.solicitante_email}</span>}
                  {receipt.data_emissao && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Emissão: {new Date(receipt.data_emissao).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  <Badge className={getCategoriaColor(receipt.categoria)}>
                    {receipt.categoria}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium mt-2">
                  <span className="flex items-center gap-1 text-blue-600">
                    <DollarSign className="h-4 w-4" />
                    R$ {receipt.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">{receipt.fornecedor_nome}</span>
                </div>
              </CardHeader>

              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="content" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-3 cursor-pointer">
                      <div className="w-full pointer-events-none">
                        <p className="text-xs font-semibold text-gray-500 mb-2">DETALHES DO RECIBO</p>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(receipt.status)}
                          <span className="text-sm text-gray-700">
                            {receipt.status === 'aprovado' && receipt.data_aprovacao
                              ? `Aprovado em ${new Date(receipt.data_aprovacao).toLocaleDateString('pt-BR')} por ${receipt.aprovador_nome}`
                              : receipt.status === 'reprovado'
                              ? 'Reprovado - Ver motivo abaixo'
                              : receipt.status === 'reembolsado'
                              ? `Reembolsado via ${receipt.metodo_reembolso}`
                              : 'Aguardando aprovação'}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {receipt.descricao && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-2">📝 DESCRIÇÃO</p>
                            <p className="text-sm text-gray-700">{receipt.descricao}</p>
                          </div>
                        )}

                        {receipt.motivo_reprovacao && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-700 mb-2">❌ MOTIVO DA REPROVAÇÃO</p>
                            <p className="text-sm text-gray-700">{receipt.motivo_reprovacao}</p>
                          </div>
                        )}

                        {receipt.observacoes && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-yellow-700 mb-2">💬 OBSERVAÇÕES</p>
                            <p className="text-sm text-gray-700">{receipt.observacoes}</p>
                          </div>
                        )}

                        {receipt.anexo_url && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-green-700 mb-2">📎 ANEXO</p>
                            <a
                              href={receipt.anexo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              Visualizar recibo/nota fiscal
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {!receipt.anexo_url && receipt.status === 'pendente' && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              ATENÇÃO: ANEXO AUSENTE
                            </p>
                            <p className="text-sm text-gray-700">Recibo sem comprovante anexado</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {receipt.data_envio && (
                            <div>
                              <p className="text-xs text-gray-500 font-semibold">Data de Envio</p>
                              <p className="text-gray-700">{new Date(receipt.data_envio).toLocaleDateString('pt-BR')}</p>
                            </div>
                          )}
                          {receipt.aprovador_nome && (
                            <div>
                              <p className="text-xs text-gray-500 font-semibold">Aprovador</p>
                              <p className="text-gray-700">{receipt.aprovador_nome}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {receipt.created_at && (
                  <p className="text-xs text-gray-400 pt-3 border-t mt-3">
                    Registrado em: {new Date(receipt.created_at).toLocaleDateString('pt-BR')}
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
