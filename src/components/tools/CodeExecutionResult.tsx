'use client';

import { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  ImageIcon,
  PlayIcon,
  AlertTriangleIcon,
  CheckCircleIcon
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent
} from '@/components/ai-elements/artifact';

interface CodeExecutionFile {
  name: string;
  url?: string;
  type: string;
  size?: number;
}

interface CodeExecutionImage {
  data: string;
  format: string;
  name?: string;
}

interface CodeExecutionResultProps {
  result: {
    stdout?: string;
    stderr?: string;
    files?: CodeExecutionFile[];
    images?: CodeExecutionImage[];
    executedCode?: string;
    success: boolean;
    executionTime?: number;
  };
}

export default function CodeExecutionResult({ result }: CodeExecutionResultProps) {
  const [showCode, setShowCode] = useState(false);
  const [expandedImage, setExpandedImage] = useState<number | null>(null);

  const handleCopyCode = async () => {
    if (result.executedCode) {
      try {
        await navigator.clipboard.writeText(result.executedCode);
        console.log('Código copiado para clipboard');
      } catch (error) {
        console.error('Erro ao copiar código:', error);
      }
    }
  };

  const handleCopyOutput = async () => {
    if (result.stdout) {
      try {
        await navigator.clipboard.writeText(result.stdout);
        console.log('Output copiado para clipboard');
      } catch (error) {
        console.error('Erro ao copiar output:', error);
      }
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'xlsx':
      case 'excel':
        return '📊';
      case 'csv':
        return '📋';
      case 'pdf':
        return '📄';
      case 'png':
      case 'jpg':
      case 'jpeg':
        return '🖼️';
      default:
        return '📁';
    }
  };

  return (
    <Artifact>
      <ArtifactHeader>
        <div className="flex-1 min-w-0">
          <ArtifactTitle className="flex items-center gap-2">
            <PlayIcon className="w-4 h-4" />
            Python Code Execution
          </ArtifactTitle>
          <ArtifactDescription className="flex items-center gap-4">
            {result.success ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircleIcon className="w-4 h-4" />
                Executado com sucesso
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <AlertTriangleIcon className="w-4 h-4" />
                Erro na execução
              </span>
            )}
            {result.executionTime && (
              <span className="text-gray-500 text-sm">
                ⏱️ {result.executionTime}ms
              </span>
            )}
          </ArtifactDescription>
        </div>

        <ArtifactActions>
          {result.executedCode && (
            <ArtifactAction
              icon={CopyIcon}
              tooltip="Copiar código"
              onClick={handleCopyCode}
            />
          )}
        </ArtifactActions>
      </ArtifactHeader>

      <ArtifactContent className="space-y-4">
        {/* Código Executado */}
        {result.executedCode && (
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowCode(!showCode)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center gap-2 font-medium text-gray-700">
                {showCode ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                📝 Código Python Executado
              </span>
            </button>

            {showCode && (
              <div className="border-t">
                <SyntaxHighlighter
                  language="python"
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}
                  showLineNumbers={true}
                >
                  {result.executedCode}
                </SyntaxHighlighter>
              </div>
            )}
          </div>
        )}

        {/* Output de Texto */}
        {result.stdout && (
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-green-50 border-b">
              <span className="flex items-center gap-2 font-medium text-green-800">
                ✅ Output
              </span>
              <button
                onClick={handleCopyOutput}
                className="flex items-center gap-1 px-2 py-1 text-sm text-green-700 hover:bg-green-100 rounded transition-colors"
              >
                <CopyIcon className="w-3 h-3" />
                Copiar
              </button>
            </div>
            <div className="p-3 bg-gray-900 text-green-400 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
              {result.stdout}
            </div>
          </div>
        )}

        {/* Erros */}
        {result.stderr && (
          <div className="border rounded-lg overflow-hidden border-red-200">
            <div className="p-3 bg-red-50 border-b border-red-200">
              <span className="flex items-center gap-2 font-medium text-red-800">
                <AlertTriangleIcon className="w-4 h-4" />
                Erro
              </span>
            </div>
            <div className="p-3 bg-red-900 text-red-400 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
              {result.stderr}
            </div>
          </div>
        )}

        {/* Arquivos Criados */}
        {result.files && result.files.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="p-3 bg-blue-50 border-b">
              <span className="flex items-center gap-2 font-medium text-blue-800">
                📁 Arquivos Criados ({result.files.length})
              </span>
            </div>
            <div className="p-3 space-y-2">
              {result.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div>
                      <div className="font-medium text-gray-900">{file.name}</div>
                      <div className="text-sm text-gray-500">
                        {file.type.toUpperCase()}
                        {file.size && ` • ${Math.round(file.size / 1024)}KB`}
                      </div>
                    </div>
                  </div>

                  {file.url && (
                    <a
                      href={file.url}
                      download={file.name}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Imagens/Gráficos */}
        {result.images && result.images.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="p-3 bg-purple-50 border-b">
              <span className="flex items-center gap-2 font-medium text-purple-800">
                <ImageIcon className="w-4 h-4" />
                Gráficos Gerados ({result.images.length})
              </span>
            </div>
            <div className="p-3 space-y-4">
              {result.images.map((image, index) => (
                <div key={index} className="space-y-2">
                  {image.name && (
                    <div className="font-medium text-gray-700">{image.name}</div>
                  )}
                  <div className="relative">
                    <img
                      src={`data:image/${image.format};base64,${image.data}`}
                      alt={image.name || `Gráfico ${index + 1}`}
                      className={`max-w-full h-auto rounded cursor-pointer transition-transform hover:scale-[1.02] ${
                        expandedImage === index ? 'scale-110' : ''
                      }`}
                      onClick={() => setExpandedImage(expandedImage === index ? null : index)}
                    />
                    {expandedImage === index && (
                      <div
                        className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
                        onClick={() => setExpandedImage(null)}
                      >
                        <img
                          src={`data:image/${image.format};base64,${image.data}`}
                          alt={image.name || `Gráfico ${index + 1}`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Summary */}
        {!result.stdout && !result.stderr && !result.files?.length && !result.images?.length && (
          <div className="text-center py-8 text-gray-500">
            <PlayIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div>Código executado sem output visível</div>
          </div>
        )}
      </ArtifactContent>
    </Artifact>
  );
}