import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Video } from 'lucide-react';

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
              <CardContent className="space-y-3">
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
                    <p className="text-sm text-gray-700 line-clamp-3">{video.script}</p>
                  </div>
                )}
                {video.created_at && (
                  <p className="text-xs text-gray-400 pt-2 border-t">
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