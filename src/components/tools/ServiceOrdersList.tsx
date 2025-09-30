import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, Wrench, User, Calendar, DollarSign, FileText, Tool, CheckCircle } from 'lucide-react';

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
    case 'em_andamento': return <Tool className="h-4 w-4 text-blue-600 animate-pulse" />;
    case 'aberta': return <FileText className="h-4 w-4 text-yellow-600" />;
    default: return <Wrench className="h-4 w-4 text-gray-600" />;
  }
};

export default function ServiceOrdersList({ success, count, data, message, error }: ServiceOrdersListProps) {
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
