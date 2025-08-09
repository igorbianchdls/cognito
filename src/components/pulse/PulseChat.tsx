'use client';

import { useState } from 'react';
import Sidebar from '../navigation/Sidebar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export default function PulseChat() {
  console.log('🚀 PulseChat component loading...');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🚀 State initialized:', { 
    messagesCount: messages.length, 
    isLoading, 
    hasError: !!error 
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setError(null);

    console.log('📤 Sending message:', userMessage.content);

    try {
      const response = await fetch('/api/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: '',
        createdAt: new Date(),
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
          
          // Process each line as potential JSON
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  
                  if (lastMessage && lastMessage.role === 'assistant') {
                    // Handle text deltas
                    if (data.type === 'text-delta') {
                      lastMessage.content += data.delta;
                    }
                  }
                  
                  return newMessages;
                });
              } catch {
                // If not JSON, treat as regular text
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content += line;
                  }
                  return newMessages;
                });
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttach = () => {
    console.log('📎 Attach file clicked');
  };

  const handleMicrophone = () => {
    console.log('🎤 Microphone clicked');
  };

  const handleSearch = () => {
    console.log('🔍 Search clicked');
  };

  const handleModelChange = (model: string) => {
    console.log('🤖 Model changed to:', model);
  };

  console.log('🎨 Rendering PulseChat with messages:', messages.length);

  return (
    <div className="flex h-screen bg-[#ffffff] dark:bg-[#0f0f0f]">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              {/* Logo */}
              <div className="mb-12">
                <h1 className="text-4xl font-normal text-[#202124] dark:text-[#e8eaed] tracking-tight">
                  pulse
                </h1>
              </div>
              
              {/* Main Input */}
              <div className="w-full max-w-[800px] mx-auto px-4">
                <form onSubmit={handleSubmit}>
                  <MessageInput
                    value={input}
                    onChange={handleInputChange}
                    onSubmit={handleSubmit}
                    disabled={isLoading}
                    onAttach={handleAttach}
                    onMicrophone={handleMicrophone}
                    onSearch={handleSearch}
                    selectedModel="claude-3-5-sonnet"
                    onModelChange={handleModelChange}
                  />
                </form>
              </div>
            </div>
          ) : (
            <MessageList 
              messages={messages}
              isLoading={isLoading}
              error={error}
            />
          )}
        </div>

        {/* Input Area for chat mode */}
        {messages.length > 0 && (
          <div className="sticky bottom-0 bg-[#ffffff]/95 dark:bg-[#0f0f0f]/95 backdrop-blur-sm">
            <div className="max-w-[800px] mx-auto px-4 py-4">
              <form onSubmit={handleSubmit}>
                <MessageInput
                  value={input}
                  onChange={handleInputChange}
                  onSubmit={handleSubmit}
                  disabled={isLoading}
                  onAttach={handleAttach}
                  onMicrophone={handleMicrophone}
                  onSearch={handleSearch}
                  selectedModel="claude-3-5-sonnet"
                  onModelChange={handleModelChange}
                />
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}