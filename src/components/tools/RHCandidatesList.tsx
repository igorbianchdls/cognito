import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, User, Briefcase, TrendingUp, Target, Award, AlertTriangle } from 'lucide-react';

interface RHCandidate {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  vaga: string;
  curriculo_resumo?: string;
  call_transcription?: string;
  call_summary?: string;
  pontos_fortes?: string;
  pontos_atencao?: string;
  fit_cultural_score?: number;
  fit_tecnico_score?: number;
  recomendacao?: string;
  status?: string;
  data_entrevista?: string;
  created_at?: string;
}

interface RHCandidatesListProps {
  success: boolean;
  count: number;
  data: RHCandidate[];
  message: string;
  error?: string;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'aprovado': return 'bg-green-100 text-green-800 border-green-300';
    case 'reprovado': return 'bg-red-100 text-red-800 border-red-300';
    case 'em_analise': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getScoreColor = (score?: number) => {
  if (!score) return 'text-gray-400';
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
};

export default function RHCandidatesList({ success, count, data, message, error }: RHCandidatesListProps) {
  if (!success && error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao buscar candidatos</CardTitle>
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
            {count} candidato{count !== 1 ? 's' : ''} encontrado{count !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-1">
          {data.map((candidate) => (
            <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <User className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-lg">{candidate.nome}</CardTitle>
                      <CardDescription className="text-sm mt-1 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {candidate.vaga}
                      </CardDescription>
                    </div>
                  </div>
                  {candidate.status && (
                    <Badge className={getStatusColor(candidate.status)}>
                      {candidate.status}
                    </Badge>
                  )}
                </div>
                {(candidate.email || candidate.telefone) && (
                  <div className="flex gap-4 text-xs text-gray-500 mt-2">
                    {candidate.email && <span>{candidate.email}</span>}
                    {candidate.telefone && <span>{candidate.telefone}</span>}
                  </div>
                )}
                {candidate.data_entrevista && (
                  <p className="text-xs text-gray-500 mt-1">
                    Entrevista: {new Date(candidate.data_entrevista).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </CardHeader>

              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="content" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-3 cursor-pointer">
                      <div className="w-full pointer-events-none">
                        <p className="text-xs font-semibold text-gray-500 mb-2">SCORES DE AVALIAÇÃO</p>
                        <div className="grid grid-cols-2 gap-3">
                          {candidate.fit_tecnico_score !== undefined && (
                            <div className="flex items-center gap-2">
                              <Target className={`h-4 w-4 ${getScoreColor(candidate.fit_tecnico_score)}`} />
                              <div className="text-left">
                                <p className="text-xs text-gray-500">Fit Técnico</p>
                                <p className={`text-sm font-semibold ${getScoreColor(candidate.fit_tecnico_score)}`}>
                                  {(candidate.fit_tecnico_score * 100).toFixed(0)}%
                                </p>
                              </div>
                            </div>
                          )}
                          {candidate.fit_cultural_score !== undefined && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className={`h-4 w-4 ${getScoreColor(candidate.fit_cultural_score)}`} />
                              <div className="text-left">
                                <p className="text-xs text-gray-500">Fit Cultural</p>
                                <p className={`text-sm font-semibold ${getScoreColor(candidate.fit_cultural_score)}`}>
                                  {(candidate.fit_cultural_score * 100).toFixed(0)}%
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {candidate.curriculo_resumo && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-2">📋 CURRÍCULO</p>
                            <p className="text-sm text-gray-700">{candidate.curriculo_resumo}</p>
                          </div>
                        )}

                        {candidate.call_summary && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-purple-700 mb-2">💬 RESUMO DA ENTREVISTA</p>
                            <p className="text-sm text-gray-700">{candidate.call_summary}</p>
                          </div>
                        )}

                        {candidate.pontos_fortes && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                              <Award className="h-3 w-3 text-green-600" />
                              PONTOS FORTES
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{candidate.pontos_fortes}</p>
                          </div>
                        )}

                        {candidate.pontos_atencao && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-orange-600" />
                              PONTOS DE ATENÇÃO
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{candidate.pontos_atencao}</p>
                          </div>
                        )}

                        {candidate.recomendacao && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-green-700 mb-2">✅ RECOMENDAÇÃO</p>
                            <p className="text-sm text-gray-700 font-medium">{candidate.recomendacao}</p>
                          </div>
                        )}

                        {candidate.call_transcription && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2">🎙️ TRANSCRIÇÃO COMPLETA</p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-96 overflow-y-auto">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {candidate.call_transcription}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {candidate.created_at && (
                  <p className="text-xs text-gray-400 pt-3 border-t mt-3">
                    Cadastrado em: {new Date(candidate.created_at).toLocaleDateString('pt-BR')}
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
