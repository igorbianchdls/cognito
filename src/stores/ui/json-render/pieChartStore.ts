import { atom } from 'nanostores';
import { updateAtomDeep } from './utils';

export type PieChartDefaults = {
  height: number;
  format: 'currency'|'percent'|'number';
  colorScheme?: string|string[];
  nivo?: {
    innerRadius?: number;
    padAngle?: number;
    cornerRadius?: number;
    activeInnerRadiusOffset?: number;
    activeOuterRadiusOffset?: number;
    enableArcLabels?: boolean;
    arcLabelsSkipAngle?: number;
    arcLabelsTextColor?: string;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    animate?: boolean;
    motionConfig?: string;
  };
};

export const $pieChartDefaults = atom<PieChartDefaults>({
  height: 220,
  format: 'number',
  colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  nivo: {
    innerRadius: 0,
    padAngle: 0.7,
    cornerRadius: 3,
    activeOuterRadiusOffset: 8,
    enableArcLabels: true,
    arcLabelsSkipAngle: 10,
    arcLabelsTextColor: '#333333',
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    animate: true,
    motionConfig: 'gentle',
  }
});

export const pieChartDefaultsActions = {
  set(partial: Partial<PieChartDefaults>) {
    updateAtomDeep($pieChartDefaults as any, partial as any);
  }
};

