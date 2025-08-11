// Common theme for all Nivo charts
export const nivoTheme = {
  axis: {
    ticks: {
      text: { fontSize: 12, fill: '#6b7280' }
    },
    legend: {
      text: { fontSize: 14, fill: '#374151', fontWeight: 500 }
    }
  },
  labels: {
    text: { fontSize: 11, fill: '#1f2937', fontWeight: 500 }
  },
  tooltip: {
    container: {
      background: '#ffffff',
      color: '#1f2937',
      fontSize: 12,
      borderRadius: 8,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }
  }
};

// Common color schemes
export const colorSchemes = {
  primary: 'blue_green',
  secondary: 'category10',
  accent: 'paired'
} as const;