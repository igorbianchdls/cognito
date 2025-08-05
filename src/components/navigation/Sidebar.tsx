'use client';

import { useState } from 'react';

interface SidebarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState<string>('chat');

  const sidebarItems: SidebarItem[] = [
    {
      id: 'chat',
      label: 'Nova Conversa',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      onClick: () => {
        // TODO: Nova conversa
        console.log('Nova conversa');
      }
    },
    {
      id: 'history',
      label: 'Histórico',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => {
        // TODO: Histórico de conversas
        console.log('Histórico');
      }
    },
    {
      id: 'favorites',
      label: 'Favoritos',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      onClick: () => {
        // TODO: Conversas favoritas
        console.log('Favoritos');
      }
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      onClick: () => {
        // TODO: Configurações
        console.log('Configurações');
      }
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => {
        // TODO: Perfil do usuário
        console.log('Perfil');
      }
    }
  ];

  const handleItemClick = (item: SidebarItem) => {
    setActiveItem(item.id);
    item.onClick?.();
  };

  return (
    <div className="w-16 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo/Brand */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">C</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4">
        <div className="space-y-2 px-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
                activeItem === item.id
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title={item.label}
            >
              {item.icon}
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <button
          className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 group relative"
          title="Sair"
          onClick={() => console.log('Sair')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          
          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            Sair
          </div>
        </button>
      </div>
    </div>
  );
}