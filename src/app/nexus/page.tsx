'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import WeatherCard from '../../components/tools/WeatherCard';
import CalculatorCard from '../../components/tools/CalculatorCard';

export default function Page() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Nexus Chat</h1>
      
      <div style={{ marginBottom: '20px', minHeight: '400px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
        {messages.map((message, messageIndex) => (
          <div key={messageIndex} style={{ marginBottom: '10px' }}>
            <strong>{message.role === 'user' ? 'You' : 'AI'}:</strong>
            
            {/* Render message parts */}
            <div>
              {message.parts.map((part, partIndex) => {
                if (part.type === 'text') {
                  return <span key={partIndex}>{part.text}</span>;
                }

                if (part.type === 'tool-displayWeather') {
                  switch (part.state) {
                    case 'input-available':
                      return <div key={partIndex}>Loading weather...</div>;
                    case 'output-available':
                      return (
                        <div key={partIndex}>
                          <WeatherCard data={part.output as { location: string; temperature: number }} />
                        </div>
                      );
                    case 'output-error':
                      return <div key={partIndex}>Error: {part.errorText}</div>;
                    default:
                      return null;
                  }
                }

                if (part.type === 'tool-calculator') {
                  switch (part.state) {
                    case 'input-available':
                      return <div key={partIndex}>Loading calculator...</div>;
                    case 'output-available':
                      return (
                        <div key={partIndex}>
                          <CalculatorCard data={part.output as { expression: string; result: number }} />
                        </div>
                      );
                    case 'output-error':
                      return <div key={partIndex}>Error: {part.errorText}</div>;
                    default:
                      return null;
                  }
                }

                return null;
              })}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        if (input.trim()) {
          sendMessage({ text: input, api: '/api/chat-ui' });
          setInput('');
        }
      }} style={{ display: 'flex', gap: '10px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about weather or anything else..."
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button 
          type="submit" 
          disabled={!input.trim()}
          style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', backgroundColor: '#007cba', color: 'white' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}