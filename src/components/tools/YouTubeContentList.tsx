import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, Video, Eye, ThumbsUp, MessageCircle, TrendingUp, UserPlus } from 'lucide-react';

interface YouTubeContent {
  id: string;
  titulo: string;
  hook?: string;
  intro?: string;
  value_proposition?: string;
  script?: string;
  categoria?: string;
  status?: string;
  created_at?: string;
  views?: number;
  likes?: number;
  comments?: number;
  retention_rate?: number;
  subscribers_gained?: number;
}

interface YouTubeContentListProps {
  success: boolean;
  count: number;
  data: YouTubeContent[];
  message: string;
  error?: string;
}

export default function YouTubeContentList({ success, count, data, message, error }: YouTubeContentListProps) {
  if (!success && error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao buscar vídeos do YouTube</CardTitle>
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
            {count} vídeo{count !== 1 ? 's' : ''} encontrado{count !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Video className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <CardTitle className="text-lg">{video.titulo}</CardTitle>
                  </div>
                  {video.status && (
                    <Badge
                      variant={
                        video.status === 'published' ? 'default' :
                        video.status === 'draft' ? 'secondary' :
                        'outline'
                      }
                      className="ml-2"
                    >
                      {video.status}
                    </Badge>
                  )}
                </div>
                {video.categoria && (
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{video.categoria}</Badge>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="content" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-3 cursor-pointer">
                      <div className="w-full pointer-events-none">
                        <p className="text-xs font-semibold text-gray-500 mb-2">MÉTRICAS DE PERFORMANCE</p>
                        {(video.views !== undefined || video.likes !== undefined || video.comments !== undefined || video.retention_rate !== undefined || video.subscribers_gained !== undefined) ? (
                          <div className="grid grid-cols-2 gap-2">
                            {video.views !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <Eye className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-gray-700">{video.views.toLocaleString('pt-BR')} visualizações</span>
                              </div>
                            )}
                            {video.likes !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <ThumbsUp className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-gray-700">{video.likes.toLocaleString('pt-BR')} likes</span>
                              </div>
                            )}
                            {video.comments !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <MessageCircle className="h-4 w-4 text-purple-500" />
                                <span className="text-sm text-gray-700">{video.comments.toLocaleString('pt-BR')} comentários</span>
                              </div>
                            )}
                            {video.retention_rate !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <TrendingUp className="h-4 w-4 text-orange-500" />
                                <span className="text-sm text-gray-700">{video.retention_rate.toFixed(1)}% retenção</span>
                              </div>
                            )}
                            {video.subscribers_gained !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <UserPlus className="h-4 w-4 text-red-500" />
                                <span className="text-sm text-gray-700">+{video.subscribers_gained.toLocaleString('pt-BR')} inscritos</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">Sem métricas disponíveis</p>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {video.hook && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">HOOK (0-10s)</p>
                            <p className="text-sm text-gray-700">{video.hook}</p>
                          </div>
                        )}
                        {video.intro && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">INTRO (10-30s)</p>
                            <p className="text-sm text-gray-700">{video.intro}</p>
                          </div>
                        )}
                        {video.value_proposition && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">VALUE PROPOSITION (30s-1min)</p>
                            <p className="text-sm text-gray-700">{video.value_proposition}</p>
                          </div>
                        )}
                        {video.script && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">SCRIPT</p>
                            <p className="text-sm text-gray-700">{video.script}</p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {video.created_at && (
                  <p className="text-xs text-gray-400 pt-3 border-t mt-3">
                    Criado em: {new Date(video.created_at).toLocaleDateString('pt-BR')}
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