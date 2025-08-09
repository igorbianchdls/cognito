'use client';

import { useState } from 'react';
import MessageList from '../../components/chat/MessageList';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  content?: string;
  summary?: string;
  fileType?: 'csv' | 'text' | 'unknown';
  rowCount?: number;
  columnCount?: number;
}

interface ToolCall {
  id: string;
  name: string;
  state: 'loading' | 'result';
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  files?: UploadedFile[];
  toolCalls?: ToolCall[];
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Nexus Chat</h1>
      
      <div style={{ marginBottom: '20px', minHeight: '400px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
        <MessageList 
          messages={messages}
          isLoading={isLoading}
          error={error}
        />
        {isLoading && <div>AI is thinking...</div>}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (input.trim() && !isLoading) {
            const userMessage: Message = {
              id: Date.now().toString(),
              role: 'user',
              content: input.trim(),
              createdAt: new Date()
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
                content: '',
                createdAt: new Date(),
                toolCalls: []
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
                              lastMessage.content += data.delta;
                            }
                            return newMessages;
                          });
                        } else if (data.type === 'tool-input-start') {
                          setMessages(prev => {
                            const newMessages = [...prev];
                            const lastMessage = newMessages[newMessages.length - 1];
                            if (lastMessage && lastMessage.role === 'assistant') {
                              const toolCall: ToolCall = {
                                id: data.toolCallId,
                                name: data.toolName,
                                state: 'loading',
                                args: data.args
                              };
                              if (!lastMessage.toolCalls) {
                                lastMessage.toolCalls = [];
                              }
                              lastMessage.toolCalls.push(toolCall);
                            }
                            return newMessages;
                          });
                        } else if (data.type === 'tool-output-available') {
                          setMessages(prev => {
                            const newMessages = [...prev];
                            const lastMessage = newMessages[newMessages.length - 1];
                            if (lastMessage && lastMessage.toolCalls) {
                              const toolCall = lastMessage.toolCalls.find(tc => tc.id === data.toolCallId);
                              if (toolCall) {
                                toolCall.state = 'result';
                                toolCall.result = data.output;
                              }
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
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Erro desconhecido');
              console.error('Error:', err);
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