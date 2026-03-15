export type ThemeOverrides = {
  components: {
    Header?: Record<string, unknown>;
    Card?: Record<string, unknown>;
    Title?: Record<string, unknown>;
    Subtitle?: Record<string, unknown>;
    Icon?: Record<string, unknown>;
    Kpi?: Record<string, unknown>;
    BarChart?: Record<string, unknown>;
    LineChart?: Record<string, unknown>;
    PieChart?: Record<string, unknown>;
    Table?: Record<string, unknown>;
    Container?: Record<string, unknown>;
    Sidebar?: Record<string, unknown>;
    Slicer?: Record<string, unknown>;
    SlicerCard?: Record<string, unknown>;
    AISummary?: Record<string, unknown>;
  };
  cssVars?: Record<string, string>;
};

export const builtInThemes: Record<string, ThemeOverrides> = {
  black: {
    components: {
      Card: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)', borderWidth: 1, borderRadius: 8, padding: 12 },
      Header: { backgroundColor: 'var(--headerBg, var(--bg))', textColor: 'var(--headerText, var(--fg))', subtitleColor: 'var(--headerSubtitle, #bbbbbb)', borderColor: 'var(--headerBorder, var(--surfaceBorder))', borderWidth: 0, borderBottomWidth: 0, borderRadius: 0, padding: '4px 12px' },
      Subtitle: { titleStyle: { color: 'var(--headerSubtitle, #bbbbbb)', fontSize: 12 } },
      Kpi: { format: 'currency', containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' } },
      Container: { gap: 12 },
      Sidebar: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)', borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
      BarChart: { containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' }, nivo: { gridY: false } },
      LineChart: { containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' }, nivo: { gridY: false } },
      PieChart: { containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' } },
      Table: { containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' }, headerBackground: 'var(--surfaceBg)', headerTextColor: 'var(--fg)', borderColor: 'var(--surfaceBorder)', cellTextColor: 'var(--fg)' },
      Slicer: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]', selectedClass: 'bg-white text-black border-white hover:bg-gray-50', unselectedClass: 'bg-black text-white border-gray-700 hover:bg-gray-900' } },
      SlicerCard: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]', selectedClass: 'bg-white text-black border-white hover:bg-gray-50', unselectedClass: 'bg-black text-white border-gray-700 hover:bg-gray-900' }, containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' } },
    },
    cssVars: { }
  },
  dark: {
    components: {
      Card: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)', borderWidth: 1, borderRadius: 8, padding: 12 },
      Header: { backgroundColor: 'var(--headerBg, var(--bg))', textColor: 'var(--headerText, var(--fg))', subtitleColor: 'var(--headerSubtitle, #a3a3a3)', borderColor: 'var(--headerBorder, var(--surfaceBorder))', borderWidth: 0, borderBottomWidth: 0, borderRadius: 0, padding: '4px 12px' },
      Subtitle: { titleStyle: { color: 'var(--headerSubtitle, #a3a3a3)', fontSize: 12 } },
      Kpi: { format: 'number', containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' } },
      Container: { gap: 12 },
      Sidebar: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)', borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
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
      Table: { containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' }, headerBackground: 'var(--surfaceBg)', headerTextColor: 'var(--fg)', borderColor: 'var(--surfaceBorder)', cellTextColor: 'var(--fg)' },
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
      Header: { backgroundColor: 'var(--headerBg, var(--bg))', textColor: 'var(--headerText, var(--fg))', subtitleColor: 'var(--headerSubtitle, #6b7280)', borderColor: 'var(--headerBorder, var(--surfaceBorder))', borderWidth: 0, borderBottomWidth: 0, borderRadius: 0, padding: '4px 12px' },
      Subtitle: { titleStyle: { color: 'var(--headerSubtitle, #6b7280)', fontSize: 12 } },
      Kpi: { format: 'number' },
      Container: { gap: 12 },
      Sidebar: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)', borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
      BarChart: { nivo: { gridY: false } },
      LineChart: { nivo: { gridY: false, curve: 'monotoneX' } },
      PieChart: { },
      Table: { containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' }, headerBackground: 'var(--surfaceBg)', headerTextColor: 'var(--fg)', borderColor: 'var(--surfaceBorder)', cellTextColor: 'var(--fg)' },
      Slicer: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]', selectedClass: 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700', unselectedClass: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200' } },
      SlicerCard: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]', selectedClass: 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700', unselectedClass: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200' } },
    },
    cssVars: { }
  },
  blue: {
    components: {
      Card: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)', borderWidth: 1, borderRadius: 8, padding: 12 },
      Header: { backgroundColor: 'var(--headerBg, var(--bg))', textColor: 'var(--headerText, var(--fg))', subtitleColor: 'var(--headerSubtitle, #0f172a)', borderColor: 'var(--headerBorder, var(--surfaceBorder))', borderWidth: 0, borderBottomWidth: 0, borderRadius: 0, padding: '4px 12px' },
      Subtitle: { titleStyle: { color: 'var(--headerSubtitle, #0f172a)', fontSize: 12 } },
      Kpi: { format: 'currency' },
      Container: { gap: 12 },
      Sidebar: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)', borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
      BarChart: { nivo: { gridY: false } },
      LineChart: { nivo: { gridY: false, curve: 'monotoneX' } },
      PieChart: { },
      Table: { containerStyle: { backgroundColor: 'var(--surfaceBg)', borderColor: 'var(--surfaceBorder)' }, headerBackground: 'var(--surfaceBg)', headerTextColor: 'var(--fg)', borderColor: 'var(--surfaceBorder)', cellTextColor: 'var(--fg)' },
      Slicer: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]', selectedClass: 'bg-white text-blue-900 border-white hover:bg-blue-50', unselectedClass: 'bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200' } },
      SlicerCard: { tile: { baseClass: 'text-xs font-medium border rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]', selectedClass: 'bg-white text-blue-900 border-white hover:bg-blue-50', unselectedClass: 'bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200' } },
    },
    cssVars: { }
  },
};
