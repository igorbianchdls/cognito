'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function JuliusPage() {
  const { messages, append, isLoading } = useChat({
    api: '/api/julius-chat',
  });
  
  const [input, setInput] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Julius Test Chat</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4 h-96 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-gray-500">Send a message to start chatting with Julius...</p>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-3 rounded-lg max-w-xs ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {message.content}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            append({ role: 'user', content: input });
            setInput('');
          }
        }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}