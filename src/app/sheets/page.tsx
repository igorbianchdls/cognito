'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const UniverSheet = dynamic(() => import('@/components/sheets/UniverSheet'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen bg-background">
      <div className="w-14 bg-[#f8f9fa] dark:bg-[#1a1a1a] border-r border-[#e8eaed] dark:border-[#2d2d2d]"></div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a73e8] mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando editor de planilhas...</p>
        </div>
      </div>
    </div>
  )
});

export default function SheetsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Suspense fallback={
        <div className="flex h-screen bg-background">
          <div className="w-14 bg-[#f8f9fa] dark:bg-[#1a1a1a] border-r border-[#e8eaed] dark:border-[#2d2d2d]"></div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a73e8] mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando editor de planilhas...</p>
            </div>
          </div>
        </div>
      }>
        <UniverSheet />
      </Suspense>
    </div>
  );
}