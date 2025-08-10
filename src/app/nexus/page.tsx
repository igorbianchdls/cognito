'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import WeatherCard from '../../components/tools/WeatherCard';

export default function Page() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat-ui',
    }),
  });
  const [input, setInput] = useState('');

  return (
    <>
      {messages.map(message => (
        <div key={message.id}>
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, index) => {
            if (part.type === 'text') {
              return <span key={index}>{part.text}</span>;
            }

            if (part.type === 'tool-displayWeather') {
              const callId = part.toolCallId;
              
              switch (part.state) {
                case 'input-streaming':
                  return <div key={callId}>Preparing weather request...</div>;
                case 'input-available':
                  return <div key={callId}>Getting weather for {(part.input as { location: string }).location}...</div>;
                case 'output-available':
                  return (
                    <div key={callId}>
                      <WeatherCard data={part.output as { location: string; temperature: number }} />
                    </div>
                  );
                case 'output-error':
                  return <div key={callId}>Error: {part.errorText}</div>;
                default:
                  return null;
              }
            }

            return null;
          })}
        </div>
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput('');
          }
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={status !== 'ready'}
          placeholder="Say something..."
        />
      </form>
    </>
  );
}