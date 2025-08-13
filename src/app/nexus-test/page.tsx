'use client';

import { useChat } from '@ai-sdk/react';
import { useState, FormEvent } from 'react';

export default function NexusTestPage() {
  console.log('🧪 [NEXUS-TEST] PÁGINA CARREGADA! MetaAnalyst FORÇADO!');
  
  // useChat DIRETO sem transport customizado
  console.log('🧪 [NEXUS-TEST] Inicializando useChat direto para /api/meta-analyst');
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/meta-analyst',
    onError: (error) => {
      console.log('🧪 [NEXUS-TEST] ERRO:', error);
    },
    onResponse: (response) => {
      console.log('🧪 [NEXUS-TEST] RESPOSTA RECEBIDA:', response);
    },
    onFinish: (message) => {
      console.log('🧪 [NEXUS-TEST] MENSAGEM FINALIZADA:', message);
    }
  });

  console.log('🧪 [NEXUS-TEST] Estado atual:', { 
    messagesCount: messages.length, 
    isLoading, 
    input 
  });

  return (
    <div style={{ 
      marginLeft: '25%', 
      marginRight: '25%', 
      backgroundColor: '#f0f8ff', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ 
        padding: '20px', 
        background: 'linear-gradient(90deg, #4CAF50, #2196F3)',
        color: 'white',
        textAlign: 'center',
        marginBottom: '20px',
        borderRadius: '8px'
      }}>
        <h1>🧪 NEXUS TEST - MetaAnalyst ONLY</h1>
        <p>Esta página FORÇA o uso do MetaAnalyst - /api/meta-analyst</p>
        <p>Status: {isLoading ? 'Carregando...' : 'Pronto'}</p>
        <p>Mensagens: {messages.length}</p>
      </div>

      {/* Área de mensagens */}
      <div style={{ 
        backgroundColor: 'white', 
        minHeight: '300px', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        border: '2px solid #2196F3'
      }}>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>
            Envie uma mensagem para testar o MetaAnalyst...
          </p>
        ) : (
          messages.map((message, index) => (
            <div key={index} style={{ 
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: message.role === 'user' ? '#e3f2fd' : '#f3e5f5',
              borderRadius: '5px'
            }}>
              <strong>{message.role === 'user' ? 'Você' : 'MetaAnalyst'}:</strong>
              <div>{message.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div style={{ textAlign: 'center', color: '#2196F3' }}>
            🤖 MetaAnalyst está pensando...
          </div>
        )}
      </div>

      {/* Formulário de envio */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Digite sua mensagem aqui..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '5px',
            border: '2px solid #2196F3',
            fontSize: '16px'
          }}
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {isLoading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}