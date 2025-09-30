import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, Phone, TrendingUp, DollarSign, Smile, Meh, Frown, Target, Users } from 'lucide-react';

interface SalesCall {
  id: string;
  call_date?: string;
  duration_minutes?: number;
  client_name: string;
  client_company?: string;
  sales_rep: string;
  transcription?: string;
  summary?: string;
  key_points?: string;
  objections_identified?: string;
  objections_handled?: string;
  sentiment_score?: number;
  engagement_score?: number;
  close_probability?: number;
  next_steps?: string;
  follow_up_date?: string;
  status?: string;
  deal_value?: number;
  notes?: string;
  created_at?: string;
}

interface SalesCallsListProps {
  success: boolean;
  count: number;
  data: SalesCall[];
  message: string;
  error?: string;
}

// Helper para cor do status
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'closed-won': return 'bg-green-100 text-green-800 border-green-300';
    case 'closed-lost': return 'bg-red-100 text-red-800 border-red-300';
    case 'negotiation': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'proposal': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'qualification': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'prospecting': return 'bg-gray-100 text-gray-800 border-gray-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Helper para ícone de sentiment
const getSentimentIcon = (score?: number) => {
  if (!score) return <Meh className="h-4 w-4 text-gray-400" />;
  if (score >= 0.5) return <Smile className="h-4 w-4 text-green-500" />;
  if (score <= -0.5) return <Frown className="h-4 w-4 text-red-500" />;
  return <Meh className="h-4 w-4 text-yellow-500" />;
};

export default function SalesCallsList({ success, count, data, message, error }: SalesCallsListProps) {
  if (!success && error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao buscar calls de vendas</CardTitle>
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
            {count} call{count !== 1 ? 's' : ''} de vendas encontrada{count !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-1">
          {data.map((call) => (
            <Card key={call.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Phone className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-lg">{call.client_name}</CardTitle>
                      {call.client_company && (
                        <CardDescription className="text-sm mt-1">{call.client_company}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {call.status && (
                      <Badge className={getStatusColor(call.status)}>
                        {call.status}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {call.sales_rep}
                  </span>
                  {call.call_date && (
                    <span>
                      {new Date(call.call_date).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {call.duration_minutes && (
                    <span>{call.duration_minutes} min</span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="content" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-3 cursor-pointer">
                      <div className="w-full pointer-events-none">
                        <p className="text-xs font-semibold text-gray-500 mb-2">MÉTRICAS DA CALL</p>
                        <div className="grid grid-cols-2 gap-2">
                          {call.sentiment_score !== undefined && (
                            <div className="flex items-center gap-1.5">
                              {getSentimentIcon(call.sentiment_score)}
                              <span className="text-sm text-gray-700">
                                Sentimento: {call.sentiment_score.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {call.engagement_score !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="h-4 w-4 text-purple-500" />
                              <span className="text-sm text-gray-700">
                                {call.engagement_score.toFixed(0)}% engajamento
                              </span>
                            </div>
                          )}
                          {call.close_probability !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <Target className="h-4 w-4 text-orange-500" />
                              <span className="text-sm text-gray-700">
                                {call.close_probability.toFixed(0)}% chance fechamento
                              </span>
                            </div>
                          )}
                          {call.deal_value !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-700">
                                R$ {call.deal_value.toLocaleString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {call.summary && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-2">📋 RESUMO</p>
                            <p className="text-sm text-gray-700">{call.summary}</p>
                          </div>
                        )}

                        {call.key_points && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2">✨ PONTOS-CHAVE</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{call.key_points}</p>
                          </div>
                        )}

                        {call.objections_identified && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2">🚧 OBJEÇÕES IDENTIFICADAS</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{call.objections_identified}</p>
                          </div>
                        )}

                        {call.objections_handled && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2">✅ COMO FORAM TRATADAS</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{call.objections_handled}</p>
                          </div>
                        )}

                        {call.next_steps && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-green-700 mb-2">🎯 PRÓXIMOS PASSOS</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{call.next_steps}</p>
                            {call.follow_up_date && (
                              <p className="text-xs text-green-600 mt-2">
                                Follow-up: {new Date(call.follow_up_date).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        )}

                        {call.transcription && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2">📞 TRANSCRIÇÃO COMPLETA</p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-96 overflow-y-auto">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                                {call.transcription}
                              </p>
                            </div>
                          </div>
                        )}

                        {call.notes && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2">📝 NOTAS</p>
                            <p className="text-sm text-gray-600 italic">{call.notes}</p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {call.created_at && (
                  <p className="text-xs text-gray-400 pt-3 border-t mt-3">
                    Registrado em: {new Date(call.created_at).toLocaleDateString('pt-BR')}
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
