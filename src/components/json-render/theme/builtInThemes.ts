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
      Card: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)', borderWidth: 1 },
      Header: { backgroundColor: '#000000', textColor: '#ffffff', subtitleColor: '#bbbbbb', borderColor: '#444444', borderWidth: 1 },
      Kpi: { format: 'currency', containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' } },
      Div: { gap: 12 },
      BarChart: { colorScheme: ['#ffffff'], containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' }, nivo: { gridY: true } },
      LineChart: { colorScheme: ['#ffffff'], containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' }, nivo: { gridY: true } },
      PieChart: { colorScheme: ['#ffffff','#aaaaaa','#666666'], containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' } },
      Slicer: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98] shadow-sm', selectedClass: 'bg-white text-black border-white hover:bg-gray-50', unselectedClass: 'bg-black text-white border-gray-700 hover:bg-gray-900' } },
      SlicerCard: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98] shadow-sm', selectedClass: 'bg-white text-black border-white hover:bg-gray-50', unselectedClass: 'bg-black text-white border-gray-700 hover:bg-gray-900' }, containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' } },
    },
    cssVars: { bg: '#000000', fg: '#ffffff', surfaceBg: '#0b0b0b', surfaceBorder: '#333333' }
  },
  dark: {
    components: {
      Card: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)', borderWidth: 1, borderRadius: 8, padding: 12 },
      Header: { backgroundColor: '#000000', textColor: '#e5e7eb', subtitleColor: '#a3a3a3', borderColor: '#222222', borderWidth: 1, borderRadius: 8, padding: 12 },
      Kpi: { format: 'number', containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' } },
      Div: { gap: 12 },
      BarChart: {
        colorScheme: ['#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#ef4444'],
        containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' },
        nivo: {
          gridY: true,
          theme: {
            textColor: '#e5e7eb',
            fontSize: 12,
            axis: {
              ticks: { text: { fill: '#e5e7eb', fontSize: 12 } },
              legend: { text: { fill: '#e5e7eb', fontSize: 12 } },
            },
            labels: { text: { fill: '#e5e7eb', fontSize: 12 } },
          },
        },
      },
      LineChart: {
        colorScheme: ['#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#ef4444'],
        containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' },
        nivo: {
          gridY: true,
          curve: 'monotoneX',
          theme: {
            textColor: '#e5e7eb',
            fontSize: 12,
            axis: {
              ticks: { text: { fill: '#e5e7eb', fontSize: 12 } },
              legend: { text: { fill: '#e5e7eb', fontSize: 12 } },
            },
            labels: { text: { fill: '#e5e7eb', fontSize: 12 } },
          },
        },
      },
      PieChart: {
        colorScheme: ['#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#ef4444'],
        containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' },
        nivo: {
          innerRadius: 0.35,
          theme: {
            textColor: '#e5e7eb',
            fontSize: 12,
            labels: { text: { fill: '#e5e7eb', fontSize: 12 } },
          },
        },
      },
      Slicer: {
        tile: {
          baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.98] shadow-sm',
          selectedClass: 'bg-[#2563eb] text-white border-[#2563eb] hover:bg-[#1e40af]',
          unselectedClass: 'bg-[#111111] text-[#e5e7eb] border-[#333333] hover:bg-[#161616]',
        },
      },
      SlicerCard: {
        tile: {
          baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.98] shadow-sm',
          selectedClass: 'bg-[#2563eb] text-white border-[#2563eb] hover:bg-[#1e40af]',
          unselectedClass: 'bg-[#111111] text-[#e5e7eb] border-[#333333] hover:bg-[#161616]',
        },
        containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' },
      },
    },
    cssVars: { bg: '#0a0a0a', fg: '#e5e7eb', surfaceBg: '#111214', surfaceBorder: '#222222' },
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
