import { atom } from 'nanostores';
import { updateAtomDeep } from './utils';

export type HeaderDefaults = {
  align?: 'left'|'center'|'right';
  backgroundColor?: string;
  textColor?: string;
  subtitleColor?: string;
  padding?: number|string;
  margin?: number|string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  width?: number|string;
  height?: number|string;
};

export const $headerDefaults = atom<HeaderDefaults>({
  align: 'left',
  backgroundColor: 'transparent',
  textColor: '#111827',
  subtitleColor: '#6b7280',
  padding: 12,
  borderWidth: 0,
  borderRadius: 0,
});

export const headerDefaultsActions = {
  set(partial: Partial<HeaderDefaults>) {
    updateAtomDeep($headerDefaults as any, partial as any);
  }
};

