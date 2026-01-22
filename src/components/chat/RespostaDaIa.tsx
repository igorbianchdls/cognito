"use client";

import React from 'react';
import type { UIMessage } from 'ai';
import { Response } from '@/components/ai-elements/response';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { ToolInputStreaming } from '@/components/ai-elements/tool-input-streaming';
import { CodeBlock } from '@/components/ai-elements/code-block';
import FornecedorResult from '@/components/tools/workflow/FornecedorResult';

type Props = { message: UIMessage };

export default function RespostaDaIa({ message }: Props) {
  const parts = message.parts || [];
  const hasAnything = parts.length > 0;
  if (!hasAnything) return null;

  return (
    <div className="w-full flex justify-start py-3">
      <div className="max-w-[720px] w-full">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-[11px] leading-none">IA</span>
          <span className="font-semibold text-gray-900 text-[16px]">Claude</span>
        </div>
        {parts.map((part, index) => {
          if (part.type === 'reasoning') {
            const txt = (part as any).content || (part as any).text || '';
            const isStreaming = (part as any).state === 'streaming';
            if (!txt) return null;
            return (
              <Reasoning key={`think-${index}`} isStreaming={isStreaming}>
                <ReasoningTrigger />
                <ReasoningContent>{txt}</ReasoningContent>
              </Reasoning>
            );
          }
          // Tool UI part (generic + special cases)
          if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
            const state = (part as any).state as 'input-streaming' | 'input-available' | 'output-available' | 'output-error' | undefined;
            const input = (part as any).input;
            const inputStream = (part as any).inputStream as string | undefined;
            const output = (part as any).output;
            const errorText = (part as any).errorText as string | undefined;
            const toolType = (part as any).type as string;
            // Special render: buscarFornecedor → ArtifactDataTable
            if (toolType === 'tool-buscarFornecedor' && (state === 'output-available' || state === 'output-error') && output) {
              const result = (output && (output.result !== undefined ? output.result : output)) as any;
              return (
                <div key={`tool-${index}`} className="mb-3">
                  <FornecedorResult result={result} />
                </div>
              );
            }
            return (
              <Tool key={`tool-${index}`} defaultOpen>
                <ToolHeader type={(part as any).type} state={(state as any) || 'input-streaming'} />
                <ToolContent>
                  {state === 'input-streaming' && (
                    <ToolInputStreaming input={inputStream || input || ''} isStreaming />
                  )}
                  {/* Show input JSON when available or after completion */}
                  {(state !== 'input-streaming') && input && (
                    <ToolInput input={input} />
                  )}
                  {(state === 'output-available' || state === 'output-error') && (
                    <ToolOutput
                      output={output !== undefined ? (
                        <CodeBlock code={typeof output === 'string' ? output : JSON.stringify(output, null, 2)} language="json" />
                      ) : null}
                      errorText={errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
            );
          }
          if (part.type === 'text') {
            const txt = (part as any).text || '';
            if (!txt) return null;
            return (
              <div key={`resp-${index}`} className="text-[15px] leading-6">
                <Response options={{}}>{txt}</Response>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
