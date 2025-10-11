'use client';

import { useEffect, useRef } from 'react';
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '@handsontable/react-wrapper';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

// Registrar todos os módulos do Handsontable
registerAllModules();

// Dados de exemplo
const sampleData = [
  ['', 'Tesla', 'Volvo', 'Toyota', 'Ford', 'Honda', 'BMW'],
  ['2019', 10, 11, 12, 13, 15, 16],
  ['2020', 20, 11, 14, 13, 15, 12],
  ['2021', 30, 15, 12, 13, 15, 16],
  ['2022', 40, 16, 14, 13, 19, 18],
  ['2023', 50, 18, 16, 15, 20, 22],
  ['2024', 60, 20, 18, 17, 22, 24],
];

const columnHeaders = ['Year', 'Tesla', 'Volvo', 'Toyota', 'Ford', 'Honda', 'BMW'];

export default function HandsontablePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Handsontable Test
        </h1>
        <p className="text-gray-600 mb-8">
          Teste de integração do Handsontable com React e Next.js
        </p>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Vendas de Automóveis por Ano
          </h2>

          <div className="overflow-x-auto">
            <HotTable
              data={sampleData}
              colHeaders={columnHeaders}
              rowHeaders={true}
              width="100%"
              height="auto"
              licenseKey="non-commercial-and-evaluation"
              contextMenu={true}
              manualColumnResize={true}
              manualRowResize={true}
              filters={true}
              dropdownMenu={true}
              columnSorting={true}
              className="htCenter htMiddle"
              stretchH="all"
            />
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Funcionalidades Habilitadas:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Menu de contexto (clique direito)</li>
              <li>✅ Redimensionamento de colunas e linhas</li>
              <li>✅ Filtros</li>
              <li>✅ Menu dropdown nas colunas</li>
              <li>✅ Ordenação de colunas</li>
              <li>✅ Headers de linha e coluna</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Informações
          </h2>
          <div className="space-y-2 text-gray-700">
            <p>
              <strong>Biblioteca:</strong> Handsontable v16.1.1
            </p>
            <p>
              <strong>Licença:</strong> Non-commercial and evaluation
            </p>
            <p>
              <strong>Documentação:</strong>{' '}
              <a
                href="https://handsontable.com/docs/react-data-grid/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                handsontable.com/docs/react-data-grid/
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
