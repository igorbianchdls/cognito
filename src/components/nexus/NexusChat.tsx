'use client';

import { useChat } from '@ai-sdk/react';
import Sidebar from '../navigation/Sidebar';
import MessageList from '../chat/MessageList';
import InputArea from '../chat/InputArea';

export default function NexusChat() {
  console.log('🚀 NexusChat component loading...');
  
  const { 
    messages, 
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error 
  } = useChat({
    api: '/api/chat-ui',
  });

  console.log('🚀 useChat initialized:', { 
    messagesCount: messages.length, 
    isLoading, 
    hasError: !!error 
  });

  const handleAttach = () => {
    console.log('📎 Attach file clicked');
  };

  const handleMicrophone = () => {
    console.log('🎤 Microphone clicked');
  };

  const handleSearch = () => {
    console.log('🔍 Search clicked');
  };

  const handleModelChange = (model: string) => {
    console.log('🤖 Model changed to:', model);
  };

  console.log('🎨 Rendering NexusChat with messages:', messages.length);

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
                  nexus
                </h1>
              </div>
              
              {/* Main Input */}
              <div className="w-full max-w-[800px] mx-auto px-4">
                <InputArea
                  value={input}
                  onChange={handleInputChange}
                  onSubmit={handleSubmit}
                  onFilesChange={() => {}}
                  disabled={isLoading}
                />
              </div>
            </div>
          ) : (
            <MessageList 
              messages={messages}
              isLoading={isLoading}
              error={error?.message}
            />
          )}
        </div>

        {/* Input Area for chat mode */}
        {messages.length > 0 && (
          <div className="sticky bottom-0 bg-[#ffffff]/95 dark:bg-[#0f0f0f]/95 backdrop-blur-sm">
            <div className="max-w-[800px] mx-auto px-4 py-4">
              <InputArea
                value={input}
                onChange={handleInputChange}
                onSubmit={handleSubmit}
                onFilesChange={() => {}}
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}