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
      Header: { backgroundColor: 'var(--bg)', textColor: 'var(--fg)', subtitleColor: '#bbbbbb', borderColor: 'var(--surfaceBorder)', borderWidth: 0, borderBottomWidth: 1, borderRadius: 0, padding: '4px 12px' },
      Kpi: { format: 'currency', containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' } },
      Div: { gap: 12 },
      BarChart: { containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' }, nivo: { gridY: false } },
      LineChart: { containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' }, nivo: { gridY: false } },
      PieChart: { containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' } },
      Slicer: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]', selectedClass: 'bg-white text-black border-white hover:bg-gray-50', unselectedClass: 'bg-black text-white border-gray-700 hover:bg-gray-900' } },
      SlicerCard: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]', selectedClass: 'bg-white text-black border-white hover:bg-gray-50', unselectedClass: 'bg-black text-white border-gray-700 hover:bg-gray-900' }, containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' } },
    },
    cssVars: { }
  },
  dark: {
    components: {
      Card: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)', borderWidth: 1, borderRadius: 8, padding: 12 },
      Header: { backgroundColor: 'var(--bg)', textColor: 'var(--fg)', subtitleColor: '#a3a3a3', borderColor: 'var(--surfaceBorder)', borderWidth: 0, borderBottomWidth: 1, borderRadius: 0, padding: '4px 12px' },
      Kpi: { format: 'number', containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' } },
      Div: { gap: 12 },
      BarChart: {
        containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' },
        nivo: {
          gridY: false,
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
        containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' },
        nivo: {
          gridY: false,
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
          baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.98]',
          selectedClass: 'bg-[#2563eb] text-white border-[#2563eb] hover:bg-[#1e40af]',
          unselectedClass: 'bg-[#111111] text-[#e5e7eb] border-[#333333] hover:bg-[#161616]',
        },
      },
      SlicerCard: {
        tile: {
          baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.98]',
          selectedClass: 'bg-[#2563eb] text-white border-[#2563eb] hover:bg-[#1e40af]',
          unselectedClass: 'bg-[#111111] text-[#e5e7eb] border-[#333333] hover:bg-[#161616]',
        },
        containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' },
      },
    },
    cssVars: { },
  },
  light: {
    components: {
      Card: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)', borderWidth: 1, borderRadius: 8, padding: 12 },
      Header: { backgroundColor: 'var(--bg)', textColor: 'var(--fg)', subtitleColor: '#6b7280', borderColor: 'var(--surfaceBorder)', borderWidth: 0, borderBottomWidth: 1, borderRadius: 0, padding: '4px 12px' },
      Kpi: { format: 'number' },
      Div: { gap: 12 },
      BarChart: { nivo: { gridY: false } },
      LineChart: { nivo: { gridY: false, curve: 'monotoneX' } },
      PieChart: { },
      Slicer: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]', selectedClass: 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700', unselectedClass: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200' } },
      SlicerCard: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]', selectedClass: 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700', unselectedClass: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200' } },
    },
    cssVars: { }
  },
  blue: {
    components: {
      Card: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)', borderWidth: 1, borderRadius: 8, padding: 12 },
      Header: { backgroundColor: 'var(--bg)', textColor: 'var(--fg)', subtitleColor: '#0f172a', borderColor: 'var(--surfaceBorder)', borderWidth: 0, borderBottomWidth: 1, borderRadius: 0, padding: '4px 12px' },
      Kpi: { format: 'currency' },
      Div: { gap: 12 },
      BarChart: { nivo: { gridY: false } },
      LineChart: { nivo: { gridY: false, curve: 'monotoneX' } },
      PieChart: { },
      Slicer: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]', selectedClass: 'bg-white text-blue-900 border-white hover:bg-blue-50', unselectedClass: 'bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200' } },
      SlicerCard: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]', selectedClass: 'bg-white text-blue-900 border-white hover:bg-blue-50', unselectedClass: 'bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200' } },
    },
    cssVars: { }
  },
};
