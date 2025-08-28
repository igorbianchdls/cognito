'use client';

import Sidebar from '@/components/navigation/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ChartsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Charts Showcase</h1>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              ← Voltar
            </Button>
          </div>
          
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