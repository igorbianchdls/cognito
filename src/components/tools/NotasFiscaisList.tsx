import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, FileText, Building2, Calendar, DollarSign, TrendingDown, TrendingUp, Download, ExternalLink } from 'lucide-react';

interface NotaFiscal {
  id: string;
  numero_nfe: string;
  chave_acesso: string;
  serie: string;
  tipo: string;
  emitente_nome: string;
  emitente_cnpj: string;
  destinatario_nome: string;
  destinatario_cnpj: string;
  valor_total: number;
  valor_produtos: number;
  valor_icms?: number;
  valor_ipi?: number;
  valor_pis?: number;
  valor_cofins?: number;
  data_emissao?: string;
  data_entrada_saida?: string;
  status?: string;
  natureza_operacao?: string;
  cfop?: string;
  xml_url?: string;
  pdf_url?: string;
  protocolo_autorizacao?: string;
  observacoes?: string;
  created_at?: string;
}

interface NotasFiscaisListProps {
  success: boolean;
  count: number;
  data: NotaFiscal[];
  message: string;
  error?: string;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'autorizada': return 'bg-green-100 text-green-800 border-green-300';
    case 'cancelada': return 'bg-red-100 text-red-800 border-red-300';
    case 'denegada': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'inutilizada': return 'bg-gray-100 text-gray-800 border-gray-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getTipoColor = (tipo?: string) => {
  switch (tipo) {
    case 'entrada': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'saida': return 'bg-purple-100 text-purple-800 border-purple-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'autorizada': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'cancelada': return <XCircle className="h-4 w-4 text-red-600" />;
    case 'denegada': return <XCircle className="h-4 w-4 text-orange-600" />;
    case 'inutilizada': return <XCircle className="h-4 w-4 text-gray-600" />;
    default: return <FileText className="h-4 w-4 text-gray-600" />;
  }
};

const formatCNPJ = (cnpj: string) => {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

const formatChaveAcesso = (chave: string) => {
  return chave.replace(/(\d{4})/g, '$1 ').trim();
};

export default function NotasFiscaisList({ success, count, data, message, error }: NotasFiscaisListProps) {
  if (!success && error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao buscar notas fiscais</CardTitle>
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
            {count} nota{count !== 1 ? 's' : ''} fiscal{count !== 1 ? 'ais' : ''} encontrada{count !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-1">
          {data.map((nfe) => (
            <Card key={nfe.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-lg">NFe #{nfe.numero_nfe} - Série {nfe.serie}</CardTitle>
                      <CardDescription className="text-xs mt-1 font-mono text-gray-500">
                        {formatChaveAcesso(nfe.chave_acesso)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center flex-col">
                    {nfe.status && (
                      <Badge className={getStatusColor(nfe.status)}>
                        {nfe.status}
                      </Badge>
                    )}
                    {nfe.tipo && (
                      <Badge className={getTipoColor(nfe.tipo)}>
                        {nfe.tipo === 'entrada' ? (
                          <><TrendingDown className="h-3 w-3 mr-1" />Entrada</>
                        ) : (
                          <><TrendingUp className="h-3 w-3 mr-1" />Saída</>
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-3">
                  <div>
                    <p className="text-gray-500 font-semibold">Emitente</p>
                    <p className="font-medium">{nfe.emitente_nome}</p>
                    <p className="text-gray-500">{formatCNPJ(nfe.emitente_cnpj)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold">Destinatário</p>
                    <p className="font-medium">{nfe.destinatario_nome}</p>
                    <p className="text-gray-500">{formatCNPJ(nfe.destinatario_cnpj)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium mt-3 flex-wrap">
                  <span className="flex items-center gap-1 text-blue-600">
                    <DollarSign className="h-4 w-4" />
                    Total: R$ {nfe.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  {nfe.data_emissao && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(nfe.data_emissao).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {nfe.cfop && (
                    <Badge variant="outline" className="text-xs">
                      CFOP {nfe.cfop}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="content" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-3 cursor-pointer">
                      <div className="w-full pointer-events-none">
                        <p className="text-xs font-semibold text-gray-500 mb-2">DETALHES DA NOTA FISCAL</p>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(nfe.status)}
                          <span className="text-sm text-gray-700">
                            {nfe.status === 'autorizada' && nfe.protocolo_autorizacao
                              ? `Autorizada - Protocolo ${nfe.protocolo_autorizacao}`
                              : nfe.status === 'cancelada'
                              ? 'Nota fiscal cancelada'
                              : nfe.status === 'denegada'
                              ? 'Denegada pela SEFAZ'
                              : `Status: ${nfe.status}`}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {nfe.natureza_operacao && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-2">📋 NATUREZA DA OPERAÇÃO</p>
                            <p className="text-sm text-gray-700">{nfe.natureza_operacao}</p>
                          </div>
                        )}

                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-green-700 mb-3">💰 VALORES E IMPOSTOS</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">Produtos</p>
                              <p className="font-semibold">R$ {nfe.valor_produtos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            {nfe.valor_icms !== undefined && nfe.valor_icms > 0 && (
                              <div>
                                <p className="text-gray-500 text-xs">ICMS</p>
                                <p className="font-semibold">R$ {nfe.valor_icms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                            )}
                            {nfe.valor_ipi !== undefined && nfe.valor_ipi > 0 && (
                              <div>
                                <p className="text-gray-500 text-xs">IPI</p>
                                <p className="font-semibold">R$ {nfe.valor_ipi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                            )}
                            {nfe.valor_pis !== undefined && nfe.valor_pis > 0 && (
                              <div>
                                <p className="text-gray-500 text-xs">PIS</p>
                                <p className="font-semibold">R$ {nfe.valor_pis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                            )}
                            {nfe.valor_cofins !== undefined && nfe.valor_cofins > 0 && (
                              <div>
                                <p className="text-gray-500 text-xs">COFINS</p>
                                <p className="font-semibold">R$ {nfe.valor_cofins.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {nfe.observacoes && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-yellow-700 mb-2">💬 OBSERVAÇÕES</p>
                            <p className="text-sm text-gray-700">{nfe.observacoes}</p>
                          </div>
                        )}

                        {(nfe.xml_url || nfe.pdf_url) && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-purple-700 mb-2">📎 DOCUMENTOS</p>
                            <div className="flex gap-3">
                              {nfe.xml_url && (
                                <a
                                  href={nfe.xml_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <Download className="h-3 w-3" />
                                  XML da NFe
                                </a>
                              )}
                              {nfe.pdf_url && (
                                <a
                                  href={nfe.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  DANFE (PDF)
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {nfe.created_at && (
                  <p className="text-xs text-gray-400 pt-3 border-t mt-3">
                    Registrada em: {new Date(nfe.created_at).toLocaleDateString('pt-BR')}
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
