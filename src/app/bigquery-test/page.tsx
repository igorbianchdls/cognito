'use client';

import Sidebar from '@/components/navigation/Sidebar';
import { Card } from '@/components/ui/card';

export default function BigQueryTestPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">BigQuery Test Console</h1>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Página Limpa</h2>
            <p className="text-gray-600">
              Esta página foi limpa e está pronta para nova implementação.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}