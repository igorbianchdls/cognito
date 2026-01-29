export type ThemeOverrides = {
  components: {
    Header?: Record<string, unknown>;
    Card?: Record<string, unknown>;
    Kpi?: Record<string, unknown>;
    BarChart?: Record<string, unknown>;
    LineChart?: Record<string, unknown>;
    PieChart?: Record<string, unknown>;
    Div?: Record<string, unknown>;
    Slicer?: Record<string, unknown>;
    SlicerCard?: Record<string, unknown>;
  };
  cssVars?: Record<string, string>;
};

export const builtInThemes: Record<string, ThemeOverrides> = {
  black: {
    components: {
      Card: { backgroundColor: '#000000', borderColor: '#333333', borderWidth: 1 },
      Header: { backgroundColor: '#000000', textColor: '#ffffff', subtitleColor: '#bbbbbb', borderColor: '#444444', borderWidth: 1 },
      Kpi: { format: 'currency' },
      Div: { gap: 12 },
      BarChart: { colorScheme: ['#ffffff'], nivo: { gridY: true } },
      LineChart: { colorScheme: ['#ffffff'], nivo: { gridY: true } },
      PieChart: { colorScheme: ['#ffffff','#aaaaaa','#666666'] },
      Slicer: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98] shadow-sm', selectedClass: 'bg-white text-black border-white hover:bg-gray-50', unselectedClass: 'bg-black text-white border-gray-700 hover:bg-gray-900' } },
      SlicerCard: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98] shadow-sm', selectedClass: 'bg-white text-black border-white hover:bg-gray-50', unselectedClass: 'bg-black text-white border-gray-700 hover:bg-gray-900' } },
    },
    cssVars: { bg: '#000000', fg: '#ffffff' }
  },
  light: {
    components: {
      Card: { backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 8, padding: 12 },
      Header: { backgroundColor: '#ffffff', textColor: '#111827', subtitleColor: '#6b7280', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 8, padding: 12 },
      Kpi: { format: 'number' },
      Div: { gap: 12 },
      BarChart: { colorScheme: ['#3b82f6'], nivo: { gridY: true } },
      LineChart: { colorScheme: ['#3b82f6'], nivo: { gridY: true, curve: 'monotoneX' } },
      PieChart: { colorScheme: ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'] },
      Slicer: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98] shadow-sm', selectedClass: 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700', unselectedClass: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200' } },
      SlicerCard: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98] shadow-sm', selectedClass: 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700', unselectedClass: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200' } },
    },
    cssVars: { bg: '#ffffff', fg: '#111827' }
  },
  blue: {
    components: {
      Card: { backgroundColor: '#eff6ff', borderColor: '#93c5fd', borderWidth: 1, borderRadius: 8, padding: 12 },
      Header: { backgroundColor: '#1e3a8a', textColor: '#ffffff', subtitleColor: '#c7d2fe', borderColor: '#1d4ed8', borderWidth: 1, borderRadius: 8, padding: 12 },
      Kpi: { format: 'currency' },
      Div: { gap: 12 },
      BarChart: { colorScheme: ['#2563eb'], nivo: { gridY: true } },
      LineChart: { colorScheme: ['#2563eb'], nivo: { gridY: true, curve: 'monotoneX' } },
      PieChart: { colorScheme: ['#2563eb','#10b981','#60a5fa','#0ea5e9','#06b6d4'] },
      Slicer: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98] shadow-sm', selectedClass: 'bg-white text-blue-900 border-white hover:bg-blue-50', unselectedClass: 'bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200' } },
      SlicerCard: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98] shadow-sm', selectedClass: 'bg-white text-blue-900 border-white hover:bg-blue-50', unselectedClass: 'bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200' } },
    },
    cssVars: { bg: '#eff6ff', fg: '#0f172a' }
  },
};
