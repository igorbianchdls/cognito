'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, FormEvent } from 'react';
import MessageList from '../../components/nexus/MessageList';
import InputArea from '../../components/nexus/InputArea';

export default function Page() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat-ui',
    }),
  });
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <>
      <MessageList messages={messages} />
      <InputArea 
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        status={status}
      />
    </>
  );
}