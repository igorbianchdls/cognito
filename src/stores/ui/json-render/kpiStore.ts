import { atom } from 'nanostores';
import { updateAtomDeep } from './utils';

export type KpiDefaults = {
  format: 'currency'|'percent'|'number';
  unit?: string;
  trend?: 'auto'|'up'|'down'|'flat';
};

export const $kpiDefaults = atom<KpiDefaults>({
  format: 'number',
  trend: 'auto',
});

export const kpiDefaultsActions = {
  set(partial: Partial<KpiDefaults>) {
    updateAtomDeep($kpiDefaults as any, partial as any);
  }
};

