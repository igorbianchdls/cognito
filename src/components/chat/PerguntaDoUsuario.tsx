"use client";

import React from 'react';
import type { UIMessage } from 'ai';

type Props = {
  message: UIMessage;
};

export default function PerguntaDoUsuario({ message }: Props) {
  // Extract only text parts for this minimal UI
  const textParts = (message.parts || []).filter(p => p.type === 'text');
  if (textParts.length === 0) return null;

  return (
    <div className="w-full flex justify-start py-3">
      <div className="max-w-[680px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] leading-6 text-gray-900">
        {textParts.map((p, i) => (
          <p key={i}>{(p as any).text}</p>
        ))}
      </div>
    </div>
  );
}

