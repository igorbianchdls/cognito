'use client';

import { useState } from 'react';
import SheetsChat from './SheetsChat';
import DatasetsSidebar from './DatasetsSidebar';

type TabType = 'chat' | 'datasets';

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  const tabs = [
    {
      id: 'chat' as TabType,
      name: 'Chat',
      icon: '💬',
      description: 'Conversar sobre dados'
    },
    {
      id: 'datasets' as TabType,
      name: 'Datasets',
      icon: '📊',
      description: 'Gerenciar conjuntos de dados'
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
                <span className="text-sm lg:text-base">{tab.icon}</span>
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