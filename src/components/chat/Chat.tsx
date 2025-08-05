'use client';

import { useState } from 'react';
import Message from './Message';
import Sidebar from '../navigation/Sidebar';
import InputArea from './InputArea';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  files?: UploadedFile[];
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setUploadedFiles([]);  // Clear uploaded files after sending
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value);
          console.log('Chunk recebido:', JSON.stringify(chunk));
          console.log('Chunk length:', chunk.length);
          
          // For text stream, just append the chunk
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              console.log('Conteúdo antes:', JSON.stringify(lastMessage.content));
              lastMessage.content += chunk;
              console.log('Conteúdo depois:', JSON.stringify(lastMessage.content));
            }
            return newMessages;
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setInput(currentInput); // Restore input on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
  };

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
                  perplexity
                </h1>
              </div>
              
              {/* Main Input */}
              <div className="w-full max-w-2xl px-4">
                <InputArea
                  value={input}
                  onChange={handleInputChange}
                  onSubmit={handleSubmit}
                  onFilesChange={handleFilesChange}
                  disabled={isLoading}
                />
                
                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#f8f9fa] dark:bg-[#2d2d2d] text-[#3c4043] dark:text-[#e8eaed] rounded-full text-sm hover:bg-[#f1f3f4] dark:hover:bg-[#383838] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Parentalidade
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#f8f9fa] dark:bg-[#2d2d2d] text-[#3c4043] dark:text-[#e8eaed] rounded-full text-sm hover:bg-[#f1f3f4] dark:hover:bg-[#383838] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Comparar
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#f8f9fa] dark:bg-[#2d2d2d] text-[#3c4043] dark:text-[#e8eaed] rounded-full text-sm hover:bg-[#f1f3f4] dark:hover:bg-[#383838] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Aprender
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#f8f9fa] dark:bg-[#2d2d2d] text-[#3c4043] dark:text-[#e8eaed] rounded-full text-sm hover:bg-[#f1f3f4] dark:hover:bg-[#383838] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verificação de Fatos
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
              {messages.map((message) => (
                <Message
                  key={message.id}
                  content={message.content}
                  role={message.role}
                  timestamp={message.createdAt}
                  isLoading={message.role === 'assistant' && message.content === '' && isLoading}
                  files={message.files}
                />
              ))}
              
              {error && (
                <div className="mx-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                      {error}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area for chat mode */}
        {messages.length > 0 && (
          <div className="sticky bottom-0 bg-[#ffffff]/95 dark:bg-[#0f0f0f]/95 backdrop-blur-sm border-t border-[#e8eaed] dark:border-[#2d2d2d]">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <InputArea
                value={input}
                onChange={handleInputChange}
                onSubmit={handleSubmit}
                onFilesChange={handleFilesChange}
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}