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

export type LineChartDefaults = {
  height: number;
  format: 'currency'|'percent'|'number';
  titleStyle?: TitleStyle;
  colorScheme?: string|string[];
  nivo?: {
    gridX?: boolean;
    gridY?: boolean;
    curve?: string;
    area?: boolean;
    pointSize?: number;
    axisBottom?: { tickRotation?: number; legend?: string; legendOffset?: number };
    axisLeft?: { legend?: string; legendOffset?: number };
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    animate?: boolean;
    motionConfig?: string;
  };
};

export const $lineChartDefaults = atom<LineChartDefaults>({
  height: 220,
  format: 'number',
  titleStyle: {
    fontFamily: 'Barlow',
    fontWeight: 600,
    fontSize: 14,
    color: '#0f172a',
    letterSpacing: '0.01em',
    textTransform: 'none',
    padding: 6,
    textAlign: 'left',
  },
  colorScheme: ['#3b82f6'],
  nivo: {
    gridY: true,
    curve: 'linear',
    pointSize: 6,
    margin: { top: 10, right: 10, bottom: 40, left: 48 },
    animate: true,
    motionConfig: 'gentle',
  }
});

export const lineChartDefaultsActions = {
  set(partial: Partial<LineChartDefaults>) {
    updateAtomDeep($lineChartDefaults as any, partial as any);
  }
};
