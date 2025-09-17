'use client';

import { ComponentProps, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ToolUIPart } from 'ai';

interface StreamingData {
  [key: string]: unknown;
}

export type ToolInputStreamingProps = ComponentProps<'div'> & {
  input: ToolUIPart['input'];
  isStreaming: boolean;
  streamingData?: StreamingData;
};

const TypewriterText = ({
  text,
  isStreaming,
  delay = 30,
  className = ""
}: {
  text: string;
  isStreaming: boolean;
  delay?: number;
  className?: string;
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isStreaming) {
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
  }, [text, isStreaming, currentIndex, delay]);

  return (
    <span className={className}>
      {displayText}
      {isStreaming && currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

const StreamingJsonRenderer = ({
  data,
  isStreaming
}: {
  data: unknown;
  isStreaming: boolean;
}) => {
  const [displayData, setDisplayData] = useState<unknown>({});

  useEffect(() => {
    if (!isStreaming) {
      setDisplayData(data);
    } else {
      // Gradualmente mostrar os dados conforme chegam
      setDisplayData(data);
    }
  }, [data, isStreaming]);

  const renderValue = (value: unknown, key?: string, level = 0): React.ReactNode => {
    const indent = '  '.repeat(level);

    if (value === null) return 'null';
    if (value === undefined) return '';

    if (typeof value === 'string') {
      return (
        <span className="text-green-600">
          &quot;{isStreaming ? (
            <TypewriterText
              text={value}
              isStreaming={isStreaming && level > 0}
              delay={20}
            />
          ) : value}&quot;
        </span>
      );
    }

    if (typeof value === 'number') {
      return <span className="text-blue-600">{value}</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-purple-600">{value.toString()}</span>;
    }

    if (Array.isArray(value)) {
      return (
        <div>
          <span>[</span>
          {value.map((item, index) => (
            <div key={index} className="ml-4">
              {indent}  {renderValue(item, undefined, level + 1)}
              {index < value.length - 1 && ','}
            </div>
          ))}
          <div>{indent}]</div>
        </div>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      return (
        <div>
          <span>{'{'}</span>
          {entries.map(([k, v], index) => (
            <div key={k} className="ml-4">
              {indent}  <span className="text-blue-800">&quot;{k}&quot;</span>: {renderValue(v, k, level + 1)}
              {index < entries.length - 1 && ','}
            </div>
          ))}
          <div>{indent}{'}'}</div>
        </div>
      );
    }

    return String(value);
  };

  return (
    <pre className="text-sm font-mono p-3 whitespace-pre-wrap overflow-x-auto">
      {renderValue(displayData)}
    </pre>
  );
};

export const ToolInputStreaming = ({
  className,
  input,
  isStreaming,
  ...props
}: ToolInputStreamingProps) => (
  <div className={cn('space-y-2 overflow-hidden p-4', className)} {...props}>
    <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide flex items-center gap-2">
      Parameters
      {isStreaming && (
        <Badge variant="secondary" className="animate-pulse">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
          Streaming...
        </Badge>
      )}
    </h4>
    <div className={cn(
      'rounded-md border transition-all duration-300',
      isStreaming
        ? 'bg-blue-50/50 border-blue-200'
        : 'bg-muted/50 border-border'
    )}>
      <StreamingJsonRenderer
        data={input || {}}
        isStreaming={isStreaming}
      />
    </div>
  </div>
);