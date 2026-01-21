import { atom } from 'nanostores';
import { updateAtomDeep } from './utils';

export type LineChartDefaults = {
  height: number;
  format: 'currency'|'percent'|'number';
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

