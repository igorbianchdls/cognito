import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Video, Instagram } from 'lucide-react';

interface YouTubeData {
  id: string;
  titulo: string;
  hook?: string;
  intro?: string;
  value_proposition?: string;
  script?: string;
  categoria?: string;
}

interface ReelsData {
  id: string;
  titulo: string;
  hook?: string;
  hook_expansion?: string;
  script?: string;
}

interface ContentCreationSuccessProps {
  success: boolean;
  data?: YouTubeData | ReelsData;
  message: string;
  error?: string;
  contentType: 'youtube' | 'reels';
}

function isYouTubeData(data: YouTubeData | ReelsData): data is YouTubeData {
  return 'intro' in data || 'value_proposition' in data;
}

export default function ContentCreationSuccess({ success, data, message, error, contentType }: ContentCreationSuccessProps) {
  if (!success && error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao criar conteúdo</CardTitle>
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
        </CardHeader>
      </Card>

      {data && (
        <Card className="border-2 border-green-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              {contentType === 'youtube' ? (
                <Video className="h-5 w-5 text-red-500" />
              ) : (
                <Instagram className="h-5 w-5 text-pink-500" />
              )}
              <CardTitle>{data.titulo}</CardTitle>
            </div>
            <CardDescription className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{contentType === 'youtube' ? 'YouTube' : 'Instagram Reels'}</Badge>
              <Badge variant="secondary">Criado com sucesso</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.hook && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  HOOK {contentType === 'youtube' ? '(0-10s)' : '(1-2s)'}
                </p>
                <p className="text-sm text-gray-700">{data.hook}</p>
              </div>
            )}

            {isYouTubeData(data) && (
              <>
                {data.intro && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">INTRO (10-30s)</p>
                    <p className="text-sm text-gray-700">{data.intro}</p>
                  </div>
                )}
                {data.value_proposition && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">VALUE PROPOSITION (30s-1min)</p>
                    <p className="text-sm text-gray-700">{data.value_proposition}</p>
                  </div>
                )}
                {data.categoria && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">CATEGORIA</p>
                    <Badge>{data.categoria}</Badge>
                  </div>
                )}
              </>
            )}

            {!isYouTubeData(data) && data.hook_expansion && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">HOOK EXPANSION</p>
                <p className="text-sm text-gray-700">{data.hook_expansion}</p>
              </div>
            )}

            {data.script && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">SCRIPT</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.script}</p>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-xs text-gray-400">ID: {data.id}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}