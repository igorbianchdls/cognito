'use client';

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import MessageList from '../../chat/MessageList';
import InputArea from '../../chat/InputArea';
import { sheetDataStore, sheetToolsStore } from '@/stores/sheets/sheetsStore';

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

export default function SheetsChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // Access sheet data from nano-stores
  const sheetData = useStore(sheetDataStore);
  const sheetTools = useStore(sheetToolsStore);

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
      const response = await fetch('/api/sheets/chat', {
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
          sheetData: {
            headers: sheetData.headers,
            totalRows: sheetData.totalRows,
            totalCols: sheetData.totalCols,
            sampleRows: sheetData.rows.slice(0, 5) // Send first 5 rows as context
          },
          hasSheetTools: !!sheetTools
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
    <div className="flex flex-col h-full bg-[#fafbfc]">
      {/* Removed header section to match DatasetsSidebar pattern */}

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-12 h-12 bg-[#f4f5f7] rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[#8993a4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-[#172b4d] mb-3">
            Como posso ajudar?
          </h4>
          <div className="space-y-1 w-full max-w-xs">
            <button className="flex items-center gap-2 w-full p-2 text-left hover:bg-[#f4f5f7] rounded text-xs text-[#172b4d] transition-colors">
              <svg className="w-4 h-4 text-[#8993a4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Criar uma tabela
            </button>
            <button className="flex items-center gap-2 w-full p-2 text-left hover:bg-[#f4f5f7] rounded text-xs text-[#172b4d] transition-colors">
              <svg className="w-4 h-4 text-[#8993a4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Gerar código
            </button>
            <button className="flex items-center gap-2 w-full p-2 text-left hover:bg-[#f4f5f7] rounded text-xs text-[#172b4d] transition-colors">
              <svg className="w-4 h-4 text-[#8993a4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Construir um gráfico
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <MessageList 
            messages={messages}
            isLoading={isLoading}
            error={error}
          />
        </div>
      )}

      <div className="border-t border-[#dfe1e6] p-3 bg-white">
        <InputArea
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onFilesChange={handleFilesChange}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}