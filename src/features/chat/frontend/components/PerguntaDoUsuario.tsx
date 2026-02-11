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
    <div className="w-full min-w-0 flex justify-end py-3">
      <div className="max-w-[680px] min-w-0 bg-gray-50 rounded-xl px-4 py-3 text-[15px] leading-6 text-gray-900 break-words [overflow-wrap:anywhere]">
        {textParts.map((p, i) => (
          <p key={i} className="break-words [overflow-wrap:anywhere]">{(p as any).text}</p>
        ))}
      </div>
    </div>
  );
}
