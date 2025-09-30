import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Instagram } from 'lucide-react';

interface ReelsContent {
  id: string;
  titulo: string;
  hook?: string;
  hook_expansion?: string;
  script?: string;
  status?: string;
  created_at?: string;
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
              <CardContent className="space-y-3">
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
                    <p className="text-sm text-gray-700 line-clamp-4">{reel.script}</p>
                  </div>
                )}
                {reel.created_at && (
                  <p className="text-xs text-gray-400 pt-2 border-t">
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