'use client';

import { KeyboardEvent, useState } from 'react';
import UploadFiles from './UploadFiles';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    // TODO: Integrar arquivos com mensagens do chat
    console.log('Arquivos carregados:', files);
  };
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <div className="relative">
      <form onSubmit={onSubmit} className="relative">
        <div className="relative flex items-end bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-200">
          <div className="flex-1 relative">
            <textarea
              value={value}
              onChange={onChange}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={disabled}
              rows={1}
              className="w-full resize-none bg-transparent px-6 py-4 pr-14
                       text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                       focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
                       min-h-[56px] max-h-32 overflow-y-auto"
              style={{
                height: 'auto',
                minHeight: '56px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
          </div>
          
          <div className="flex items-end p-2 gap-2">
            {/* Upload Files Button */}
            <UploadFiles 
              onFilesUploaded={handleFilesUploaded}
              disabled={disabled}
              maxFiles={3}
              acceptedTypes={['image/*', 'application/pdf', '.txt', '.doc', '.docx']}
            />
            
            <button
              type="submit"
              disabled={!value.trim() || disabled}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                       transition-all duration-200 ${
                         !value.trim() || disabled
                           ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                           : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                       }`}
              title="Enviar mensagem (Enter)"
            >
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={disabled ? 'animate-pulse' : ''}
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Hint text */}
        <div className="flex items-center justify-between mt-2 px-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">Enter</kbd> para enviar, 
            <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">Shift</kbd> + 
            <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">Enter</kbd> para nova linha
          </p>
          {value.length > 0 && (
            <p className="text-xs text-gray-400">
              {value.length} caracteres
            </p>
          )}
        </div>
      </form>
    </div>
  );
}