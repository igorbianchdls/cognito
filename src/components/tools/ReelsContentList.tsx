import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, Instagram, Eye, Heart, MessageCircle, Bookmark, TrendingUp, UserPlus } from 'lucide-react';

interface ReelsContent {
  id: string;
  titulo: string;
  hook?: string;
  hook_expansion?: string;
  script?: string;
  status?: string;
  created_at?: string;
  views?: number;
  likes?: number;
  comments?: number;
  saves?: number;
  engagement_rate?: number;
  follows?: number;
}

interface ReelsContentListProps {
  success: boolean;
  count: number;
  data: ReelsContent[];
  message: string;
  error?: string;
}

export default function ReelsContentList({ success, count, data, message, error }: ReelsContentListProps) {
  if (!success && error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao buscar Reels</CardTitle>
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
            {count} Reel{count !== 1 ? 's' : ''} encontrado{count !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((reel) => (
            <Card key={reel.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Instagram className="h-5 w-5 text-pink-500 flex-shrink-0" />
                    <CardTitle className="text-lg">{reel.titulo}</CardTitle>
                  </div>
                  {reel.status && (
                    <Badge
                      variant={
                        reel.status === 'published' ? 'default' :
                        reel.status === 'draft' ? 'secondary' :
                        'outline'
                      }
                      className="ml-2"
                    >
                      {reel.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="content" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-3 cursor-pointer">
                      <div className="w-full pointer-events-none">
                        <p className="text-xs font-semibold text-gray-500 mb-2">MÉTRICAS DE PERFORMANCE</p>
                        {(reel.views !== undefined || reel.likes !== undefined || reel.comments !== undefined || reel.saves !== undefined || reel.engagement_rate !== undefined || reel.follows !== undefined) ? (
                          <div className="grid grid-cols-2 gap-2">
                            {reel.views !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <Eye className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-gray-700">{reel.views.toLocaleString('pt-BR')} views</span>
                              </div>
                            )}
                            {reel.likes !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <Heart className="h-4 w-4 text-pink-500" />
                                <span className="text-sm text-gray-700">{reel.likes.toLocaleString('pt-BR')} likes</span>
                              </div>
                            )}
                            {reel.comments !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <MessageCircle className="h-4 w-4 text-purple-500" />
                                <span className="text-sm text-gray-700">{reel.comments.toLocaleString('pt-BR')} comentários</span>
                              </div>
                            )}
                            {reel.saves !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <Bookmark className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm text-gray-700">{reel.saves.toLocaleString('pt-BR')} salvos</span>
                              </div>
                            )}
                            {reel.engagement_rate !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <TrendingUp className="h-4 w-4 text-orange-500" />
                                <span className="text-sm text-gray-700">{reel.engagement_rate.toFixed(1)}% engajamento</span>
                              </div>
                            )}
                            {reel.follows !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <UserPlus className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-gray-700">+{reel.follows.toLocaleString('pt-BR')} seguidores</span>
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
                        {reel.hook && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">HOOK (1-2s)</p>
                            <p className="text-sm text-gray-700 font-medium">{reel.hook}</p>
                          </div>
                        )}
                        {reel.hook_expansion && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">HOOK EXPANSION</p>
                            <p className="text-sm text-gray-700">{reel.hook_expansion}</p>
                          </div>
                        )}
                        {reel.script && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">SCRIPT</p>
                            <p className="text-sm text-gray-700">{reel.script}</p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {reel.created_at && (
                  <p className="text-xs text-gray-400 pt-3 border-t mt-3">
                    Criado em: {new Date(reel.created_at).toLocaleDateString('pt-BR')}
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