export type ThemeOverrides = {
  components: {
    Header?: Record<string, unknown>;
    Card?: Record<string, unknown>;
    Kpi?: Record<string, unknown>;
    BarChart?: Record<string, unknown>;
    LineChart?: Record<string, unknown>;
    PieChart?: Record<string, unknown>;
    Div?: Record<string, unknown>;
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
    },
    cssVars: { bg: '#000000', fg: '#ffffff' }
  },
};

