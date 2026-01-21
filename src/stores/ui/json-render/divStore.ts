import { atom } from 'nanostores';
import { updateAtomDeep } from './utils';

export type DivDefaults = {
  direction?: 'row'|'column';
  gap?: number|string;
  wrap?: boolean;
  justify?: 'start'|'center'|'end'|'between'|'around'|'evenly';
  align?: 'start'|'center'|'end'|'stretch';
  padding?: number|string;
  margin?: number|string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  width?: number|string;
  height?: number|string;
};

export const $divDefaults = atom<DivDefaults>({
  direction: 'column',
  gap: 8,
  wrap: false,
  justify: 'start',
  align: 'stretch',
  padding: 0,
  backgroundColor: 'transparent',
  borderWidth: 0,
  borderRadius: 0,
});

export const divDefaultsActions = {
  set(partial: Partial<DivDefaults>) {
    updateAtomDeep($divDefaults as any, partial as any);
  }
};

