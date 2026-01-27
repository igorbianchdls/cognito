import { atom } from 'nanostores';
import { updateAtomDeep } from './utils';

export type TitleStyle = {
  fontFamily?: string;
  fontWeight?: string | number;
  fontSize?: number | string;
  color?: string;
  letterSpacing?: number | string;
  textTransform?: 'none'|'uppercase'|'lowercase'|'capitalize';
  padding?: number | string;
  margin?: number | string;
  textAlign?: 'left'|'center'|'right';
};

export type BarChartDefaults = {
  height: number;
  format: 'currency'|'percent'|'number';
  titleStyle?: TitleStyle;
  colorScheme?: string|string[];
  nivo?: {
    layout?: 'vertical'|'horizontal';
    padding?: number;
    groupMode?: 'grouped'|'stacked';
    gridX?: boolean;
    gridY?: boolean;
    enableLabel?: boolean;
    labelSkipWidth?: number;
    labelSkipHeight?: number;
    labelTextColor?: string;
    axisBottom?: { tickRotation?: number; legend?: string; legendOffset?: number };
    axisLeft?: { legend?: string; legendOffset?: number };
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    animate?: boolean;
    motionConfig?: string;
  };
};

export const $barChartDefaults = atom<BarChartDefaults>({
  height: 220,
  format: 'number',
  titleStyle: {
    fontFamily: 'Barlow',
    fontWeight: 700,
    fontSize: 16,
    color: '#0f172a',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    padding: 8,
    textAlign: 'left',
  },
  colorScheme: ['#3b82f6'],
  nivo: {
    layout: 'vertical',
    padding: 0.3,
    groupMode: 'grouped',
    gridY: true,
    axisBottom: { tickRotation: 0, legendOffset: 32 },
    axisLeft: { legendOffset: 40 },
    margin: { top: 10, right: 10, bottom: 40, left: 48 },
    animate: true,
    motionConfig: 'gentle',
  }
});

export const barChartDefaultsActions = {
  set(partial: Partial<BarChartDefaults>) {
    updateAtomDeep($barChartDefaults as any, partial as any);
  }
};
