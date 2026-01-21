import { atom } from 'nanostores';
import { updateAtomDeep } from './utils';

export type BarChartDefaults = {
  height: number;
  format: 'currency'|'percent'|'number';
  colorScheme?: string|string[];
  nivo?: {
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
  colorScheme: ['#3b82f6'],
  nivo: {
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

