'use client';

import { KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
}

export default function MessageInput({ value, onChange, onSubmit, disabled }: MessageInputProps) {
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
          <div className="relative bg-white dark:bg-[#1a1a1a] rounded-lg border border-[#dfe1e6] dark:border-[#2d2d2d] focus-within:border-[#0052cc] transition-all duration-200">
            <Textarea
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              disabled={disabled}
              rows={3}
              className={cn(
                "resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:border-0 p-3 pr-12",
                "min-h-[72px] max-h-32 overflow-y-auto bg-transparent text-sm",
                "placeholder:text-[#8993a4] dark:placeholder:text-[#6c757d]",
                "text-[#172b4d] dark:text-[#e8eaed]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              style={{
                height: 'auto',
                minHeight: '72px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            
            {/* Send button */}
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <Button
                type="submit"
                variant={!value.trim() || disabled ? "ghost" : "default"}
                size="icon"
                disabled={!value.trim() || disabled}
                className={cn(
                  "h-8 w-8 transition-all duration-200",
                  !value.trim() || disabled 
                    ? "text-[#8993a4] hover:text-[#172b4d] dark:text-[#6c757d] dark:hover:text-[#e8eaed]" 
                    : "bg-[#0052cc] hover:bg-[#0065ff] text-white",
                  disabled && "animate-pulse"
                )}
                title="Enviar mensagem (Enter)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}