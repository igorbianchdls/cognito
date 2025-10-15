'use client';

import { useState } from 'react';
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
  // Estados para customização
  const [cellBgColor, setCellBgColor] = useState('#ffffff');
  const [cellTextColor, setCellTextColor] = useState('#1e293b');
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState<'geist' | 'inter'>('geist');
  const [headerBgColor, setHeaderBgColor] = useState('#334155');
  const [headerTextColor, setHeaderTextColor] = useState('#ffffff');
  const [borderColor, setBorderColor] = useState('#e2e8f0');
  const [zebraBgColor, setZebraBgColor] = useState('#f8fafc');

  // Gerar CSS dinâmico
  const dynamicStyles = `
    .handsontable td {
      background-color: ${cellBgColor} !important;
      color: ${cellTextColor} !important;
      font-size: ${fontSize}px !important;
      font-family: var(--font-${fontFamily === 'geist' ? 'geist-sans' : 'inter'}) !important;
      border-color: ${borderColor} !important;
    }

    .handsontable thead th {
      background-color: ${headerBgColor} !important;
      color: ${headerTextColor} !important;
      font-weight: 600 !important;
      font-size: ${fontSize}px !important;
      font-family: var(--font-${fontFamily === 'geist' ? 'geist-sans' : 'inter'}) !important;
      border-color: ${borderColor} !important;
    }

    .handsontable tbody tr:nth-child(even) td {
      background-color: ${zebraBgColor} !important;
    }

    .handsontable td:hover {
      filter: brightness(0.95);
    }

    .handsontable th {
      border-color: ${borderColor} !important;
    }
  `;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <style>{dynamicStyles}</style>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Handsontable - Customização Interativa
        </h1>
        <p className="text-gray-600 mb-8">
          Ajuste as cores, fontes e estilos em tempo real
        </p>

        {/* Controles de Customização */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🎨 Controles de Design
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Células */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 border-b pb-2">Células</h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cor de Fundo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cellBgColor}
                    onChange={(e) => setCellBgColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={cellBgColor}
                    onChange={(e) => setCellBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cor do Texto
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cellTextColor}
                    onChange={(e) => setCellTextColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={cellTextColor}
                    onChange={(e) => setCellTextColor(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tamanho da Fonte: {fontSize}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="20"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Família da Fonte
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fontFamily"
                      value="geist"
                      checked={fontFamily === 'geist'}
                      onChange={(e) => setFontFamily(e.target.value as 'geist' | 'inter')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Geist</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fontFamily"
                      value="inter"
                      checked={fontFamily === 'inter'}
                      onChange={(e) => setFontFamily(e.target.value as 'geist' | 'inter')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Inter</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Headers */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 border-b pb-2">Headers</h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cor de Fundo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={headerBgColor}
                    onChange={(e) => setHeaderBgColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={headerBgColor}
                    onChange={(e) => setHeaderBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cor do Texto
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={headerTextColor}
                    onChange={(e) => setHeaderTextColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={headerTextColor}
                    onChange={(e) => setHeaderTextColor(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Bordas e Zebra */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 border-b pb-2">Outros</h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cor das Bordas
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Linhas Alternadas
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={zebraBgColor}
                    onChange={(e) => setZebraBgColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={zebraBgColor}
                    onChange={(e) => setZebraBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  setCellBgColor('#ffffff');
                  setCellTextColor('#1e293b');
                  setFontSize(14);
                  setFontFamily('geist');
                  setHeaderBgColor('#334155');
                  setHeaderTextColor('#ffffff');
                  setBorderColor('#e2e8f0');
                  setZebraBgColor('#f8fafc');
                }}
                className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                🔄 Resetar Padrão
              </button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📊 Preview da Tabela
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
              manualColumnMove={true}
              manualColumnFreeze={true}
              hiddenColumns={{ indicators: true }}
              filters={true}
              dropdownMenu={{
                items: [
                  'filter_by_condition',
                  'filter_by_value',
                  'filter_action_bar',
                  'separator',
                  'undo',
                  'redo',
                  'clear_column',
                  'alignment',
                  'separator',
                  'freeze_column',
                  'unfreeze_column',
                  'hidden_columns_hide',
                  'hidden_columns_show',
                ],
              }}
              multiColumnSorting={true}
              className="htCenter htMiddle"
              stretchH="all"
            />
          </div>
        </div>

        {/* Valores Atuais CSS */}
        <div className="mt-8 bg-gray-800 text-gray-100 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">
            💻 CSS Gerado
          </h2>
          <pre className="text-xs overflow-x-auto">
            <code>{dynamicStyles}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
