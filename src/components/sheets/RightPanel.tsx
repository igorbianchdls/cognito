'use client';

import { useState } from 'react';
import SheetsChat from './SheetsChat';
import DatasetsSidebar from './DatasetsSidebar';

type TabType = 'chat' | 'datasets';

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('datasets');

  const tabs = [
    {
      id: 'datasets' as TabType,
      name: 'Datasets',
      icon: '📊',
      description: 'Gerenciar conjuntos de dados'
    },
    {
      id: 'chat' as TabType,
      name: 'Chat',
      icon: '💬',
      description: 'Conversar sobre dados'
    }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab Headers */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 px-2 lg:px-4 py-3 text-xs lg:text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <div className="flex items-center justify-center gap-1 lg:gap-2">
                <span className="text-sm lg:text-base">
                  {tab.id === 'chat' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  )}
                </span>
                <span className="hidden sm:inline">{tab.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full">
            <SheetsChat />
          </div>
        )}
        
        {activeTab === 'datasets' && (
          <div className="h-full">
            <DatasetsSidebar />
          </div>
        )}
      </div>
    </div>
  );
}