'use client';

import { useState } from 'react';
import { getActiveDatasetInfo } from '@/stores/sheetsStore';

interface TableHeaderProps {
  className?: string;
}

export default function TableHeader({ className = '' }: TableHeaderProps) {
  const [activeView, setActiveView] = useState<'data' | 'details'>('data');
  const datasetInfo = getActiveDatasetInfo();
  
  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side - Breadcrumb */}
        <div className="flex items-center">
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium text-gray-900">{datasetInfo?.name || 'Dataset'}</span>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-600">Default View</span>
          </div>
        </div>
        
        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Data/Details Toggle */}
          <div className="flex items-center bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => setActiveView('data')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all duration-200 ${
                activeView === 'data'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Data
            </button>
            <button
              onClick={() => setActiveView('details')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all duration-200 ${
                activeView === 'details'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Details
            </button>
          </div>
          
          {/* Share Button */}
          <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  );
}