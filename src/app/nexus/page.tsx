'use client';

import { useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: { type: 'text'; text: string }[];
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Nexus Chat</h1>
      
      <div style={{ marginBottom: '20px', minHeight: '400px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
        {messages.map(message => (
          <div key={message.id} style={{ marginBottom: '10px' }}>
            <strong>{message.role === 'user' ? 'User: ' : 'AI: '}</strong>
            {message.parts.map((part, index) => (
              part.type === 'text' ? <span key={index}>{part.text}</span> : null
            ))}
          </div>
        ))}
        {isLoading && <div>AI is thinking...</div>}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (input.trim() && !isLoading) {
            const userMessage: Message = {
              id: Date.now().toString(),
              role: 'user',
              parts: [{ type: 'text', text: input.trim() }]
            };
            
            setMessages(prev => [...prev, userMessage]);
            setInput('');
            setIsLoading(true);
            
            try {
              const response = await fetch('/api/chat-ui', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  messages: [...messages, userMessage]
                })
              });
              
              if (!response.ok) throw new Error('Failed to fetch');
              
              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                parts: [{ type: 'text', text: '' }]
              };
              
              setMessages(prev => [...prev, assistantMessage]);
              
              const reader = response.body?.getReader();
              if (!reader) throw new Error('No response body');
              
              const decoder = new TextDecoder();
              let done = false;
              
              while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                
                if (value) {
                  const chunk = decoder.decode(value);
                  const lines = chunk.split('\\n');
                  
                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      try {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'text-delta') {
                          setMessages(prev => {
                            const newMessages = [...prev];
                            const lastMessage = newMessages[newMessages.length - 1];
                            if (lastMessage && lastMessage.role === 'assistant') {
                              lastMessage.parts[0].text += data.delta;
                            }
                            return newMessages;
                          });
                        }
                      } catch {
                        // Ignore parse errors
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error:', error);
            } finally {
              setIsLoading(false);
            }
          }
        }}
        style={{ display: 'flex', gap: '10px' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Ask about weather or anything else..."
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', backgroundColor: '#007cba', color: 'white' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}