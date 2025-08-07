'use client';

import { useStore } from '@nanostores/react';
import { getActiveDatasetInfo } from '@/stores/sheetsStore';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

interface TableHeaderProps {
  className?: string;
}

export default function TableHeader({ className = '' }: TableHeaderProps) {
  const datasetInfo = getActiveDatasetInfo();
  
  return (
    <div className={`border-b bg-white px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-600">{datasetInfo?.name || 'Dataset'}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">Default View</span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Data/Details Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button className="px-3 py-1.5 text-sm bg-white text-gray-900 rounded-md shadow-sm font-medium transition-colors">
              Data
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-600 rounded-md font-medium transition-colors hover:bg-white hover:text-gray-900">
              Details
            </button>
          </div>
          
          {/* Share Button */}
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-lg flex items-center space-x-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>
      </div>
    </div>
  );
}