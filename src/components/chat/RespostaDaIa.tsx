"use client";

import React from 'react';
import type { UIMessage } from 'ai';
import { Response } from '@/components/ai-elements/response';
import { Bot } from 'lucide-react';

type Props = {
  message: UIMessage;
};

export default function RespostaDaIa({ message }: Props) {
  const text = (message.parts || [])
    .filter(p => p.type === 'text')
    .map(p => (p as any).text)
    .join('\n\n');

  if (!text) return null;

  return (
    <div className="w-full flex justify-start py-3">
      <div className="max-w-[720px] w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b px-4 py-2 text-sm text-gray-600">
          <Bot className="w-4 h-4" />
          <span>IA</span>
        </div>
        <div className="px-4 py-3 text-[15px] leading-6">
          <Response options={{}}>{text}</Response>
        </div>
      </div>
    </div>
  );
}

