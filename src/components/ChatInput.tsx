'use client';

import { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-3 max-w-4xl mx-auto">
      <div className="flex-1 relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
          disabled={disabled}
          rows={1}
          className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-800 px-4 py-3 pr-12
                     text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                     focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                     disabled:opacity-50 disabled:cursor-not-allowed
                     min-h-[48px] max-h-32 overflow-y-auto"
          style={{
            height: 'auto',
            minHeight: '48px',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 128) + 'px';
          }}
        />
      </div>
      
      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                   disabled:cursor-not-allowed text-white rounded-lg p-3 
                   transition-colors duration-200 flex items-center justify-center
                   min-w-[48px] h-[48px]"
        title="Enviar mensagem"
      >
        <svg 
          width="20" 
          height="20" 
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
      </button>
    </div>
  );
}