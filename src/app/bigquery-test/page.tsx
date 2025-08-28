'use client';

import Sidebar from '@/components/navigation/Sidebar';
import { Card } from '@/components/ui/card';
import { SQLEditor } from '@/components/sql-editor';

export default function BigQueryTestPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">SQL Editor Test</h1>
          
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Teste do SQLEditor</h2>
            <p className="text-gray-600 mb-4">
              Editor SQL com Monaco Editor, execução automática e renderização de resultados em tabela.
            </p>
          </Card>

          <SQLEditor 
            initialSQL="SELECT * FROM `creatto-463117.biquery_data.campanhas` LIMIT 10"
            onSQLChange={(sql) => console.log('SQL changed:', sql)}
            height="300px"
          />
        </div>
      </div>
    </div>
  );
}