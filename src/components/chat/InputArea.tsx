'use client';

import { KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

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

interface InputAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

export default function InputArea({ value, onChange, onSubmit, onFilesChange, disabled }: InputAreaProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
        <div className="relative">
          {/* Main Input */}
          <div className="relative bg-[#ffffff] dark:bg-[#2d2d2d] rounded-2xl border border-[#e8eaed] dark:border-[#3c4043] focus-within:border-[#1a73e8] dark:focus-within:border-[#4285f4] transition-all duration-200 shadow-sm hover:shadow-md">
            <Textarea
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte qualquer coisa..."
              disabled={disabled}
              rows={1}
              className={cn(
                "resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:border-0 p-4 pr-12",
                "min-h-[52px] max-h-32 overflow-y-auto bg-transparent",
                "placeholder:text-[#5f6368] dark:placeholder:text-[#9aa0a6]",
                "text-[#202124] dark:text-[#e8eaed]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              style={{
                height: 'auto',
                minHeight: '52px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            
            {/* Right side buttons */}
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {/* Attachment button */}
              <button
                type="button"
                disabled={disabled}
                className="p-2 rounded-lg text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#383838] transition-colors"
                title="Anexar arquivo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              
              {/* Microphone button */}
              <button
                type="button"
                disabled={disabled}
                className="p-2 rounded-lg text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#383838] transition-colors"
                title="Gravar áudio"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 10v2a7 7 0 01-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              
              {/* Send button */}
              <button
                type="submit"
                disabled={!value.trim() || disabled}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  !value.trim() || disabled
                    ? "text-[#9aa0a6] dark:text-[#5f6368] cursor-not-allowed"
                    : "text-[#1a73e8] dark:text-[#4285f4] hover:bg-[#e8f0fe] dark:hover:bg-[#1e3a5f]",
                  disabled && "animate-pulse"
                )}
                title="Enviar mensagem (Enter)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}