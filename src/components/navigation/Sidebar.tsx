'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SidebarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState<string>('home');
  const router = useRouter();

  const sidebarItems: SidebarItem[] = [
    {
      id: 'home',
      label: 'Início',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'discover',
      label: 'Descobrir',
      href: '/chat',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      id: 'orgchart',
      label: 'Organograma',
      href: '/orgchart',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'spaces',
      label: 'Espaços',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      onClick: () => {
        console.log('Espaços');
      }
    },
    {
      id: 'library',
      label: 'Biblioteca',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
      onClick: () => {
        console.log('Biblioteca');
      }
    }
  ];

  const handleItemClick = (item: SidebarItem) => {
    setActiveItem(item.id);
    if (item.href) {
      router.push(item.href);
    } else {
      item.onClick?.();
    }
  };

  return (
    <div className="w-14 bg-[#f8f9fa] dark:bg-[#1a1a1a] border-r border-[#e8eaed] dark:border-[#2d2d2d] flex flex-col">
      {/* Logo/Brand */}
      <div className="h-14 flex items-center justify-center">
        <div className="w-7 h-7 bg-[#1a73e8] rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6">
        <div className="space-y-3 px-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${
                activeItem === item.id
                  ? 'bg-[#e8f0fe] dark:bg-[#1e3a5f] text-[#1a73e8] dark:text-[#4285f4]'
                  : 'text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2d2d] hover:text-[#202124] dark:hover:text-[#e8eaed]'
              }`}
              title={item.label}
            >
              {item.icon}
              
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-2 py-1 bg-[#202124] dark:bg-[#2d2d2d] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {item.label}
              </div>
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom Section - User */}
      <div className="p-2">
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2d2d] hover:text-[#202124] dark:hover:text-[#e8eaed] transition-all duration-200 group relative"
          title="Perfil"
          onClick={() => console.log('Perfil')}
        >
          <div className="w-6 h-6 bg-[#1a73e8] rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">U</span>
          </div>
          
          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-2 py-1 bg-[#202124] dark:bg-[#2d2d2d] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
            Perfil
          </div>
        </button>
      </div>
    </div>
  );
}