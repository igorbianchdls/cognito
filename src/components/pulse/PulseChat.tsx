'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import Sidebar from '../navigation/Sidebar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function PulseChat() {
  const { 
    messages, 
    sendMessage,
    status, 
    error 
  } = useChat();

  // Manual input state management (AI SDK 5.0 no longer manages input internally)
  const [input, setInput] = useState('');
  
  // State for model selection (useChat doesn't handle this)
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet');
  
  // Loading state based on status
  const isLoading = status === 'submitted' || status === 'streaming';
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Send message using AI SDK's sendMessage
    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: input.trim() }]
    });
    // Clear input after submission
    setInput('');
  };

  const handleAttach = () => {
    console.log('📎 Attach file clicked');
    // TODO: Implementar upload de arquivos
  };

  const handleMicrophone = () => {
    console.log('🎤 Microphone clicked');
    // TODO: Implementar gravação de áudio
  };

  const handleSearch = () => {
    console.log('🔍 Search clicked');
    // TODO: Implementar funcionalidade de busca
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    console.log('🤖 Model changed to:', model);
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
                  pulse
                </h1>
              </div>
              
              {/* Main Input */}
              <div className="w-full max-w-[800px] mx-auto px-4">
                <MessageInput
                  value={input}
                  onChange={handleInputChange}
                  onSubmit={handleSubmit}
                  disabled={isLoading}
                  onAttach={handleAttach}
                  onMicrophone={handleMicrophone}
                  onSearch={handleSearch}
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                />
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

        {/* Input Area for chat mode */}
        {messages.length > 0 && (
          <div className="sticky bottom-0 bg-[#ffffff]/95 dark:bg-[#0f0f0f]/95 backdrop-blur-sm">
            <div className="max-w-[800px] mx-auto px-4 py-4">
              <MessageInput
                value={input}
                onChange={handleInputChange}
                onSubmit={handleSubmit}
                disabled={isLoading}
                onAttach={handleAttach}
                onMicrophone={handleMicrophone}
                onSearch={handleSearch}
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}