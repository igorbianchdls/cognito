'use client';

import { useState } from 'react';
import MessageList from '../chat/MessageList';
import Sidebar from '../navigation/Sidebar';
import InputArea from '../chat/InputArea';

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

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  files?: UploadedFile[];
}

export default function GraphRAGChat() {
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
    setUploadedFiles([]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/graphrag-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          files: userMessage.files?.filter(f => f.content) || [],
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

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value);
          
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content += chunk;
            }
            return newMessages;
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setInput(currentInput);
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
      <Sidebar />
      
      <div className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-12">
                <h1 className="text-4xl font-normal text-[#202124] dark:text-[#e8eaed] tracking-tight">
                  GraphRAG
                </h1>
                <p className="text-lg text-[#5f6368] dark:text-[#9aa0a6] mt-2 text-center">
                  Graph-based Retrieval Augmented Generation
                </p>
              </div>
              
              <div className="w-full max-w-4xl mx-auto px-4">
                <InputArea
                  value={input}
                  onChange={handleInputChange}
                  onSubmit={handleSubmit}
                  onFilesChange={handleFilesChange}
                  disabled={isLoading}
                />
                
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#f8f9fa] dark:bg-[#2d2d2d] text-[#3c4043] dark:text-[#e8eaed] rounded-full text-sm hover:bg-[#f1f3f4] dark:hover:bg-[#383838] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Grafos de Conhecimento
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#f8f9fa] dark:bg-[#2d2d2d] text-[#3c4043] dark:text-[#e8eaed] rounded-full text-sm hover:bg-[#f1f3f4] dark:hover:bg-[#383838] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    RAG Avançado
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#f8f9fa] dark:bg-[#2d2d2d] text-[#3c4043] dark:text-[#e8eaed] rounded-full text-sm hover:bg-[#f1f3f4] dark:hover:bg-[#383838] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Arquiteturas IA
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#f8f9fa] dark:bg-[#2d2d2d] text-[#3c4043] dark:text-[#e8eaed] rounded-full text-sm hover:bg-[#f1f3f4] dark:hover:bg-[#383838] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Relacionamentos
                  </button>
                </div>
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

        {messages.length > 0 && (
          <div className="sticky bottom-0 bg-[#ffffff]/95 dark:bg-[#0f0f0f]/95 backdrop-blur-sm">
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