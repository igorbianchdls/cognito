'use client';

import { useState } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';

// Mock data for testing
const mockData = [
  { x: 'Jan', y: 120, label: 'Jan', value: 120 },
  { x: 'Feb', y: 180, label: 'Feb', value: 180 },
  { x: 'Mar', y: 150, label: 'Mar', value: 150 },
  { x: 'Apr', y: 200, label: 'Apr', value: 200 },
  { x: 'May', y: 170, label: 'May', value: 170 },
];

export default function ChartsTestPage() {
  // State for each chart's props
  const [barProps, setBarProps] = useState({ translateY: 0, marginBottom: 40 });
  const [lineProps, setLineProps] = useState({ translateY: 0, marginBottom: 40 });
  const [pieProps, setPieProps] = useState({ translateY: 0, marginBottom: 40 });
  const [areaProps, setAreaProps] = useState({ translateY: 0, marginBottom: 40 });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Chart Adjustment Test</h1>

      <div className="grid grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Bar Chart</h2>

          {/* Controls */}
          <div className="mb-4 space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                translateY: {barProps.translateY}px
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                value={barProps.translateY}
                onChange={(e) => setBarProps({ ...barProps, translateY: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                marginBottom: {barProps.marginBottom}px
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={barProps.marginBottom}
                onChange={(e) => setBarProps({ ...barProps, marginBottom: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Chart Preview */}
          <div className="h-80 border border-gray-200 rounded">
            <BarChart
              data={mockData}
              title="Bar Chart Test"
              translateY={barProps.translateY}
              margin={{ top: 20, right: 20, bottom: barProps.marginBottom, left: 40 }}
            />
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Line Chart</h2>

          {/* Controls */}
          <div className="mb-4 space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                translateY: {lineProps.translateY}px
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                value={lineProps.translateY}
                onChange={(e) => setLineProps({ ...lineProps, translateY: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                marginBottom: {lineProps.marginBottom}px
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={lineProps.marginBottom}
                onChange={(e) => setLineProps({ ...lineProps, marginBottom: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Chart Preview */}
          <div className="h-80 border border-gray-200 rounded">
            <LineChart
              data={mockData}
              title="Line Chart Test"
              translateY={lineProps.translateY}
              margin={{ top: 20, right: 20, bottom: lineProps.marginBottom, left: 40 }}
            />
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Pie Chart</h2>

          {/* Controls */}
          <div className="mb-4 space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                translateY: {pieProps.translateY}px
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                value={pieProps.translateY}
                onChange={(e) => setPieProps({ ...pieProps, translateY: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                marginBottom: {pieProps.marginBottom}px
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={pieProps.marginBottom}
                onChange={(e) => setPieProps({ ...pieProps, marginBottom: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Chart Preview */}
          <div className="h-80 border border-gray-200 rounded">
            <PieChart
              data={mockData}
              title="Pie Chart Test"
              translateY={pieProps.translateY}
              margin={{ top: 20, right: 20, bottom: pieProps.marginBottom, left: 20 }}
            />
          </div>
        </div>

        {/* Area Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Area Chart</h2>

          {/* Controls */}
          <div className="mb-4 space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                translateY: {areaProps.translateY}px
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                value={areaProps.translateY}
                onChange={(e) => setAreaProps({ ...areaProps, translateY: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                marginBottom: {areaProps.marginBottom}px
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={areaProps.marginBottom}
                onChange={(e) => setAreaProps({ ...areaProps, marginBottom: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Chart Preview */}
          <div className="h-80 border border-gray-200 rounded">
            <AreaChart
              data={mockData}
              title="Area Chart Test"
              translateY={areaProps.translateY}
              margin={{ top: 20, right: 20, bottom: areaProps.marginBottom, left: 40 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
