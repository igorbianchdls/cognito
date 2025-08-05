'use client';

import { KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
        <Card className="p-0 shadow-lg border-border/50 focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-ring transition-all duration-200">
          {/* Textarea */}
          <div className="relative p-4 pb-0">
            <Textarea
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte alguma coisa"
              disabled={disabled}
              rows={2}
              className={cn(
                "resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:border-0 p-0",
                "min-h-[56px] max-h-32 overflow-y-auto",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
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
          
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            {/* Left side tools */}
            <div className="flex items-center gap-2">
              {/* Upload Files Button */}
              <UploadFiles 
                onFilesUploaded={handleFilesUploaded}
                disabled={disabled}
                maxFiles={3}
                acceptedTypes={['image/*', 'application/pdf', '.txt', '.doc', '.docx']}
              />
              
              {/* Send button */}
              <Button
                type="submit"
                size="icon"
                disabled={!value.trim() || disabled}
                className={cn(
                  "size-8",
                  disabled && "animate-pulse"
                )}
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
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                </svg>
              </Button>
            </div>
            
            {/* Right side tools */}
            <div className="flex items-center gap-2">
              {/* Microphone button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="size-8 text-muted-foreground hover:text-foreground"
                title="Gravar áudio"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Hint text */}
        <div className="flex items-center justify-between mt-2 px-2">
          <p className="text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded">Enter</kbd> para enviar, 
            <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded">Shift</kbd> + 
            <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded">Enter</kbd> para nova linha
          </p>
          {value.length > 0 && (
            <p className="text-xs text-muted-foreground/60">
              {value.length} caracteres
            </p>
          )}
        </div>
      </form>
    </div>
  );
}