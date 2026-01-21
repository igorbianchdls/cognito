"use client";

import React, { useState, FormEvent } from 'react';
import type { UIMessage } from 'ai';
import Header from './Header';
import PerguntaDoUsuario from './PerguntaDoUsuario';
import RespostaDaIa from './RespostaDaIa';
import InputArea from './InputArea';

export default function ChatContainer({ onOpenSandbox, withSideMargins }: { onOpenSandbox?: () => void; withSideMargins?: boolean }) {
  const [input, setInput] = useState('');

  // Static mock messages just for UI
  const [messages] = useState<UIMessage[]>([
    {
      id: '1',
      role: 'user',
      parts: [{ type: 'text', text: 'Build me an app based on this mockup.' }],
    },
    {
      id: '2',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Generated Shopping List v1 with initial components.' }],
    },
  ]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // UI only: do nothing for now
    setInput('');
  };

  return (
    <div className="h-full grid grid-rows-[auto_1fr]">
      <Header />
      <div className="h-full grid grid-rows-[1fr_auto] min-h-0" style={withSideMargins ? { marginLeft: '20%', marginRight: '20%' } : undefined}>
        <div className="overflow-y-auto min-h-0 px-4 py-4">
          {messages.map((m) =>
            m.role === 'user' ? (
              <PerguntaDoUsuario key={m.id} message={m} />
            ) : (
              <RespostaDaIa key={m.id} message={m} />
            )
          )}
        </div>
        <div className="px-4 pb-3">
          <InputArea value={input} onChange={setInput} onSubmit={handleSubmit} status="idle" onOpenSandbox={onOpenSandbox} />
        </div>
      </div>
    </div>
  );
}
