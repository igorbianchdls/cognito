'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ClockIcon, CheckCircleIcon } from 'lucide-react';

interface StreamingAnalise {
  numero?: number;
  titulo?: string;
  query?: string;
  status?: string;
  queryType?: string;
}

interface PlanAnalysisStreamingProps {
  analises: StreamingAnalise[];
  isStreaming: boolean;
}

const TypewriterText = ({
  text,
  isComplete,
  delay = 30,
  className = ""
}: {
  text: string;
  isComplete: boolean;
  delay?: number;
  className?: string;
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isComplete) {
      setDisplayText(text);
      return;
    }

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [text, isComplete, currentIndex, delay]);

  useEffect(() => {
    if (text !== displayText && !isComplete) {
      setCurrentIndex(0);
      setDisplayText('');
    }
  }, [text]);

  return (
    <span className={className}>
      {displayText}
      {!isComplete && currentIndex < text.length && (
        <span className="animate-pulse ml-1">|</span>
      )}
    </span>
  );
};

const StreamingAnalysisCard = ({
  analise,
  isActive,
  isComplete
}: {
  analise: StreamingAnalise;
  isActive: boolean;
  isComplete: boolean;
}) => {
  const getQueryTypeColor = (queryType: string) => {
    switch (queryType) {
      case 'SELECT':
        return 'bg-purple-100 text-purple-800';
      case 'INSERT':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`border rounded-lg p-4 transition-all duration-300 ${
      isActive
        ? 'border-blue-300 bg-blue-50/30 shadow-sm'
        : isComplete
          ? 'border-gray-200 bg-white'
          : 'border-gray-100 bg-gray-50/30'
    }`}>
      {/* Header with number and title */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isActive
            ? 'bg-blue-100'
            : isComplete
              ? 'bg-gray-100'
              : 'bg-gray-50'
        }`}>
          {analise.numero ? (
            <span className="text-sm font-semibold text-gray-700">{analise.numero}</span>
          ) : (
            <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-h-[24px]">
          {analise.titulo ? (
            <h4 className="font-medium text-gray-900 leading-tight">
              <TypewriterText
                text={analise.titulo}
                isComplete={isComplete}
                delay={25}
              />
            </h4>
          ) : (
            <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
          )}
        </div>
        {isActive && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-blue-600 font-medium">Gerando...</span>
          </div>
        )}
      </div>

      {/* Query block */}
      <div className="mb-3">
        {analise.query ? (
          <pre className={`text-xs border rounded-md p-3 overflow-x-auto whitespace-pre-wrap font-mono transition-colors ${
            isActive
              ? 'bg-blue-50/50 border-blue-200 text-gray-800'
              : 'bg-gray-50 border-gray-200 text-gray-800'
          }`}>
            <TypewriterText
              text={analise.query}
              isComplete={isComplete}
              delay={15}
            />
          </pre>
        ) : (
          <div className="h-16 bg-gray-100 border rounded-md animate-pulse flex items-center justify-center">
            <span className="text-xs text-gray-500">Aguardando query...</span>
          </div>
        )}
      </div>

      {/* Status and badges */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {isActive ? (
            <ClockIcon className="w-4 h-4 text-blue-500 animate-pulse" />
          ) : isComplete ? (
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
          ) : (
            <ClockIcon className="w-4 h-4 text-gray-400" />
          )}
          <Badge variant="secondary" className={
            isActive
              ? 'bg-blue-100 text-blue-800'
              : isComplete
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
          }>
            {isActive ? 'gerando' : isComplete ? 'planejado' : 'pendente'}
          </Badge>
        </div>
        {analise.queryType && (
          <Badge variant="outline" className={getQueryTypeColor(analise.queryType)}>
            {analise.queryType}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default function PlanAnalysisStreaming({
  analises,
  isStreaming
}: PlanAnalysisStreamingProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isStreaming && analises.length > 0) {
      // Determinar qual análise está sendo "digitada" baseado no conteúdo
      const lastCompleteIndex = analises.findIndex((analise, index) => {
        const nextAnalise = analises[index + 1];
        return analise.titulo && analise.query && (!nextAnalise || !nextAnalise.titulo);
      });

      setActiveIndex(lastCompleteIndex >= 0 ? lastCompleteIndex + 1 : 0);
    }
  }, [analises, isStreaming]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`border rounded-lg p-4 transition-colors ${
        isStreaming ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            )}
            <span className="font-semibold text-gray-900">
              {isStreaming ? 'Criando Plano de Análise...' : 'Plano de Análise'}
            </span>
            <Badge variant="secondary" className="ml-2">
              {analises.length} análise{analises.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        {isStreaming && (
          <p className="text-blue-800 text-sm mt-2">
            Gerando análises estruturadas em tempo real...
          </p>
        )}
      </div>

      {/* Analysis Cards */}
      <div className="space-y-3">
        {analises.map((analise, index) => (
          <StreamingAnalysisCard
            key={index}
            analise={analise}
            isActive={isStreaming && index === activeIndex}
            isComplete={!isStreaming || index < activeIndex}
          />
        ))}

        {/* Placeholder for next analysis while streaming */}
        {isStreaming && activeIndex >= analises.length && (
          <div className="border border-dashed border-blue-300 rounded-lg p-4 bg-blue-50/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="h-5 bg-blue-200/50 rounded animate-pulse w-2/3" />
              </div>
            </div>
            <div className="mt-3 h-12 bg-blue-100/30 rounded border-dashed border border-blue-300" />
          </div>
        )}
      </div>
    </div>
  );
}