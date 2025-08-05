'use client';

import { KeyboardEvent } from 'react';
import UploadFiles from './UploadFiles';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface InputAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

export default function InputArea({ value, onChange, onSubmit, onFilesChange, disabled }: InputAreaProps) {
  const handleFilesUploaded = (files: UploadedFile[]) => {
    onFilesChange(files);
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
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-200">
          {/* Textarea */}
          <div className="relative">
            <textarea
              value={value}
              onChange={onChange}
              onKeyPress={handleKeyPress}
              placeholder="Pergunte alguma coisa"
              disabled={disabled}
              rows={3}
              className="w-full resize-none bg-transparent px-4 py-3 pr-12
                       text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                       focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
                       min-h-[84px] max-h-32 overflow-y-auto border-0"
              style={{
                height: 'auto',
                minHeight: '84px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            
            {/* Send button in top right */}
            <button
              type="submit"
              disabled={!value.trim() || disabled}
              className={`absolute bottom-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center
                       transition-all duration-200 ${
                         !value.trim() || disabled
                           ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                           : 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 hover:bg-gray-700 dark:hover:bg-gray-300'
                       }`}
              title="Enviar mensagem (Enter)"
            >
              <svg 
                width="16" 
                height="16" 
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
          
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-700">
            {/* Left side tools */}
            <div className="flex items-center gap-2">
              {/* Upload Files Button */}
              <UploadFiles 
                onFilesUploaded={handleFilesUploaded}
                disabled={disabled}
                maxFiles={3}
                acceptedTypes={['image/*', 'application/pdf', '.txt', '.doc', '.docx']}
              />
              
              {/* Tools button */}
              <button
                type="button"
                disabled={disabled}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                title="Ferramentas"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
                <span className="text-sm">Ferramentas</span>
              </button>
            </div>
            
            {/* Right side tools */}
            <div className="flex items-center gap-2">
              {/* Microphone button */}
              <button
                type="button"
                disabled={disabled}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                title="Gravar áudio"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
            </div>
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