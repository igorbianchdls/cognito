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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [activeItem, setActiveItem] = useState<string>('nexus');
  const router = useRouter();

  const sidebarItems: SidebarItem[] = [
    {
      id: 'nexus',
      label: 'Nexus',
      href: '/nexus',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      id: 'apps',
      label: 'Apps',
      href: '/apps',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
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
      id: 'bigquery-test',
      label: 'BigQuery',
      href: '/bigquery-test',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      )
    },
  ];

  const handleItemClick = (item: SidebarItem) => {
    setActiveItem(item.id);
    if (item.href) {
      router.push(item.href);
    } else {
      item.onClick?.();
    }
    // Close mobile menu when item is clicked
    onClose?.();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 md:w-20
        bg-[#f8f9fa] dark:bg-[#1a1a1a] 
        border-r border-[#e8eaed] dark:border-[#2d2d2d] 
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile Header with Close Button */}
        <div className="md:hidden flex items-center justify-between h-14 px-4 border-b border-[#e8eaed] dark:border-[#2d2d2d]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#1a73e8] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-lg font-semibold text-[#202124] dark:text-[#e8eaed]">Menu</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2d2d]"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Desktop Logo */}
        <div className="hidden md:flex h-14 items-center justify-center">
          <div className="w-7 h-7 bg-[#1a73e8] rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6">
          <div className="space-y-3 px-2 md:px-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`w-full md:w-16 h-12 md:h-auto rounded-lg flex items-center md:flex-col md:items-center gap-3 md:gap-0 px-4 md:px-2 md:py-2 transition-all duration-200 group relative ${
                  activeItem === item.id
                    ? 'bg-[#f3f4f6] dark:bg-[#374151] text-[#374151] dark:text-[#9ca3af]'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2d2d] hover:text-[#202124] dark:hover:text-[#e8eaed]'
                }`}
                title={item.label}
              >
                {item.icon}
                
                {/* Desktop Title Below Icon */}
                <span className="hidden md:block text-xs font-medium mt-1 text-center truncate w-full">
                  {item.label}
                </span>
                
                {/* Mobile Label */}
                <span className="md:hidden text-sm font-medium">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom Section - User */}
        <div className="p-2">
          <button
            className="w-full md:w-16 h-12 md:h-auto rounded-lg flex items-center md:flex-col md:items-center gap-3 md:gap-0 px-4 md:px-2 md:py-2 text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2d2d] hover:text-[#202124] dark:hover:text-[#e8eaed] transition-all duration-200 group relative"
            title="Perfil"
            onClick={() => console.log('Perfil')}
          >
            <div className="w-6 h-6 bg-[#1a73e8] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">U</span>
            </div>
            
            {/* Desktop Title Below Icon */}
            <span className="hidden md:block text-xs font-medium mt-1 text-center truncate w-full">
              Perfil
            </span>
            
            {/* Mobile Label */}
            <span className="md:hidden text-sm font-medium">
              Perfil
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
